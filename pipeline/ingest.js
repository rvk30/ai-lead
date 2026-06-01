const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({
    host: 'localhost',
    database: 'business_data_hub',
    user: 'bdh_user',
    password: 'bdh_pass_123',
    port: 5432
});

const COLUMN_MAP = {
    'Business Name': 'business_name',
    'Phone Number': 'phone',
    'Email': 'email',
    'Website ': 'website',
    'Website': 'website',
    'City': 'city',
    'Industry': 'industry',
    'Location': 'location',
    'Google Ratings': 'google_rating',
    'Remarks': 'remarks',
    'Source_File': 'source_file',
    'qBF1Pd': 'business_name',
    'UsdlK': 'phone',
    'doJOZc': 'email',
    'lcr4fd href': 'website',
    'W4Efsd': 'industry',
    'MW4etd': 'google_rating',
};

function mapRow(row) {
    const mapped = {};
    for (const [key, value] of Object.entries(row)) {
        const newKey = COLUMN_MAP[key] || key;
        if (value !== null && value !== undefined && value !== '') {
            mapped[newKey] = String(value).trim();
        }
    }
    return mapped;
}

async function bulkInsert(rows, sourceFile) {
    if (rows.length === 0) return 0;

    const params = [];
    const values = [];
    let count = 0;

    rows.forEach((row, i) => {
        const mapped = mapRow(row);
        if (!mapped.business_name) return;

        const base = count * 2;
        params.push(`($${base + 1}, $${base + 2})`);
        values.push(
            `${path.basename(sourceFile)}_row_${i + 2}`,
            JSON.stringify(mapped)
        );
        count++;
    });

    if (count === 0) return 0;

    await pool.query(
        `INSERT INTO lead_intelligence.raw_records 
        (source_record_id, raw_payload) 
        VALUES ${params.join(',')}
        ON CONFLICT (source_record_id) DO NOTHING`,
        values
    );

    return count;
}

async function processCSV(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', async () => {
                const count = await bulkInsert(rows, filePath);
                resolve(count);
            })
            .on('error', reject);
    });
}

async function processXLSX(filePath) {
    const wb = XLSX.readFile(filePath);
    let totalCount = 0;

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws);
        console.log(`  Sheet: ${sheetName} — ${rows.length} rows`);

        const count = await bulkInsert(rows, `${filePath}_${sheetName}`);
        totalCount += count;
    }
    return totalCount;
}

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`\nProcessing: ${path.basename(filePath)}`);

    let count = 0;
    if (ext === '.csv') {
        count = await processCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        count = await processXLSX(filePath);
    } else {
        console.log(`  Skipping — unsupported format: ${ext}`);
        return;
    }

    console.log(`  Done! ${count} rows inserted.`);
    return count;
}

async function main() {
    const target = process.argv[2];

    if (!target) {
        console.log('Usage: node ingest.js <file_or_folder>');
        process.exit(1);
    }

    const stat = fs.statSync(target);

    if (stat.isDirectory()) {
        const files = fs.readdirSync(target).filter(f =>
            ['.csv', '.xlsx', '.xls'].includes(path.extname(f).toLowerCase())
        );
        console.log(`Found ${files.length} files in folder`);
        for (const file of files) {
            await processFile(path.join(target, file));
        }
    } else {
        await processFile(target);
    }

    await pool.end();

    // Auto trigger staging pipeline
    console.log('\nAuto-triggering staging pipeline...');
    execSync('node /home/ubuntu/pipeline/raw_to_staging.js', { stdio: 'inherit' });

    console.log('\nAll done! Raw → Staging complete!');
}

main().catch(console.error);
