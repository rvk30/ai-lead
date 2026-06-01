-- Fix the id column to auto-increment in PostgreSQL
-- Run this SQL to fix the AUTO_INCREMENT issue

-- Step 1: Create a sequence for the id column
CREATE SEQUENCE IF NOT EXISTS company_master_id_seq;

-- Step 2: Set the id column to use the sequence
ALTER TABLE company_master 
ALTER COLUMN id SET DEFAULT nextval('company_master_id_seq');

-- Step 3: Set the sequence to start from the current max id + 1
SELECT setval('company_master_id_seq', COALESCE((SELECT MAX(id) FROM company_master), 0) + 1, false);

-- Step 4: Make sure id is the primary key
ALTER TABLE company_master 
DROP CONSTRAINT IF EXISTS company_master_pkey;

ALTER TABLE company_master 
ADD PRIMARY KEY (id);

-- Verify the changes
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_master' AND column_name = 'id';
