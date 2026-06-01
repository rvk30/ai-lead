-- ============================================
-- Upload Sessions Table for Resume Functionality
-- ============================================

CREATE TABLE IF NOT EXISTS lead_intelligence.upload_sessions (
    session_id VARCHAR(500) PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    total_rows INTEGER NOT NULL,
    last_processed_row INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upload_sessions_source 
ON lead_intelligence.upload_sessions(source_name);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_completed 
ON lead_intelligence.upload_sessions(completed);

-- Clean up old completed sessions (optional - run periodically)
-- DELETE FROM lead_intelligence.upload_sessions 
-- WHERE completed = true AND updated_at < NOW() - INTERVAL '7 days';
