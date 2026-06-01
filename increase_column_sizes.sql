-- Increase column sizes to handle longer data
-- Run this SQL to fix the "value too long" error

-- Increase mobile_number from VARCHAR(20) to VARCHAR(50)
ALTER TABLE company_master 
ALTER COLUMN mobile_number TYPE VARCHAR(50);

-- Also increase email if needed
ALTER TABLE company_master 
ALTER COLUMN email TYPE VARCHAR(320);

-- Increase website_url
ALTER TABLE company_master 
ALTER COLUMN website_url TYPE VARCHAR(500);

-- Increase state
ALTER TABLE company_master 
ALTER COLUMN state TYPE VARCHAR(150);

-- Increase business_category
ALTER TABLE company_master 
ALTER COLUMN business_category TYPE VARCHAR(150);

-- Verify changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'company_master'
AND column_name IN ('mobile_number', 'email', 'website_url', 'state', 'business_category')
ORDER BY ordinal_position;
