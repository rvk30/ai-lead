const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    database: 'business_data_hub',
    user: 'bdh_user',
    password: 'bdh_pass_123',
    port: 5432
});

async function main() {
    const result = await pool.query(
        `SELECT raw_id, raw_payload 
         FROM lead_intelligence.raw_records`
    );

    console.log(`Total raw records: ${result.rows.length}`);
    let count = 0;

    for (const record of result.rows) {
        const data = record.raw_payload;

        const business_name = data['business_name'] || data['Business Name'] || null;
        const phone_raw = data['phone'] || data['Phone Number'] || null;
        const email_raw = data['email'] || data['Email'] || null;
        const website_raw = data['website'] || data['Website'] || data['Website '] || null;
        const address_raw = data['city'] || data['City'] || null;
        const state = data['location'] || data['Location'] || null;
        const category = data['industry'] || data['Industry'] || null;
        const google_rating = data['google_rating'] || data['Google Ratings'] || null;
        const location = data['location'] || data['Location'] || null;
        const source_file = data['source_file'] || data['Source_File'] || null;
        const remarks = data['remarks'] || data['Remarks'] || null;

        if (!business_name) continue;

        await pool.query(
            `INSERT INTO lead_intelligence.staging_businesses 
            (raw_id, business_name, phone_raw, email_raw, website_raw, address_raw, state, category, google_rating, location, source_file, remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT DO NOTHING`,
            [record.raw_id, business_name, phone_raw, email_raw, website_raw, address_raw, state, category, google_rating, location, source_file, remarks]
        );

        count++;
        if (count % 100 === 0) console.log(`${count} rows updated...`);
    }

    console.log(`Done! ${count} rows staging mein insert ho gayi!`);
    await pool.end();
}

main().catch(console.error);
