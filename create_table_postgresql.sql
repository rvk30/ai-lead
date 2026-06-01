-- PostgreSQL version of company_master table
-- Drop old table and create new one with proper AUTO INCREMENT

-- Drop existing table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS company_master CASCADE;

-- Create new table with SERIAL (PostgreSQL's AUTO INCREMENT)
CREATE TABLE company_master (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    website_url VARCHAR(255),
    address TEXT,
    state VARCHAR(100),
    business_category VARCHAR(100),
    quality_score INT,
    google_rating DECIMAL(3, 2),
    source_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add UNIQUE constraint on company_name
ALTER TABLE company_master 
ADD CONSTRAINT unique_company_name UNIQUE (company_name);

-- Add indexes for better performance
CREATE INDEX idx_company_name ON company_master(company_name);
CREATE INDEX idx_email ON company_master(email);
CREATE INDEX idx_mobile_number ON company_master(mobile_number);
CREATE INDEX idx_state ON company_master(state);
CREATE INDEX idx_business_category ON company_master(business_category);
CREATE INDEX idx_quality_score ON company_master(quality_score);
CREATE INDEX idx_created_at ON company_master(created_at);

-- Verify table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_master'
ORDER BY ordinal_position;
