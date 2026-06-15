import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizeCompanyName } from '@/lib/adapterRegistry';
import { createJob, updateJob, completeJob, failJob, addJobData } from '@/lib/jobManager';

const { scrapeGoogleMapsStream } = require('../scripts/googleMapsScraper');

export async function POST(req: NextRequest) {
  const { location, category, mode = 'enrich' } = await req.json();

  if (!location || !category) {
    return NextResponse.json(
      { error: 'Location and category required' },
      { status: 400 }
    );
  }

  const jobId = createJob(location, category);

  // Background mein start karo (await mat karo)
  startScraping(jobId, location, category, mode).catch((error) => {
    console.error('Background scraping failed:', error);
    failJob(jobId, error.message);
  });

  return NextResponse.json({
    success: true,
    jobId,
    message: 'Scraping started in background',
  });
}

async function startScraping(jobId: string, location: string, category: string, mode: string = 'enrich') {
  let totalInserted = 0;
  let totalSkipped = 0;

  const onProgress = async (data: any) => {
    try {
      if (data.type === 'status') {
        updateJob(jobId, {
          progress: {
            current: 0,
            total: 0,
            message: data.message || '',
          },
        });
      } else if (data.type === 'found') {
        updateJob(jobId, {
          foundCount: data.count || 0,
          progress: {
            current: 0,
            total: data.count || 0,
            message: data.message || '',
          },
        });
      } else if (data.type === 'progress') {
        updateJob(jobId, {
          progress: {
            current: data.current || 0,
            total: data.total || 0,
            message: data.message || '',
          },
        });
      } else if (data.type === 'business' && data.data) {
        const lead = data.data;
        const transformed = {
          company_name: lead.company_name?.trim() || '',
          mobile_number: lead.mobile_number?.trim() || '',
          email: lead.email?.trim() || '',
          website_url: lead.website_url?.trim() || '',
          address: lead.address?.trim() || '',
          business_category: lead.business_category || category,
          google_rating: lead.google_rating || '',
          search_location: location,
          search_keyword: category,
        };

        if (!transformed.company_name) {
          totalSkipped++;
        } else {
          const normalizedName = normalizeCompanyName(transformed.company_name);

          const duplicate = await pool.query(
            `SELECT raw_id FROM lead_intelligence.raw_records
             WHERE raw_payload->>'company_name' = $1
             LIMIT 1`,
            [normalizedName]
          );

          if (duplicate.rows.length > 0) {
            totalSkipped++;
          } else {
            try {
              await pool.query(
                `INSERT INTO lead_intelligence.raw_records
                 (source_record_id, source_url, raw_payload)
                 VALUES ($1, $2, $3)`,
                [
                  `google_maps_${Date.now()}_${transformed.company_name}`,
                  transformed.website_url || null,
                  JSON.stringify(transformed),
                ]
              );
              totalInserted++;
            } catch (dbError) {
              console.error('DB INSERT ERROR:', transformed.company_name, dbError);
              totalSkipped++;
            }
          }
        }

        addJobData(jobId, data.data);
        updateJob(jobId, {
          insertedCount: totalInserted,
          skippedCount: totalSkipped,
        });
      }
    } catch (error) {
      console.error('Progress callback error:', error);
    }
  };

  try {
    // FIX: shouldStop aur mode dono pass ho rahe hain ab
    await scrapeGoogleMapsStream(location, category, onProgress, () => false, mode);

    const job = require('@/lib/jobManager').getJob(jobId);
    if (job) {
      completeJob(jobId, job.data);
    }
  } catch (error: any) {
    failJob(jobId, error.message);
  }
}