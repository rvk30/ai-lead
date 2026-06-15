// import { NextResponse } from 'next/server';
// import * as XLSX from 'xlsx';
// import { Pool } from 'pg';
// import { autoMapColumns } from '@/lib/adapterRegistry';

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// export async function POST(request) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file');
//     const mappingRaw = formData.get('mapping');

//     if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const workbook = XLSX.read(buffer, { type: 'buffer' });
//     const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

//     if (!rows.length) return NextResponse.json({ error: 'File is empty' }, { status: 400 });

//     const columns = Object.keys(rows[0]);
//     const sourceName = (file.name || 'unknown').replace(/\.[^/.]+$/, '');

//     // ── CASE 2: Mapping provided → raw mein insert, triggers baaki handle karenge ──
//     if (mappingRaw) {
//       const mapping = JSON.parse(mappingRaw);
//       let inserted = 0, skipped = 0;

//       for (let i = 0; i < rows.length; i++) {
//         const row = rows[i];

//         // Mapping apply karo
//         const standardRow = {};
//         for (const [originalCol, standardCol] of Object.entries(mapping)) {
//           if (!standardCol) continue;
//           if (standardRow[standardCol] !== undefined) continue;
//           const value = row[originalCol];
//           if (value && String(value).trim() !== '') {
//             standardRow[standardCol] = String(value).trim();
//           }
//         }

//         // company_name nahi hai toh skip
//         if (!standardRow['company_name']) { skipped++; continue; }

//         // source_file add karo
//         standardRow['source_file'] = sourceName;

//         // SIRF raw_records mein insert — DB trigger staging → master handle karega
//         try {
//           const result = await pool.query(
//             `INSERT INTO lead_intelligence.raw_records (source_record_id, raw_payload)
//              VALUES ($1, $2)
//              ON CONFLICT (source_record_id) DO NOTHING
//              RETURNING raw_id`,
//             [`${sourceName}_row_${i + 1}`, JSON.stringify(standardRow)]
//           );
//           result.rows.length ? inserted++ : skipped++;
//         } catch (err) {
//           console.error('Insert error:', err.message);
//           skipped++;
//         }
//       }

//       // Adapter registry update karo
//       try {
//         await pool.query(
//           `INSERT INTO lead_intelligence.adapter_registry 
//            (source_name, column_mappings, last_used, total_files_processed)
//            VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
//            ON CONFLICT (source_name) DO UPDATE SET
//              column_mappings = EXCLUDED.column_mappings,
//              last_used = CURRENT_TIMESTAMP,
//              total_files_processed = lead_intelligence.adapter_registry.total_files_processed + 1`,
//           [sourceName, JSON.stringify(mapping)]
//         );
//       } catch (err) {
//         console.warn('Adapter registry update failed:', err.message);
//       }

//       return NextResponse.json({
//         status: 'success',
//         message: 'File processed successfully',
//         inserted, skipped, totalRows: rows.length,
//       });
//     }

//     // ── CASE 1: No mapping → columns detect karke return karo ──
//     let savedAdapter = false;
//     let mapping = null;

//     try {
//       const adapterResult = await pool.query(
//         `SELECT column_mappings FROM lead_intelligence.adapter_registry WHERE source_name = $1`,
//         [sourceName]
//       );
//       if (adapterResult.rows.length > 0) {
//         mapping = adapterResult.rows[0].column_mappings;
//         savedAdapter = true;
//       }
//     } catch (err) {
//       console.warn('adapter_registry lookup failed:', err.message);
//     }

//     if (!savedAdapter) {
//       const autoMapped = autoMapColumns(columns);
//       mapping = {};
//       for (const [col, result] of Object.entries(autoMapped)) {
//         mapping[col] = result.standard;
//       }
//     }

//     return NextResponse.json({
//       status: 'mapping_needed',
//       columns, mapping, totalRows: rows.length, sourceName, savedAdapter,
//     });

