import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { normalizeCompanyName } from '@/lib/adapterRegistry';
import scrapingRegistry from '@/lib/scrapingRegistry';
const { scrapeGoogleMapsStream } = require('../scripts/googleMapsScraper');

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const location = searchParams.get('location');
  const category = searchParams.get('category');

  if (!location || !category) {
    return new Response(
      JSON.stringify({ error: 'Location and category required' }),
      { status: 400 }
    );
  }

  // Create process in registry
  const processId = scrapingRegistry.createProcess(location, category);

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let totalInserted = 0;
        let totalSkipped = 0;
        let isStreamClosed = false;

        // Check for stop signal
        const shouldStopCheck = () => scrapingRegistry.shouldStop(processId);

        // Progress callback with database insertion
        const onProgress = async (data: any) => {
          // Don't send if stream is already closed
          if (isStreamClosed) return;

          // Check if user requested stop
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
            // If this is a business result, save to database
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

                // Duplicate Check
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
                  // Insert into database
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

            // Send progress update to client
            if (!isStreamClosed) {
              try {
                // Safely serialize JSON by handling special characters
                const jsonString = JSON.stringify(data);
                const message = `data: ${jsonString}\n\n`;
                controller.enqueue(encoder.encode(message));
              } catch (jsonError) {
                console.error('JSON serialization error:', jsonError);
                // Send a safe error message
                const safeMessage = `data: ${JSON.stringify({ 
                  type: 'error', 
                  message: 'Data serialization failed' 
                })}\n\n`;
                controller.enqueue(encoder.encode(safeMessage));
              }
            }
          } catch (error) {
            console.error('Progress callback error:', error);
            // Continue even if one business fails
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

        // Start scraping with callback and stop check
        await scrapeGoogleMapsStream(location, category, onProgress, shouldStopCheck);

        // Send completion signal with final stats
        if (!isStreamClosed) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                totalInserted,
                totalSkipped,
              })}\n\n`
            )
          );
          isStreamClosed = true;
          controller.close();
          scrapingRegistry.removeProcess(processId);
        }
      } catch (error: any) {
        console.error('Stream error:', error);
        scrapingRegistry.removeProcess(processId);
        
        // Don't send error if it was a user-requested stop
        if (error.message === 'STOPPED_BY_USER') {
          return;
        }
        
        try {
          // Safely escape error message
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
          // Stream already closed
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
