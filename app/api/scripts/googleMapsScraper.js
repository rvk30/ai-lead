const { chromium } = require('playwright');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// ---- Safe helpers ----
async function safeAttr(locator, attr, timeout = 3000) {
    try {
        return (await locator.getAttribute(attr, { timeout })) || '';
    } catch {
        return '';
    }
}

async function safeText(locator, timeout = 3000) {
    try {
        return (await locator.textContent({ timeout })) || '';
    } catch {
        return '';
    }
}

function withTimeout(promise, ms, label = 'task') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`TIMEOUT: ${label} took longer than ${ms}ms`)), ms)
        ),
    ]);
}

function generateHash(data) {
    const normalized = JSON.stringify({
        company_name: (data.company_name || '').toLowerCase().trim(),
        mobile_number: (data.mobile_number || '').replace(/\D/g, '').trim(),
        email: (data.email || '').toLowerCase().trim(),
    });
    return crypto.createHash('md5').update(normalized).digest('hex');
}

// saveToDB: sirf non-stream version use karta hai
async function saveToDB(results) {
    let inserted = 0, duplicates = 0;
    for (const data of results) {
        if (!data.company_name) continue;
        const rawHash = generateHash(data);
        try {
            const result = await pool.query(
                `INSERT INTO lead_intelligence.raw_records 
                 (source_record_id, raw_payload, raw_hash)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (raw_hash) DO NOTHING
                 RETURNING raw_id`,
                [
                    `gmaps_${data.company_name.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}_${Date.now()}`,
                    JSON.stringify(data),
                    rawHash
                ]
            );
            result.rows.length ? inserted++ : duplicates++;
        } catch (err) {
            console.error('DB insert error:', err.message);
        }
    }
    console.log(`DB: ${inserted} inserted, ${duplicates} duplicates skipped`);
    return { inserted, duplicates };
}

// ---- FIX 1: sitePage ab finally mein close hota hai (leaked tabs fix) ----
async function scrapeEmailFromWebsite(browser, websiteUrl) {
    let cleanUrl = websiteUrl;
    try {
        if (websiteUrl.includes('google.com/url')) {
            const urlObj = new URL(websiteUrl);
            cleanUrl = urlObj.searchParams.get('url') || websiteUrl;
        }
    } catch {}

    const pagesToCheck = [
        cleanUrl,
        cleanUrl.replace(/\/$/, '') + '/contact',
        cleanUrl.replace(/\/$/, '') + '/contact-us',
        cleanUrl.replace(/\/$/, '') + '/about',
    ];

    for (const pageUrl of pagesToCheck) {
        let sitePage;
        try {
            sitePage = await browser.newPage();
            await sitePage.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
            const bodyText = await sitePage.locator('body').textContent({ timeout: 5000 });

            const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                const email = emailMatch[0].toLowerCase();
                if (!email.includes('sentry') && !email.includes('example') &&
                    !email.includes('test@') && !email.includes('@2x') &&
                    !email.includes('.png') && !email.includes('.jpg') &&
                    !email.includes('schema.org') && !email.includes('google.com')) {
                    return email;
                }
            }
        } catch {
            // continue to next URL
        } finally {
            // FIX: success ya fail dono case mein page close hoga - no more leaked tabs
            if (sitePage) await sitePage.close().catch(() => {});
        }
    }
    return null;
}

// ---- Mode-aware business detail scraper ----
async function scrapeBusinessDetails(browser, business, category, mode = 'enrich') {
    if (mode === 'fast') {
        return {
            company_name: business.name,
            mobile_number: '',
            email: '',
            website_url: '',
            address: '',
            business_category: category,
            google_rating: '',
            source_file: 'google_maps',
        };
    }

    const page = await browser.newPage();
    try {
        await page.goto(business.url, { waitUntil: 'load', timeout: 20000 });
        await page.waitForTimeout(1000);

        const address = await safeAttr(page.locator('button[data-item-id="address"]'), 'aria-label');

        const websiteLocator = page.locator('a[data-item-id="authority"]').first();
        let website = await safeAttr(websiteLocator, 'href');
        if (!website) website = await safeText(websiteLocator);

        const phone = await safeAttr(page.locator('button[data-item-id*="phone"]').first(), 'aria-label');

        let rating = (await safeText(page.locator('div.F7nice span[aria-hidden="true"]').first())).trim();
        if (!rating) {
            const ratingAria = await safeAttr(page.locator('span[aria-label*="stars"]').first(), 'aria-label');
            rating = ratingAria ? ratingAria.replace(' stars', '').trim() : '';
        }

        await page.close();

        // ENRICH = email skip, FULL = email bhi nikaalo
        let email = '';
        if (mode === 'full' && website) {
            email = (await scrapeEmailFromWebsite(browser, website)) || '';
        }

        return {
            company_name: business.name,
            mobile_number: phone,
            email,
            website_url: website,
            address,
            business_category: category,
            google_rating: rating,
            source_file: 'google_maps',
        };
    } catch (err) {
        console.error('Failed for:', business.name, err.message);
        await page.close().catch(() => {});
        return null;
    }
}

async function processBatch(browser, businesses, category, mode) {
    const results = await Promise.all(
        businesses.map((b) =>
            withTimeout(scrapeBusinessDetails(browser, b, category, mode), 45000, b.name).catch((err) => {
                console.error('Skipped (timeout/error):', b.name, err.message);
                return null;
            })
        )
    );
    return results.filter((r) => r !== null);
}

