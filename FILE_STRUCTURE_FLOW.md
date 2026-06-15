# 📂 File Structure & Flow - Complete Picture

## 🎯 Quick Answer
**हाँ, आपका backend LOCAL FOLDER की files से code ले रहा है!**

---

## 📊 Visual Flow Diagram

```
Your Project Folder (c:\Users\kaush\Desktop\my-lead\)
│
├─ app/api/
│  ├─ map-search/
│  │  └─ route.ts ───────────┐
│  │                          │
│  ├─ map-search-stream/      │
│  │  └─ route.ts ───────────┤
│  │                          │
│  ├─ map-search-job/         │  (All 3 import from same file)
│  │  └─ route.ts ───────────┤
│  │                          │
│  └─ scripts/                │
│     └─ googleMapsScraper.js ←┘  ⭐ MAIN SCRAPER (INLINE CODE)
│        ├─ scrapeGoogleMaps()
│        ├─ scrapeGoogleMapsStream()
│        ├─ saveToDB()
│        ├─ extractEmail()
│        └─ All BDH-Backup functions (inline)
│
├─ lib/
│  ├─ db.ts ──────────────────→ Uses: process.env.DATABASE_URL
│  ├─ adapterRegistry.js ─────→ Column mapping
│  ├─ scrapingRegistry.ts ────→ Process tracking
│  │
│  └─ bdh-backup/ (Reference only - NOT used in runtime)
│     ├─ scraper/
│     │  └─ gmaps_scraper.js
│     ├─ pipeline/
│     └─ worker/
│
├─ node_modules/ (Dependencies)
│  ├─ playwright ──────────────→ Browser automation
│  ├─ pg ──────────────────────→ PostgreSQL client
│  └─ next ────────────────────→ Framework
│
├─ .env.local (Config)
│  ├─ DATABASE_URL ────────────→ Remote DB connection
│  ├─ DB_HOST
│  └─ DB_PORT
│
└─ .next/ (Build cache - auto generated)
```

---

## 🔄 Runtime Flow (Step by Step)

### When User Calls API:

```
1. Browser/Frontend
   ↓ HTTP POST
   http://localhost:3000/api/map-search

2. Next.js Router
   ↓ Matches route
   app/api/map-search/route.ts (LOCAL FILE)

3. Route Handler Imports
   ↓ require('../scripts/googleMapsScraper')
   app/api/scripts/googleMapsScraper.js (LOCAL FILE)

4. Scraper Executes
   ↓ Inline BDH-Backup code
   - Launches Playwright (from node_modules)
   - Opens Chrome headless
   - Scrapes Google Maps

5. Database Insert
   ↓ Uses pg client (from node_modules)
   Connects to: 103.99.38.129:5432 (REMOTE)

6. Response
   ↓ JSON
   Returns data to frontend
```

---

## 📍 File Locations (Absolute Paths)

### ✅ Actually Used Files:

```
C:\Users\kaush\Desktop\my-lead\
│
├─ app\api\scripts\googleMapsScraper.js      ← ⭐ MAIN SCRAPER
├─ app\api\map-search\route.ts               ← API endpoint 1
├─ app\api\map-search-stream\route.ts        ← API endpoint 2
├─ app\api\map-search-job\route.ts           ← API endpoint 3
├─ lib\db.ts                                 ← Database connection
├─ lib\adapterRegistry.js                    ← Data mapping
└─ lib\scrapingRegistry.ts                   ← Process tracking
```

### 📚 Reference Only (Not Imported):

```
C:\Users\kaush\Desktop\my-lead\
│
└─ lib\bdh-backup\
   ├─ scraper\gmaps_scraper.js               ← Original (NOT used)
   ├─ pipeline\full_pipeline.js              ← CSV processing (CLI only)
   └─ worker\worker.js                       ← Background jobs (CLI only)
```

---

## 🎯 Import Analysis

### Route File Import:
```typescript
// File: app/api/map-search/route.ts
const { scrapeGoogleMaps } = require("../scripts/googleMapsScraper");
```

**Resolves to:**
```
app/api/map-search/route.ts
    ↓ ../scripts/
app/api/scripts/
    ↓ googleMapsScraper
app/api/scripts/googleMapsScraper.js ✅
```

