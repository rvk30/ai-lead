ALTER TABLE lead_intelligence.raw_records 
ADD CONSTRAINT raw_records_source_record_id_key 
UNIQUE (source_record_id);