// ---- Non-stream version: saveToDB yahaan sahi hai ----
async function scrapeGoogleMaps(location, category, mode = 'full') {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    const page = await browser.newPage();
    const results = [];

    try {
        await page.goto('https://www.google.com/maps', { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const input = page.locator('input').first();
        await input.click();
        await input.fill(`${category} in ${location}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        const scrollableDiv = page.locator('div[role="feed"]').first();
        let previousHeight = 0, scrollAttempts = 0;

        while (scrollAttempts < 5) {
            try {
                const currentHeight = await scrollableDiv.evaluate((el) => el.scrollHeight);
                if (currentHeight === previousHeight) break;
                await scrollableDiv.evaluate((el) => el.scrollTo(0, el.scrollHeight));
                await page.waitForTimeout(1000);
                previousHeight = currentHeight;
                scrollAttempts++;
            } catch {
                break;
            }
        }

        const places = await page.locator('a[href*="/maps/place/"]').evaluateAll((els) =>
            els.map((el) => ({ href: el.href }))
        );

        const businesses = [];
        places.forEach((place) => {
            try {
                const name = decodeURIComponent(place.href.split('/place/')[1].split('/data=')[0]).replace(/\+/g, ' ');
                if (name && name.length > 2 && !businesses.some((b) => b.name === name)) {
                    businesses.push({ name, url: place.href });
                }
            } catch {}
        });

        await page.close();

        for (let i = 0; i < businesses.length; i += 2) {
            const batch = businesses.slice(i, i + 2);
            const batchResults = await processBatch(browser, batch, category, mode);
            results.push(...batchResults);
        }

        // Non-stream version: yahaan saveToDB sahi hai
        const { inserted, duplicates } = await saveToDB(results);
        return { results, inserted, duplicates };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await browser.close().catch(() => {});
    }
}

// ---- FIX 2: Stream version mein saveToDB HATA DIYA (route.ts already insert kar raha hai) ----
// FIX 3: scroll event mein field names fix kiye (current/total instead of attempt/max)
// FIX 4: onProgress ab properly awaited hai
async function scrapeGoogleMapsStream(location, category, onProgress, shouldStop, mode = 'enrich') {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    const page = await browser.newPage();
    const results = [];

    try {
        await onProgress({ type: 'status', message: 'Opening Google Maps...' });
        await page.goto('https://www.google.com/maps', { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const input = page.locator('input').first();
        await input.click();
        await input.fill(`${category} in ${location}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        await onProgress({ type: 'status', message: 'Scrolling to load results...' });
        const scrollableDiv = page.locator('div[role="feed"]').first();
        let previousHeight = 0, scrollAttempts = 0;

        while (scrollAttempts < 5) {
            try {
                const currentHeight = await scrollableDiv.evaluate((el) => el.scrollHeight);
                if (currentHeight === previousHeight) break;
                await scrollableDiv.evaluate((el) => el.scrollTo(0, el.scrollHeight));
                await page.waitForTimeout(1000);
                previousHeight = currentHeight;
                scrollAttempts++;
                // FIX 3: current/total use karo (attempt/max nahi)
                await onProgress({ type: 'scroll', current: scrollAttempts, total: 5 });
            } catch {
                break;
            }
        }

        const places = await page.locator('a[href*="/maps/place/"]').evaluateAll((els) =>
            els.map((el) => ({ href: el.href }))
        );

        const businesses = [];
        places.forEach((place) => {
            try {
                const name = decodeURIComponent(place.href.split('/place/')[1].split('/data=')[0]).replace(/\+/g, ' ');
                if (name && name.length > 2 && !businesses.some((b) => b.name === name)) {
                    businesses.push({ name, url: place.href });
                }
            } catch {}
        });

        await onProgress({ type: 'found', count: businesses.length, message: `Found ${businesses.length} businesses` });
        await page.close();

        for (let i = 0; i < businesses.length; i += 2) {
            if (shouldStop && shouldStop()) {
                console.log('Stop requested, breaking loop');
                break;
            }

            const batch = businesses.slice(i, i + 2);
            // FIX 4: onProgress properly awaited
            await onProgress({
                type: 'progress',
                current: i,
                total: businesses.length,
                message: `Processing ${i + 1}-${Math.min(i + 2, businesses.length)} of ${businesses.length}`,
            });

            const batchResults = await processBatch(browser, batch, category, mode);
            for (const result of batchResults) {
                if (result) {
                    results.push(result);
                    // FIX 4: await here bhi - DB insert race condition fix
                    await onProgress({ type: 'business', data: result, count: results.length, total: businesses.length });
                }
            }
        }

        // FIX 2: saveToDB yahaan SE HATA DIYA
        // Route.ts already onProgress('business') ke andar insert kar raha hai
        // Dobara saveToDB call = double insert + "pool called end more than once" error
        await onProgress({
            type: 'complete',
            message: 'Scraping complete',
        });

        return { results };
    } catch (error) {
        if (error.message !== 'STOPPED_BY_USER') {
            console.error('Scrape stream error:', error);
        }
        throw error;
    } finally {
        await browser.close().catch(() => {});
    }
}

module.exports = { scrapeGoogleMaps, scrapeGoogleMapsStream };