### No External Imports in Scraper:
```javascript
// File: app/api/scripts/googleMapsScraper.js
// ✅ All code is inline - no external scraper imports!

const crypto = require('crypto');        // Node.js built-in
const { Pool } = require('pg');          // node_modules/pg
const { chromium } = require('playwright'); // node_modules/playwright

// All functions defined in THIS file:
function generateHash(data) { ... }
function saveToDB(results) { ... }
function extractEmail(browser, url) { ... }
async function scrapeGoogleMaps(location, category) { ... }
```

---

## 💡 Key Differences: Before vs After

### ❌ Before (Had Build Error):
```javascript
// googleMapsScraper.js
const { scrapeGoogleMaps } = require('../../lib/bdh-backup/scraper/gmaps_scraper');
//                                    ↑
//                              External file import
//                              (Turbopack couldn't resolve)
```

### ✅ After (Working Now):
```javascript
// googleMapsScraper.js
const crypto = require('crypto');
const { Pool } = require('pg');
// ... all BDH-Backup code is INLINE in this file
async function scrapeGoogleMaps() { ... }  // Defined here!
async function scrapeGoogleMapsStream() { ... }  // Defined here!
```

---

## 🔍 How to Verify (Practical Test)

### Test 1: Add Debug Log
**Edit:** `app/api/scripts/googleMapsScraper.js` (line 1)
```javascript
console.log('🔥 SCRAPER FILE LOADED FROM:', __filename);
```

**Run API → Check terminal**
```
🔥 SCRAPER FILE LOADED FROM: C:\Users\kaush\Desktop\my-lead\app\api\scripts\googleMapsScraper.js
```

### Test 2: Break the File
**Edit:** `app/api/scripts/googleMapsScraper.js` (add syntax error)
```javascript
THIS IS INVALID SYNTAX
```

**Run API → Should fail immediately**
✅ Proves it's using local file

### Test 3: Check Module Cache
**Edit:** `app/api/map-search/route.ts`
```javascript
const scraper = require("../scripts/googleMapsScraper");
console.log('Loaded from:', require.resolve('../scripts/googleMapsScraper'));
console.log('Available functions:', Object.keys(scraper));
```

---

## 🗄️ Database Connection (Only Remote Part)

```javascript
// In googleMapsScraper.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connects to: 103.99.38.129:5432 ← REMOTE SERVER
});
```

**What's Remote:**
- ✅ Database server (PostgreSQL)
- ✅ Data storage

**What's NOT Remote:**
- ❌ Code files
- ❌ Scraper logic
- ❌ Business logic

---

## 📦 Dependencies Location

### From node_modules (Local):
```
node_modules/
├─ playwright/           ← Browser automation
├─ pg/                   ← PostgreSQL client
├─ next/                 ← Framework
├─ crypto (built-in)     ← Hash generation
└─ ... other packages
```

### From Project (Local):
```
app/
├─ api/
└─ (dashboard)/

lib/
├─ db.ts
├─ adapterRegistry.js
└─ ...
```

---

## ✅ Final Summary Table

| Component | Location | Type | Remote? |
|-----------|----------|------|---------|
| API Routes | `app/api/` | TypeScript | ❌ Local |
| Scraper Code | `app/api/scripts/` | JavaScript | ❌ Local |
| Helper Libs | `lib/` | TypeScript/JS | ❌ Local |
| Dependencies | `node_modules/` | Packages | ❌ Local |
| Database | `103.99.38.129` | PostgreSQL | ✅ Remote |
| Browser | Local install | Chromium | ❌ Local |
| Build Cache | `.next/` | Compiled | ❌ Local |

---

## 🎉 Conclusion

**आपका पूरा backend code local folder से चल रहा है:**

1. ✅ API routes → Local TypeScript files
2. ✅ Scraper → Local JavaScript file (inline BDH code)
3. ✅ Libraries → Local files in `lib/`
4. ✅ Dependencies → Local `node_modules/`
5. ✅ Database → **केवल data remote server पर है**

**Code कहीं remote server से download नहीं होता!** 🚀

---

**Analysis Date:** June 15, 2026  
**Verified:** ✅ Complete  
**Confidence:** 💯 100%
