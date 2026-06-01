import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { Pool } from 'pg';
import {
  autoMapColumns,
  calculateQualityScore,
} from '@/lib/adapterRegistry';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mappingRaw = formData.get('mapping');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse with xlsx (handles both .xlsx and .csv)
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to array of objects
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Extract column names from first row keys
    const columns = Object.keys(rows[0]);

    // Source name = filename without extension
    const fileName = file.name || 'unknown';
    const sourceName = fileName.replace(/\.[^/.]+$/, '');
    
    // Unique upload ID with timestamp to prevent duplicates on re-upload
    const uploadTimestamp = Date.now();

    // ─────────────────────────────────────────────
    // CASE 2 — Mapping provided: transform & insert
    // ─────────────────────────────────────────────
    if (mappingRaw) {
      const mapping = JSON.parse(mappingRaw);

      // Check for resume: look for existing upload session
      const uploadSessionId = `${sourceName}_${uploadTimestamp}`;
      let startFromRow = 0;
      
      try {
        const resumeCheck = await pool.query(
          `SELECT last_processed_row FROM lead_intelligence.upload_sessions 
           WHERE session_id = $1`,
          [uploadSessionId]
        );
        if (resumeCheck.rows.length > 0) {
          startFromRow = resumeCheck.rows[0].last_processed_row + 1;
          console.log(`📍 Resuming upload from row ${startFromRow}`);
        }
      } catch (err) {
        console.log('No previous session found, starting fresh');
      }

      let inserted = 0;
      let skipped = 0;
      let rawInserted = 0;
      let stagingInserted = 0;
      const batchSize = 100;
      const batches = [];

      // ── Process each row: raw_records → staging_businesses → company_master ──
      for (let rowIndex = startFromRow; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];

        // ── STEP 1: Insert into raw_records (every row, without validation) ──
        // IMPORTANT: This should never fail, all raw data must be saved
        let rawId = null;
        try {
          const rawResult = await pool.query(
            `INSERT INTO lead_intelligence.raw_records
             (raw_id, source_record_id, raw_payload)
             VALUES (gen_random_uuid(), $1, $2)
             ON CONFLICT (source_record_id) DO NOTHING
             RETURNING raw_id`,
            [`${sourceName}_${uploadTimestamp}_row_${rowIndex + 1}`, JSON.stringify(row)]
          );
          if (rawResult.rows.length > 0) {
            rawId = rawResult.rows[0].raw_id;
            rawInserted++;
          } else {
            // Duplicate tha, but we still need rawId for staging
            const existingRaw = await pool.query(
              `SELECT raw_id FROM lead_intelligence.raw_records WHERE source_record_id = $1`,
              [`${sourceName}_${uploadTimestamp}_row_${rowIndex + 1}`]
            );
            if (existingRaw.rows.length > 0) {
              rawId = existingRaw.rows[0].raw_id;
            }
          }
        } catch (rawErr) {
          console.error('raw_records insert error:', rawErr.message);
          // Raw insert failed - this should not happen, but continue processing
          continue;
        }

        // ── STEP 2: Apply mapping to extract fields ──
        // Support for multi-column merge: if multiple Excel columns map to same standard column,
        // merge them with " | " separator
        const transformed = {};
        const standardColSources = {}; // Track which Excel columns contribute to each standard column
        
        // First pass: collect all values for each standard column
        for (const [originalCol, standardCol] of Object.entries(mapping)) {
          if (standardCol) {
            if (!standardColSources[standardCol]) {
              standardColSources[standardCol] = [];
            }
            const value = row[originalCol];
            if (value && String(value).trim() !== '') {
              standardColSources[standardCol].push(String(value).trim());
            }
          }
        }
        
        // Second pass: merge values for each standard column
        for (const [standardCol, values] of Object.entries(standardColSources)) {
          if (values.length === 1) {
            // Single source column
            transformed[standardCol] = values[0];
          } else if (values.length > 1) {
            // Multiple source columns - merge with separator
            transformed[standardCol] = values.join(' | ');
          }
        }

        const companyName = String(transformed['company_name'] ?? '').trim();

        // ── STEP 3: Insert into staging_businesses (all rows, valid or not) ──
        let stagingId = null;
        if (rawId) {
          try {
            const stagingResult = await pool.query(
              `INSERT INTO lead_intelligence.staging_businesses
               (staging_id, raw_id, business_name, phone_raw, email_raw,
                website_raw, address_raw, state, category, google_rating,
                source_file, mapped_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
               RETURNING staging_id`,
              [
                rawId,
                companyName || null,
                transformed['mobile_number'] ? String(transformed['mobile_number']).trim().substring(0, 100) : null,
                transformed['email'] ? String(transformed['email']).trim().substring(0, 320) : null,
                transformed['website_url'] ? String(transformed['website_url']).trim().substring(0, 500) : null,
                transformed['address'] || null,
                transformed['state'] ? String(transformed['state']).trim().substring(0, 150) : null,
                transformed['business_category'] ? String(transformed['business_category']).trim().substring(0, 150) : null,
                transformed['google_rating'] ? parseFloat(transformed['google_rating']) : null,
                sourceName,
              ]
            );
            stagingId = stagingResult.rows[0].staging_id;
            stagingInserted++;
          } catch (stagingErr) {
            console.error('staging_businesses insert error:', stagingErr.message);
          }
        }

        // ── STEP 4: Validate for company_master ──
        // Only valid rows (company_name present) will go to company_master
        if (!companyName) {
          skipped++;
          continue;
        }

        const qualityScore = calculateQualityScore(transformed);

        batches.push({
          companyName,
          mobile_number: transformed['mobile_number'] ? String(transformed['mobile_number']).trim().substring(0, 100) : null,
          email: transformed['email'] ? String(transformed['email']).trim().substring(0, 320) : null,
          website_url: transformed['website_url'] ? String(transformed['website_url']).trim().substring(0, 500) : null,
          address: transformed['address'] || null,
          state: transformed['state'] ? String(transformed['state']).trim().substring(0, 150) : null,
          business_category: transformed['business_category'] ? String(transformed['business_category']).trim().substring(0, 150) : null,
          quality_score: qualityScore,
          google_rating: transformed['google_rating'] ? parseFloat(transformed['google_rating']) : null,
          source_file: sourceName,
        });
      }

      // ── STEP 5: Batch insert into company_master ──
      for (let i = 0; i < batches.length; i += batchSize) {
        const batch = batches.slice(i, i + batchSize);
        const currentRowIndex = startFromRow + i + batch.length - 1;

        try {
          await pool.query('BEGIN');

          for (const data of batch) {
            try {
              await pool.query(
                `INSERT INTO lead_intelligence.company_master (
                   company_name, mobile_number, email, website_url, address,
                   state, business_category, quality_score, google_rating, source_file, created_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                 ON CONFLICT (company_name, mobile_number)
                 DO UPDATE SET
                   email = EXCLUDED.email,
                   website_url = EXCLUDED.website_url,
                   address = EXCLUDED.address,
                   state = EXCLUDED.state,
                   business_category = EXCLUDED.business_category,
                   quality_score = EXCLUDED.quality_score,
                   google_rating = EXCLUDED.google_rating,
                   source_file = EXCLUDED.source_file`,
                [
                  data.companyName, data.mobile_number, data.email, data.website_url,
                  data.address, data.state, data.business_category, data.quality_score,
                  data.google_rating, data.source_file
                ]
              );
              inserted++;
            } catch (rowErr) {
              console.error('company_master row insert error:', rowErr.message);
              skipped++;
            }
          }

          // Save checkpoint after each batch
          await pool.query(
            `INSERT INTO lead_intelligence.upload_sessions 
             (session_id, source_name, total_rows, last_processed_row, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (session_id) 
             DO UPDATE SET last_processed_row = EXCLUDED.last_processed_row, updated_at = NOW()`,
            [uploadSessionId, sourceName, rows.length, currentRowIndex]
          );

          await pool.query('COMMIT');
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed: ${inserted} inserted, ${skipped} skipped (checkpoint saved at row ${currentRowIndex})`);
        } catch (batchErr) {
          await pool.query('ROLLBACK');
          console.error('Batch error:', batchErr.message);
          skipped += batch.length;
        }
      }

      // ── STEP 6: Save mapping to adapter_registry ──
      await pool.query(
        `INSERT INTO lead_intelligence.adapter_registry (source_name, column_mappings, last_used, total_files_processed)
         VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
         ON CONFLICT (source_name)
         DO UPDATE SET
           column_mappings = EXCLUDED.column_mappings,
           last_used = CURRENT_TIMESTAMP,
           total_files_processed = lead_intelligence.adapter_registry.total_files_processed + 1`,
        [sourceName, JSON.stringify(mapping)]
      );

      // Mark upload session as complete
      await pool.query(
        `UPDATE lead_intelligence.upload_sessions 
         SET completed = true, updated_at = NOW()
         WHERE session_id = $1`,
        [uploadSessionId]
      );

      return NextResponse.json(
        {
          status: 'success',
          message: startFromRow > 0 
            ? `Upload resumed from row ${startFromRow} and completed successfully`
            : `File processed successfully`,
          inserted,
          skipped,
          rawInserted,
          stagingInserted,
          totalRows: rows.length,
          resumedFrom: startFromRow,
        },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────
    // CASE 1 — No mapping: detect columns & return
    // ─────────────────────────────────────────────

    let savedAdapter = false;
    let mapping = null;

    try {
      const adapterResult = await pool.query(
        `SELECT column_mappings FROM lead_intelligence.adapter_registry WHERE source_name = $1`,
        [sourceName]
      );

      if (adapterResult.rows.length > 0) {
        mapping = adapterResult.rows[0].column_mappings;
        savedAdapter = true;
      }
    } catch (dbErr) {
      console.warn('adapter_registry lookup failed:', dbErr.message);
    }

    if (!savedAdapter) {
      const autoMapped = autoMapColumns(columns);
      mapping = {};
      for (const [col, result] of Object.entries(autoMapped)) {
        mapping[col] = result.standard;
      }
    }

    return NextResponse.json(
      {
        status: 'mapping_needed',
        columns,
        mapping,
        totalRows: rows.length,
        sourceName,
        savedAdapter,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}