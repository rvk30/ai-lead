-- ============================================
-- Fix Constraints for Upload Errors
-- ============================================

-- 1. Add UNIQUE constraint on company_master.company_name
--    (Yeh ON CONFLICT error fix karega)
ALTER TABLE lead_intelligence.company_master 
ADD CONSTRAINT unique_company_name UNIQUE (company_name);

-- 2. Check if raw_records already has unique constraint
--    (Agar nahi hai to add karo)
ALTER TABLE lead_intelligence.raw_records 
ADD CONSTRAINT raw_records_source_record_id_key UNIQUE (source_record_id);

-- ============================================
-- Verification Queries (optional - check karne ke liye)
-- ============================================

-- Check company_master constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'lead_intelligence.company_master'::regclass;

-- Check raw_records constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'lead_intelligence.raw_records'::regclass;
