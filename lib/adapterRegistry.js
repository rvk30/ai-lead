
import Fuse from 'fuse.js';

// Standard database columns
const STANDARD_COLUMNS = [
  'company_name',
  'mobile_number',
  'email',
  'website_url',
  'address',
  'state',
  'business_category',
  'quality_score',
  'google_rating',
  'source_file',
];

// Aliases for intelligent column mapping
const COLUMN_ALIASES = {
  company_name: [
    'company',
    'company_name',
    'business_name',
    'firm_name',
    'organization',
    'business',
    'name',
    'company title',
    'business title',
  ],

  mobile_number: [
    'mobile',
    'mobile_number',
    'phone',
    'phone_number',
    'contact',
    'contact_no',
    'telephone',
    'mobile no',
    'phone no',
  ],

  email: [
    'email',
    'email_id',
    'mail',
    'email_address',
    'email id',
  ],

  website_url: [
    'website',
    'website_url',
    'site',
    'url',
    'web',
    'website link',
  ],

  address: [
    'address',
    'location',
    'office_address',
    'full_address',
    'company address',
  ],

  state: [
    'state',
    'province',
    'region',
  ],

  business_category: [
    'category',
    'business_category',
    'industry',
    'business_type',
    'type',
  ],

  google_rating: [
    'google_rating',
    'rating',
    'google review',
    'review rating',
  ],

  source_file: [
    'source',
    'source_file',
    'file_name',
    'import_file',
  ],
};

/**
 * autoMapColumns
 * Auto maps uploaded Excel/CSV columns
 * to standard DB columns using Fuse.js fuzzy matching.
 *
 * Supports:
 * - Fuzzy matching
 * - Alias matching
 * - Multi-column mapping
 * - Confidence scoring
 *
 * @param {string[]} uploadedColumns
 * @returns {Record<string, {
 *   standard: string | null,
 *   confidence: 'high' | 'medium' | 'low'
 * }>}
 */
export function autoMapColumns(uploadedColumns) {

  // Build searchable alias array
  const searchableColumns = [];

  for (const standard in COLUMN_ALIASES) {
    for (const alias of COLUMN_ALIASES[standard]) {
      searchableColumns.push({
        alias,
        standard,
      });
    }
  }

  // Initialize Fuse.js
  const fuse = new Fuse(searchableColumns, {
    keys: ['alias'],
    includeScore: true,
    threshold: 0.4,
  });

  const result = {};

  // Track multiple uploaded columns
  // mapping to same standard column
  const mappingGroups = {};

  for (const col of uploadedColumns) {

    // Normalize incoming column name
    const normalizedCol = normalizeColumnName(col);

    // Search best fuzzy matches
    const matches = fuse.search(normalizedCol);

    // No match found
    if (matches.length === 0) {
      result[col] = {
        standard: null,
        confidence: 'low',
      };

      continue;
    }

    const bestMatch = matches[0];

    // Fuse score:
    // 0 = perfect
    // 1 = worst
    const score = 1 - (bestMatch.score ?? 1);

    let confidence;

    if (score > 0.85) {
      confidence = 'high';
    } else if (score > 0.6) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    const standardCol = bestMatch.item.standard;

    // Track multi-column mappings
    if (!mappingGroups[standardCol]) {
      mappingGroups[standardCol] = [];
    }

    mappingGroups[standardCol].push(col);

    result[col] = {
      standard: standardCol,
      confidence,
    };
  }

  return result;
}

/**
 * normalizeColumnName
 * Cleans uploaded column names
 *
 * Example:
 * " Phone Number "
 * -> "phone number"
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeColumnName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * normalizeCompanyName
 * Cleans company names
 * for duplicate detection
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeCompanyName(name) {

  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * calculateQualityScore
 * Calculates completeness percentage
 * based on important business fields.
 *
 * @param {Record<string, any>} row
 * @returns {number}
 */
export function calculateQualityScore(row) {

  const KEY_FIELDS = [
    'company_name',
    'mobile_number',
    'email',
    'website_url',
    'address',
  ];

  if (!row || typeof row !== 'object') {
    return 0;
  }

  const filledCount = KEY_FIELDS.filter((field) => {

    const value = row[field];

    return (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    );
  }).length;

  return Math.round(
    (filledCount / KEY_FIELDS.length) * 100
  );
}

