import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { normalizeCompanyName } from '@/lib/adapterRegistry';
import scrapingRegistry from '@/lib/scrapingRegistry';
const { scrapeGoogleMapsStream } = require('../scripts/googleMapsScraper');

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const location = searchParams.get('location');
  const category = searchParams.get('category');
  // FIX: mode ab properly read ho raha hai aur scraper ko pass ho raha hai
  const mode = (searchParams.get('mode') as 'fast' | 'enrich' | 'full') || 'enrich';

  if (!location || !category) {
    return new Response(
      JSON.stringify({ error: 'Location and category required' }),
      { status: 400 }
    );
  }

  const processId = scrapingRegistry.createProcess(location, category);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let totalInserted = 0;
        let totalSkipped = 0;
        let isStreamClosed = false;

        const shouldStopCheck = () => scrapingRegistry.shouldStop(processId);

        const onProgress = async (data: any) => {
          if (isStreamClosed) return;

          if (shouldStopCheck()) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'stopped',
                  message: 'Scraping stopped by user',
                  totalInserted,
                  totalSkipped,
                })}\n\n`
              )
            );
            isStreamClosed = true;
            controller.close();
            scrapingRegistry.removeProcess(processId);
            throw new Error('STOPPED_BY_USER');
          }

          try {
            if (data.type === 'business' && data.data) {
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
                data.inserted = false;
                data.totalInserted = totalInserted;
                data.totalSkipped = totalSkipped;
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
                  data.inserted = false;
                  data.totalInserted = totalInserted;
                  data.totalSkipped = totalSkipped;
                } else {
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
                  data.inserted = true;
                  data.totalInserted = totalInserted;
                  data.totalSkipped = totalSkipped;
                }
              }
            }

            // 'complete' type ab scraper se aata hai without inserted/duplicates
            // Isliye yahaan se final stats inject karte hain
            if (data.type === 'complete') {
              data.totalInserted = totalInserted;
              data.totalSkipped = totalSkipped;
            }

            if (!isStreamClosed) {
              try {
                const jsonString = JSON.stringify(data);
                const message = `data: ${jsonString}\n\n`;
                controller.enqueue(encoder.encode(message));
              } catch (jsonError) {
                console.error('JSON serialization error:', jsonError);
                const safeMessage = `data: ${JSON.stringify({
                  type: 'error',
                  message: 'Data serialization failed'
                })}\n\n`;
                controller.enqueue(encoder.encode(safeMessage));
              }
            }

            // Stream close after complete
            if (data.type === 'complete' && !isStreamClosed) {
              isStreamClosed = true;
              controller.close();
              scrapingRegistry.removeProcess(processId);
            }
          } catch (error: any) {
            if (error.message === 'STOPPED_BY_USER') throw error;
            console.error('Progress callback error:', error);
            if (data.type === 'business') {
              totalSkipped++;
              data.inserted = false;
              data.totalInserted = totalInserted;
              data.totalSkipped = totalSkipped;

              if (!isStreamClosed) {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
              }
            }
          }
        };

        // FIX: mode ab scraper ko pass ho raha hai
        await scrapeGoogleMapsStream(location, category, onProgress, shouldStopCheck, mode);

      } catch (error: any) {
        console.error('Stream error:', error);
        scrapingRegistry.removeProcess(processId);

        if (error.message === 'STOPPED_BY_USER') {
          return;
        }

        try {
          const errorMessage = (error.message || 'Unknown error')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: errorMessage
            })}\n\n`)
          );
          controller.close();
        } catch (closeError) {
          console.error('Could not send error, stream closed:', closeError);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}