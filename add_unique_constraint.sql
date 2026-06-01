-- Add UNIQUE constraint on company_name to prevent duplicates
-- Run this SQL if you want to prevent duplicate company names

ALTER TABLE company_master 
ADD CONSTRAINT unique_company_name UNIQUE (company_name);

-- After adding this constraint, you can use ON CONFLICT in your code
-- to update existing records instead of creating duplicates