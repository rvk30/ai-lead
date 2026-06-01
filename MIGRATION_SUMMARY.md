# Database Migration Summary - New company_master Structure

## Overview
Successfully migrated from old table structure to new `company_master` table with updated columns.

## New Table Structure

```sql
CREATE TABLE company_master (
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
```

## Changes Made

### Backend Files Updated:

1. **lib/adapterRegistry.js**
   - Updated `STANDARD_COLUMNS` array
   - Modified `calculateQualityScore()` to use new fields

2. **app/api/leads/create/route.ts**
   - Updated to accept new fields
   - Changed validation from `name` to `company_name`
   - Added automatic quality score calculation

3. **app/api/leads/[id]/route.ts**
   - Updated GET, PUT, DELETE to use `id` instead of `company_id`
   - Modified PUT to handle all new fields

4. **app/api/leads/list/route.ts**
   - Updated query parameters for new fields

5. **app/api/leads/all/route.ts**
   - Changed ORDER BY from `company_id` to `id`

6. **app/api/leads/search/route.ts**
   - Updated to search by `company_name`

7. **app/api/leads/filter/route.ts**
   - Updated to filter by `quality_score`

8. **app/api/upload/route.js**
   - Updated INSERT query for new table structure
   - Removed `normalized_name` logic
   - Added proper handling for `google_rating` as DECIMAL

9. **app/api/db/setup/route.ts**
   - Simplified setup for new structure
   - Updated GET method to show table info

### Frontend Files Updated:

1. **app/(dashboard)/dashboard/page.tsx**
   - Updated `Company` interface
   - Changed stats to show: Email, Mobile, Website, Address
   - Updated table columns and data display

2. **app/(dashboard)/leads/page.tsx**
   - Updated `Company` interface
   - Modified table headers and data
   - Changed from `company_id` to `id`

3. **app/(dashboard)/leads/create/page.tsx**
   - Updated form fields for new structure
   - Added: mobile_number, website_url, address, state, business_category, google_rating
   - Removed: old lead fields

4. **app/(dashboard)/leads/[id]/edit/page.tsx**
   - Updated form to handle all new fields
   - Added textarea for address
   - Added dropdown for business_category

5. **app/(dashboard)/leads/search/page.tsx**
   - Updated to search companies by name
   - Modified table to show new fields

6. **app/(dashboard)/leads/filter/page.tsx**
   - Changed from status filter to quality score filter
   - Updated to show quality-based filtering

## Field Mapping (Old → New)

| Old Field | New Field | Type Change |
|-----------|-----------|-------------|
| company_id | id | UUID → INT AUTO_INCREMENT |
| name | company_name | - |
| phone | mobile_number | - |
| website_domain | website_url | - |
| - | address | NEW (TEXT) |
| - | state | NEW (VARCHAR) |
| - | business_category | NEW (VARCHAR) |
| google_entry | google_rating | Changed to DECIMAL(3,2) |
| - | source_file | NEW (VARCHAR) |
| gst_number | - | REMOVED |
| cin_number | - | REMOVED |
| normalized_name | - | REMOVED |
| updated_at | - | REMOVED |

## Quality Score Calculation

Quality score is now calculated based on 5 key fields:
- company_name
- mobile_number
- email
- website_url
- address

Each filled field = 20%, so max score = 100%

## Next Steps

1. **Create the new table** using `create_new_table.sql`
2. **Migrate existing data** if you have any:
   ```sql
   INSERT INTO company_master_new (company_name, email, created_at)
   SELECT company_name, email, created_at FROM company_master_old;
   ```
3. **Test all API endpoints**
4. **Verify frontend functionality**
5. **Update any external integrations**

## Testing Checklist

- [ ] Create new company via form
- [ ] Upload Excel/CSV file
- [ ] View all companies
- [ ] Search companies by name
- [ ] Filter by quality score
- [ ] Edit company details
- [ ] Delete company
- [ ] Check dashboard stats

## Files Created

- `create_new_table.sql` - SQL script to create new table with indexes
- `MIGRATION_SUMMARY.md` - This file

## Important Notes

- Primary key changed from UUID to AUTO_INCREMENT INT
- Google rating is now DECIMAL(3,2) for values like 4.5
- Quality score calculation updated to match new fields
- All frontend components updated to match new structure
- Database triggers simplified (no more normalized_name)
