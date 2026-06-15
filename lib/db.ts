import { Pool } from 'pg';

// Global pool instance to prevent "too many clients" error
declare global {
  var pgPool: Pool | undefined;
}

const pool = global.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Increased to 10 connections
  min: 2, // Keep 2 connections always ready
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 15000, // 15 seconds to establish connection
  statement_timeout: 60000, // 60 seconds for query execution
  query_timeout: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  options: '-c search_path=lead_intelligence,public', // Set schema search path
});

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export default pool;
