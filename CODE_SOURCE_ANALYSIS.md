# 🔍 Code Source Analysis - Backend Files vs Server

## ✅ Answer: आपका Backend **LOCAL FILES** से code use कर रहा है!

---

## 📂 Current Import Chain

### 1️⃣ API Routes (3 files) → Local File
```
app/api/map-search/route.ts
app/api/map-search-stream/route.ts
app/api/map-search-job/route.ts
```

**Import करते हैं:**
```javascript
const { scrapeGoogleMaps } = require('../scripts/googleMapsScraper');
const { scrapeGoogleMapsStream } = require('../scripts/googleMapsScraper');
```

### 2️⃣ googleMapsScraper.js → Inline Code
```
app/api/scripts/googleMapsScraper.js
```

**Currently:** BDH-Backup का code **INLINE** है (direct copy)
- ✅ सभी functions इसी file में हैं
- ✅ कोई external import नहीं
- ✅ Self-contained implementation

---

## 🔄 Code Flow Diagram

```
User Request
    ↓
API Route (route.ts)
    ↓
require('../scripts/googleMapsScraper')
    ↓
app/api/scripts/googleMapsScraper.js (LOCAL FILE)
    ↓
Inline BDH-Backup Code
    ↓
Playwright Browser
    ↓
Google Maps Scraping
    ↓
Database Insert
    ↓
Response to User
```

---

## 🗂️ File Locations

### ✅ Currently Used (Local Folder Files)
1. **`app/api/scripts/googleMapsScraper.js`** ← ⭐ Main scraper (inline code)
2. **`app/api/map-search/route.ts`** ← API endpoint
3. **`app/api/map-search-stream/route.ts`** ← Streaming endpoint
4. **`app/api/map-search-job/route.ts`** ← Background job endpoint
5. **`lib/adapterRegistry.js`** ← Column mapping
6. **`lib/scrapingRegistry.ts`** ← Process management
7. **`lib/db.ts`** ← Database connection

### 📚 Reference (Not Used in Runtime)
- **`lib/bdh-backup/scraper/gmaps_scraper.js`** ← Original implementation
- **`lib/bdh-backup/pipeline/`** ← CSV/Excel processing
- **`lib/bdh-backup/worker/`** ← Background workers

---

## 🎯 Key Points

### 1. **No Remote Server Code**
- ❌ Code किसी remote server से नहीं आता
- ✅ सब कुछ local project folder में है
- ✅ `node_modules` से भी नहीं

### 2. **No External Import for Scraper**
- ❌ पहले: `require('../../lib/bdh-backup/...')` (build error था)
- ✅ अब: Inline code directly in file
- ✅ No module resolution needed

### 3. **Database Connection**
- ✅ Environment variables से (`process.env.DATABASE_URL`)
- ✅ Remote PostgreSQL server पर connect करता है
- 📍 Server: `103.99.38.129:5432`

---

## 📊 What Runs Where

| Component | Location | Type |
|-----------|----------|------|
| **API Routes** | Local files | TypeScript |
| **Scraper Code** | Local file (inline) | JavaScript |
| **Playwright** | Local (installed) | npm package |
| **Database** | Remote server | PostgreSQL |
| **Browser** | Local (headless) | Chromium |

---

## 🔄 When You Edit Files

### ✅ Changes Reflected Immediately (with Hot Reload)
1. Edit `app/api/scripts/googleMapsScraper.js`
2. Next.js detects change
3. Rebuilds that route
4. New code runs on next request

### 🔄 May Need Restart
- `.env.local` changes → Need restart
- Major config changes → Need restart
- Build cache issues → Clear `.next/`

---

## 🧪 How to Verify

### Method 1: Add Console Log
**Edit:** `app/api/scripts/googleMapsScraper.js`
```javascript
async function scrapeGoogleMaps(location, category, options = {}) {
    console.log('🔥 Using INLINE BDH-BACKUP scraper!');
    // ... rest of code
}
```

**Test:** Call API and check terminal logs

### Method 2: Check Import
**Edit:** `app/api/map-search/route.ts`
```javascript
const scraper = require("../scripts/googleMapsScraper");
console.log('Scraper functions:', Object.keys(scraper));
```

### Method 3: Error Testing
**Break:** `app/api/scripts/googleMapsScraper.js`
```javascript
// Add syntax error
THIS WILL CAUSE ERROR
```
**Test:** API call will fail → proves it's using local file

---

## 📝 File Dependencies

```
app/api/map-search/route.ts
├── @/lib/db (local file)
├── @/lib/adapterRegistry (local file)
└── ../scripts/googleMapsScraper (local file)
    ├── crypto (Node.js built-in)
    ├── pg (from node_modules)
    └── playwright (from node_modules)
```

---

## 🎨 Color-Coded Summary

**🟢 Local Project Files (Your Folder)**
- API routes
- Scraper code (inline)
- Helper libraries
- Configuration

**🔵 NPM Packages (node_modules)**
- Next.js
- Playwright
- pg (PostgreSQL client)
- Other dependencies

**🟡 Remote Resources**
- PostgreSQL database (103.99.38.129)
- Google Maps website (scraping target)

**🔴 Not Used**
- No remote code server
- No CDN imports
- No external API for code

---

## ✅ Final Answer

**आपका backend पूरी तरह से local folder की files use कर रहा है:**

1. ✅ All TypeScript/JavaScript code → Local files
2. ✅ Scraper implementation → Inline in local file
3. ✅ Dependencies → node_modules (local)
4. ✅ Database → Remote server (only data, not code)

**कोई भी code remote server से नहीं आता - सब कुछ आपके project folder में है!** 🎯

---

**Analysis Date:** June 15, 2026  
**Status:** ✅ Verified  
**Source:** 100% Local Files
