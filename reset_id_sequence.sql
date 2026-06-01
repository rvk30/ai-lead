-- ============================================
-- Reset ID Sequence to Start from 1
-- ============================================

-- Option 1: Reset to 1 (if table is empty or you want to start fresh)
ALTER SEQUENCE lead_intelligence.company_master_id_seq RESTART WITH 1;

-- Option 2: Reset to next available ID (if table has data)
-- This will set sequence to MAX(id) + 1
SELECT setval(
    'lead_intelligence.company_master_id_seq', 
    COALESCE((SELECT MAX(id) FROM lead_intelligence.company_master), 0) + 1, 
    false
);

-- Verify current sequence value
SELECT currval('lead_intelligence.company_master_id_seq') as current_id;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Use Option 1 only if you want to reset completely
-- 2. Use Option 2 if you have existing data and want continuous IDs
-- 3. After reset, new records will start from the new sequence value
