import { Pool } from 'pg';

// Global pool instance to prevent "too many clients" error
declare global {
  var pgPool: Pool | undefined;
}

const pool = global.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced from 20 to 5 (safer for shared DB)
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (faster cleanup)
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export default pool;
