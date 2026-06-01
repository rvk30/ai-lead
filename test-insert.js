// Test script to check if database insert is working
// Run: node test-insert.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testInsert() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const testConn = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', testConn.rows[0].now);

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_master'
      );
    `);
    console.log('✅ Table exists:', tableCheck.rows[0].exists);

    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'company_master'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* REQUIRED' : ''}`);
    });

    // Check for UNIQUE constraint
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'company_master';
    `);
    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(c => {
      console.log(`  - ${c.constraint_name} (${c.constraint_type})`);
    });

    // Try inserting a test record
    console.log('\n🧪 Attempting test insert...');
    const result = await pool.query(
      `INSERT INTO company_master (
         company_name,
         mobile_number,
         email,
         website_url,
         address,
         state,
         business_category,
         quality_score,
         google_rating,
         source_file,
         created_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         CURRENT_TIMESTAMP
       )
       ON CONFLICT (company_name)
       DO UPDATE SET
         mobile_number = EXCLUDED.mobile_number,
         email = EXCLUDED.email
       RETURNING *`,
      [
        'Test Company ' + Date.now(),
        '+91 9876543210',
        'test@example.com',
        'https://test.com',
        '123 Test Street',
        'Maharashtra',
        'Technology',
        80,
        4.5,
        'test-script',
      ]
    );

    console.log('✅ Insert successful!');
    console.log('📝 Inserted record:', result.rows[0]);

    // Count total records
    const count = await pool.query('SELECT COUNT(*) FROM company_master');
    console.log('\n📊 Total records in table:', count.rows[0].count);

    // Show last 3 records
    const recent = await pool.query(`
      SELECT id, company_name, email, mobile_number, created_at 
      FROM company_master 
      ORDER BY id DESC 
      LIMIT 3
    `);
    console.log('\n📋 Last 3 records:');
    recent.rows.forEach(r => {
      console.log(`  ${r.id}. ${r.company_name} - ${r.email || 'no email'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testInsert();
