-- ============================================
-- Clean Duplicate Data Before Adding Constraints
-- ============================================

-- 1. Find duplicate company names
SELECT company_name, COUNT(*) as count
FROM lead_intelligence.company_master
GROUP BY company_name
HAVING COUNT(*) > 1;

-- 2. Keep only the latest record for each duplicate company_name
DELETE FROM lead_intelligence.company_master
WHERE id NOT IN (
    SELECT MAX(id)
    FROM lead_intelligence.company_master
    GROUP BY company_name
);

-- 3. Find duplicate source_record_id in raw_records
SELECT source_record_id, COUNT(*) as count
FROM lead_intelligence.raw_records
GROUP BY source_record_id
HAVING COUNT(*) > 1;

-- 4. Keep only the first record for each duplicate source_record_id
DELETE FROM lead_intelligence.raw_records
WHERE raw_id NOT IN (
    SELECT MIN(raw_id)
    FROM lead_intelligence.raw_records
    GROUP BY source_record_id
);

-- 5. Now add the constraints (run fix_constraints.sql after this)
