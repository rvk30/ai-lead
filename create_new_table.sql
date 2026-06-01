-- Create the new company_master table with the updated structure
-- Run this SQL script in your database to create the new table

CREATE TABLE IF NOT EXISTS company_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_name ON company_master(company_name);
CREATE INDEX IF NOT EXISTS idx_email ON company_master(email);
CREATE INDEX IF NOT EXISTS idx_mobile_number ON company_master(mobile_number);
CREATE INDEX IF NOT EXISTS idx_state ON company_master(state);
CREATE INDEX IF NOT EXISTS idx_business_category ON company_master(business_category);
CREATE INDEX IF NOT EXISTS idx_quality_score ON company_master(quality_score);
CREATE INDEX IF NOT EXISTS idx_created_at ON company_master(created_at);

-- If you're migrating from an old table, you might want to backup first:
-- CREATE TABLE company_master_backup AS SELECT * FROM company_master;