//   } catch (err) {
//     console.error('Upload route error:', err);
//     return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { Pool } from 'pg';
import { autoMapColumns } from '@/lib/adapterRegistry';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Better hash — normalized fields se ──
function generateHash(data) {
  const name = (data.company_name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 &]/g, '');

  const mobile = (data.mobile_number || data.phone || '')
    .replace(/\D/g, '')
    .slice(-10);

  const email = (data.email || '')
    .toLowerCase()
    .trim();

  const website = (data.website_url || '')
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .trim();

  const key = `${name}|${mobile}|${email}|${website}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

// ── Company name normalize karo comparison ke liye ──
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(pvt|ltd|llp|inc|corp|private|limited|company|co)\b/g, '')
    .trim();
}

// ── DB level duplicate check ──
async function isDuplicate(standardRow) {
  try {
    const name = standardRow.company_name || '';
    const mobile = (standardRow.mobile_number || '').replace(/\D/g, '').slice(-10);
    const email = (standardRow.email || '').toLowerCase().trim();
    const website = (standardRow.website_url || '')
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/$/, '')
      .trim();

    // Check 1 — exact hash match
    const hashCheck = await pool.query(
      `SELECT raw_id FROM lead_intelligence.raw_records 
       WHERE raw_hash = $1 LIMIT 1`,
      [generateHash(standardRow)]
    );
    if (hashCheck.rows.length > 0) return true;

    // Check 2 — same company + mobile
    if (mobile && mobile.length >= 10) {
      const mobileCheck = await pool.query(
        `SELECT raw_id FROM lead_intelligence.raw_records
         WHERE raw_payload->>'mobile_number' LIKE $1
         AND LOWER(TRIM(raw_payload->>'company_name')) ILIKE $2
         LIMIT 1`,
        [`%${mobile}`, `%${normalizeName(name)}%`]
      );
      if (mobileCheck.rows.length > 0) return true;
    }

    // Check 3 — same company + email
    if (email && email.includes('@') && !['abc@gmail.com','xyz@gmail.com','test@test.com','info@gmail.com'].includes(email)) {
      const emailCheck = await pool.query(
        `SELECT raw_id FROM lead_intelligence.raw_records
         WHERE raw_payload->>'email' = $1
         AND LOWER(TRIM(raw_payload->>'company_name')) ILIKE $2
         LIMIT 1`,
        [email, `%${normalizeName(name)}%`]
      );
      if (emailCheck.rows.length > 0) return true;
    }

    // Check 4 — same company + website
    if (website && website.length > 4) {
      const websiteCheck = await pool.query(
        `SELECT raw_id FROM lead_intelligence.raw_records
         WHERE raw_payload->>'website_url' ILIKE $1
         AND LOWER(TRIM(raw_payload->>'company_name')) ILIKE $2
         LIMIT 1`,
        [`%${website}%`, `%${normalizeName(name)}%`]
      );
      if (websiteCheck.rows.length > 0) return true;
    }

    // Check 5 — company_master mein bhi check karo
    const masterCheck = await pool.query(
      `SELECT id FROM lead_intelligence.company_master
       WHERE LOWER(TRIM(company_name)) ILIKE $1
       AND (
         ($2 != '' AND REGEXP_REPLACE(COALESCE(mobile_number,''), '[^0-9]', '', 'g') LIKE $3)
         OR ($4 != '' AND LOWER(TRIM(COALESCE(email,''))) = $4)
         OR ($5 != '' AND LOWER(TRIM(COALESCE(website_url,''))) ILIKE $6)
       )
       LIMIT 1`,
      [
        `%${normalizeName(name)}%`,
        mobile, `%${mobile}`,
        email,
        website, `%${website}%`
      ]
    );
    if (masterCheck.rows.length > 0) return true;

    return false;
  } catch (err) {
    console.error('Duplicate check error:', err.message);
    return false;
  }
}

// ── Garbage row check ──
function isGarbageRow(standardRow) {
  const name = standardRow.company_name || '';

  // Too short
  if (name.length < 3) return true;

  // Pipe wale names (Google Maps concatenated)
  if (name.includes('|')) return true;

  // Sirf numbers
  if (/^[0-9\s\-\.]+$/.test(name)) return true;

  // Garbage patterns
  if (/^[A-Z]{2,6}[0-9\-]*$/.test(name)) return true;

  // Unicode bold/italic chars
  if (/[^\x20-\x7E\u0900-\u097F]/.test(name) && !/[a-zA-Z0-9]/.test(name)) return true;

  // Test/dummy values
  const lower = name.toLowerCase();
  if (['test','demo','na','n/a','none','dummy','unknown','abc','xyz','nil','placeholder','sample'].includes(lower)) return true;

  // Only dots/dashes/spaces
  if (/^[\s\.\-\,\/\(\)]+$/.test(name)) return true;

  return false;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const mappingRaw = formData.get('mapping');

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]], 
      { defval: '' }
    );

    if (!rows.length) return NextResponse.json({ error: 'File is empty' }, { status: 400 });

    const columns = Object.keys(rows[0]);
    const sourceName = (file.name || 'unknown').replace(/\.[^/.]+$/, '');

    // ── CASE 2: Mapping provided → insert karo ──
    if (mappingRaw) {
      const mapping = JSON.parse(mappingRaw);
      let inserted = 0, skipped = 0, duplicates = 0, garbage = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Standard row banao mapping se
        const standardRow = {};
        for (const [originalCol, standardCol] of Object.entries(mapping)) {
          if (!standardCol) continue;
          if (standardRow[standardCol] !== undefined) continue;
          const value = row[originalCol];
          if (value && String(value).trim() !== '') {
            standardRow[standardCol] = String(value).trim();
          }
        }

        // Company name required
        if (!standardRow['company_name']) { skipped++; continue; }

        // Garbage check
        if (isGarbageRow(standardRow)) { garbage++; skipped++; continue; }

        standardRow['source_file'] = sourceName;

        // Mobile normalize
        if (standardRow['mobile_number']) {
          standardRow['mobile_number'] = standardRow['mobile_number']
            .replace(/\D/g, '')
            .slice(-10);
          if (standardRow['mobile_number'].length < 10) {
            delete standardRow['mobile_number'];
          }
        }

        // Email normalize
        if (standardRow['email']) {
          standardRow['email'] = standardRow['email'].toLowerCase().trim();
          if (!standardRow['email'].includes('@') || 
              ['abc@gmail.com','xyz@gmail.com','test@test.com'].includes(standardRow['email'])) {
            delete standardRow['email'];
          }
        }

        // Duplicate check
        const dup = await isDuplicate(standardRow);
        if (dup) { duplicates++; continue; }

        // Hash generate
        const rawHash = generateHash(standardRow);

        try {
          const result = await pool.query(
            `INSERT INTO lead_intelligence.raw_records 
             (source_record_id, raw_payload, raw_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (raw_hash) DO NOTHING
             RETURNING raw_id`,
            [
              `${sourceName}_row_${i + 1}_${Date.now()}`,
              JSON.stringify(standardRow),
              rawHash
            ]
          );
          result.rows.length ? inserted++ : duplicates++;
        } catch (err) {
          console.error('Insert error:', err.message);
          skipped++;
        }
      }

      // Adapter registry update
      try {
        await pool.query(
          `INSERT INTO lead_intelligence.adapter_registry 
           (source_name, column_mappings, last_used, total_files_processed)
           VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
           ON CONFLICT (source_name) DO UPDATE SET
             column_mappings = EXCLUDED.column_mappings,
             last_used = CURRENT_TIMESTAMP,
             total_files_processed = lead_intelligence.adapter_registry.total_files_processed + 1`,
          [sourceName, JSON.stringify(mapping)]
        );
      } catch (err) {
        console.warn('Adapter registry update failed:', err.message);
      }

      return NextResponse.json({
        status: 'success',
        message: `File processed — ${inserted} inserted, ${duplicates} duplicates skipped, ${skipped} invalid rows`,
        inserted,
        skipped,
        duplicates,
        garbage,
        totalRows: rows.length,
      });
    }

    // ── CASE 1: No mapping → detect columns ──
    let savedAdapter = false;
    let mapping = null;

    try {
      const adapterResult = await pool.query(
        `SELECT column_mappings FROM lead_intelligence.adapter_registry 
         WHERE source_name = $1`,
        [sourceName]
      );
      if (adapterResult.rows.length > 0) {
        mapping = adapterResult.rows[0].column_mappings;
        savedAdapter = true;
      }
    } catch (err) {
      console.warn('adapter_registry lookup failed:', err.message);
    }

    if (!savedAdapter) {
      const autoMapped = autoMapColumns(columns);
      mapping = {};
      for (const [col, result] of Object.entries(autoMapped)) {
        mapping[col] = result.standard;
      }
    }

    return NextResponse.json({
      status: 'mapping_needed',
      columns,
      mapping,
      totalRows: rows.length,
      sourceName,
      savedAdapter,
    });

  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}