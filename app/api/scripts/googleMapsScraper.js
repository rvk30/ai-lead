// const { chromium } = require('playwright');

// // Helper function to scrape single business
// async function scrapeBusinessDetails(browser, business, category) {
//   const page = await browser.newPage();
  
//   try {
//     console.log('Opening:', business.name);

//     await page.goto(business.url, {
//       waitUntil: 'domcontentloaded',
//       timeout: 60000,
//     });

//     await page.waitForTimeout(3000); // Reduced from 5s to 3s

//     let address = '';
//     let website = '';
//     let phone = '';
//     let email = '';
//     let rating = '';

//     // Address
//     try {
//       address =
//         (await page
//           .locator('button[data-item-id="address"]')
//           .getAttribute('aria-label')) || '';
//     } catch {}

//     // Website
//     try {
//       // Try to get href first (actual link)
//       const websiteLink = await page
//         .locator('a[data-item-id="authority"]')
//         .first()
//         .getAttribute('href');
      
//       if (websiteLink) {
//         // Extract actual domain from Google redirect URL
//         website = websiteLink;
//       } else {
//         // Fallback to text content
//         website =
//           (await page
//             .locator('a[data-item-id="authority"]')
//             .first()
//             .textContent()) || '';
//       }
//     } catch {}

//     // Phone
//     try {
//       phone =
//         (await page
//           .locator('button[data-item-id*="phone"]')
//           .first()
//           .getAttribute('aria-label')) || '';
//     } catch {}

//     // Rating - Extract from stars section
//     try {
//       const ratingText = await page
//         .locator('div[role="img"][aria-label*="stars"]')
//         .first()
//         .getAttribute('aria-label');
      
//       if (ratingText) {
//         // Extract number from "4.5 stars" format
//         const match = ratingText.match(/(\d+\.?\d*)/);
//         if (match) {
//           rating = match[1];
//         }
//       }
//     } catch {}

//     // Email - Try multiple selectors
//     try {
//       // Method 1: Look for email in text content
//       const pageContent = await page.content();
//       const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
//       const emails = pageContent.match(emailRegex);
//       if (emails && emails.length > 0) {
//         // Filter out common false positives
//         const validEmail = emails.find(e => 
//           !e.includes('google.com') && 
//           !e.includes('gstatic.com') &&
//           !e.includes('example.com')
//         );
//         email = validEmail || '';
//       }
//     } catch {}

//     await page.close();

//     return {
//       company_name: business.name,
//       mobile_number: phone,
//       email: email,
//       website_url: website,
//       address,
//       business_category: category,
//       google_rating: rating,
//       source_file: 'google_maps',
//     };
//   } catch (err) {
//     console.error('Failed for:', business.name, err.message);
//     await page.close().catch(() => {});
//     return null;
//   }
// }

// // Helper function to process batch
// async function processBatch(browser, businesses, category) {
//   const promises = businesses.map(business => 
//     scrapeBusinessDetails(browser, business, category)
//   );
  
//   const results = await Promise.all(promises);
//   return results.filter(result => result !== null);
// }

// async function scrapeGoogleMaps(location, category) {
//   const browser = await chromium.launch({
//     headless: true,
//   });

//   const page = await browser.newPage();

//   const searchQuery = `${category} in ${location}`;

//   const results = [];

//   try {
//     console.log('Searching:', searchQuery);

//     await page.goto('https://www.google.com/maps', {
//       waitUntil: 'domcontentloaded',
//       timeout: 60000,
//     });

//     await page.waitForTimeout(3000); // Reduced from 5s

//     const input = page.locator('input').first();

//     await input.click();
//     await input.fill(searchQuery);

//     await page.keyboard.press('Enter');

//     await page.waitForTimeout(10000); // Reduced from 15s

//     // Scroll to load more results
//     console.log('Scrolling to load more results...');
    
//     const scrollableDiv = page.locator('div[role="feed"]').first();
    
//     let previousHeight = 0;
//     let scrollAttempts = 0;
//     const maxScrollAttempts = 5; // Reduced from 10 to 5
    
//     while (scrollAttempts < maxScrollAttempts) {
//       try {
//         // Get current scroll height
//         const currentHeight = await scrollableDiv.evaluate((el) => el.scrollHeight);
        
//         // If no more content to load, break
//         if (currentHeight === previousHeight) {
//           console.log('No more results to load');
//           break;
//         }
        
//         // Scroll to bottom
//         await scrollableDiv.evaluate((el) => {
//           el.scrollTo(0, el.scrollHeight);
//         });
        
//         console.log(`Scroll attempt ${scrollAttempts + 1}/${maxScrollAttempts}`);
        
//         await page.waitForTimeout(2000); // Wait for new results to load
        
//         previousHeight = currentHeight;
//         scrollAttempts++;
//       } catch (err) {
//         console.log('Scroll error, continuing...', err.message);
//         break;
//       }
//     }
    
//     console.log('Finished scrolling, extracting all businesses...');

//     const places = await page
//       .locator('a[href*="/maps/place/"]')
//       .evaluateAll((elements) =>
//         elements.map((el) => ({
//           href: el.href,
//         }))
//       );

//     const businesses = [];

//     places.forEach((place) => {
//       try {
//         const name = decodeURIComponent(
//           place.href.split('/place/')[1].split('/data=')[0]
//         ).replace(/\+/g, ' ');

//         if (
//           name &&
//           name.length > 2 &&
//           !businesses.some((b) => b.name === name)
//         ) {
//           businesses.push({
//             name,
//             url: place.href,
//           });
//         }
//       } catch (err) {}
//     });

//     console.log('Businesses Found:', businesses.length);

//     await page.close();

//     // Process in batches of 5 for parallel scraping
//     const BATCH_SIZE = 5;
    
//     for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
//       const batch = businesses.slice(i, i + BATCH_SIZE);
//       console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} businesses`);
      
//       const batchResults = await processBatch(browser, batch, category);
//       results.push(...batchResults);
      
//       console.log(`Completed ${results.length}/${businesses.length} businesses`);
//     }

//     return results;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   } finally {
//     await browser.close();
//   }
// }

// module.exports = {
//   scrapeGoogleMaps,
//   scrapeGoogleMapsStream,
// };

// // Streaming version with progress callback
// async function scrapeGoogleMapsStream(location, category, onProgress) {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();
//   const searchQuery = `${category} in ${location}`;

//   try {
//     console.log('Searching:', searchQuery);
//     onProgress({ type: 'status', message: 'Opening Google Maps...' });

//     await page.goto('https://www.google.com/maps', {
//       waitUntil: 'domcontentloaded',
//       timeout: 60000,
//     });

//     await page.waitForTimeout(3000);
//     const input = page.locator('input').first();
//     await input.click();
//     await input.fill(searchQuery);
//     await page.keyboard.press('Enter');
//     await page.waitForTimeout(10000);

//     onProgress({ type: 'status', message: 'Scrolling to load results...' });

//     // Scroll logic
//     const scrollableDiv = page.locator('div[role="feed"]').first();
//     let scrollAttempts = 0;
//     const maxScrollAttempts = 5;
//     let previousHeight = 0;

//     while (scrollAttempts < maxScrollAttempts) {
//       try {
//         const currentHeight = await scrollableDiv.evaluate((el) => el.scrollHeight);
//         if (currentHeight === previousHeight) break;
        
//         await scrollableDiv.evaluate((el) => el.scrollTo(0, el.scrollHeight));
//         await page.waitForTimeout(2000);
        
//         previousHeight = currentHeight;
//         scrollAttempts++;
//         onProgress({ type: 'scroll', attempt: scrollAttempts, max: maxScrollAttempts });
//       } catch (err) {
//         break;
//       }
//     }

//     const places = await page
//       .locator('a[href*="/maps/place/"]')
//       .evaluateAll((elements) =>
//         elements.map((el) => ({ href: el.href }))
//       );

//     const businesses = [];
//     places.forEach((place) => {
//       try {
//         const name = decodeURIComponent(
//           place.href.split('/place/')[1].split('/data=')[0]
//         ).replace(/\+/g, ' ');

//         if (name && name.length > 2 && !businesses.some((b) => b.name === name)) {
//           businesses.push({ name, url: place.href });
//         }
//       } catch (err) {}
//     });

//     onProgress({ 
//       type: 'found', 
//       count: businesses.length,
//       message: `Found ${businesses.length} businesses` 
//     });

//     await page.close();

//     // Process in batches with progress updates
//     const BATCH_SIZE = 5;
//     const results = [];

//     for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
//       const batch = businesses.slice(i, i + BATCH_SIZE);
//       onProgress({ 
//         type: 'progress', 
//         current: i, 
//         total: businesses.length,
//         message: `Processing ${i + 1}-${Math.min(i + BATCH_SIZE, businesses.length)} of ${businesses.length}` 
//       });

//       const batchResults = await processBatch(browser, batch, category);
      
//       // Send each result immediately
//       for (const result of batchResults) {
//         if (result) {
//           results.push(result);
//           onProgress({ 
//             type: 'business', 
//             data: result,
//             count: results.length,
//             total: businesses.length 
//           });
//         }
//       }
//     }

//     await browser.close();
//     return results;
//   } catch (error) {
//     await browser.close();
//     throw error;
//   }
// }

const { chromium } = require('playwright');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

function generateHash(data) {
    const normalized = JSON.stringify({
        company_name: (data.company_name || '').toLowerCase().trim(),
        mobile_number: (data.mobile_number || '').replace(/\D/g, '').trim(),
        email: (data.email || '').toLowerCase().trim(),
    });
    return crypto.createHash('md5').update(normalized).digest('hex');
}

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
    console.log(`✅ DB: ${inserted} inserted, ${duplicates} duplicates skipped`);
    return { inserted, duplicates };
}

async function scrapeBusinessDetails(browser, business, category) {
    const page = await browser.newPage();
    try {
        console.log('Opening:', business.name);
        await page.goto(business.url, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(1500);

        let address = '', website = '', phone = '', rating = '', email = '';

        try {
            address = (await page.locator('button[data-item-id="address"]').getAttribute('aria-label')) || '';
        } catch {}

        try {
            const websiteLink = await page.locator('a[data-item-id="authority"]').first().getAttribute('href');
            website = websiteLink || (await page.locator('a[data-item-id="authority"]').first().textContent()) || '';
        } catch {}

        try {
            phone = (await page.locator('button[data-item-id*="phone"]').first().getAttribute('aria-label')) || '';
        } catch {}

        try {
            const ratingText = await page.locator('div.F7nice span[aria-hidden="true"]').first().textContent();
            rating = ratingText ? ratingText.trim() : '';
        } catch {}

        if (!rating) {
            try {
                const ratingAria = await page.locator('span[aria-label*="stars"]').first().getAttribute('aria-label');
                rating = ratingAria ? ratingAria.replace(' stars', '').trim() : '';
            } catch {}
        }

        await page.close();

        if (website) {
            const emailFound = await scrapeEmailFromWebsite(browser, website);
            email = emailFound || '';
        }

        return {
            company_name: business.name,
            mobile_number: phone,
            email,
            website_url: website,
            address,
            business_category: category,
            google_rating: rating,
            source_file: 'google_maps'
        };
    } catch (err) {
        console.error('Failed for:', business.name, err.message);
        await page.close().catch(() => {});
        return null;
    }
}

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
        try {
            const sitePage = await browser.newPage();
            await sitePage.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const bodyText = await sitePage.locator('body').textContent();
            await sitePage.close();

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
        } catch { continue; }
    }
    return null;
}

async function processBatch(browser, businesses, category) {
    const results = await Promise.all(
        businesses.map(b => scrapeBusinessDetails(browser, b, category))
    );
    return results.filter(r => r !== null);
}

async function scrapeGoogleMaps(location, category) {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    const results = [];

    try {
        console.log('Searching:', `${category} in ${location}`);
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
                const currentHeight = await scrollableDiv.evaluate(el => el.scrollHeight);
                if (currentHeight === previousHeight) break;
                await scrollableDiv.evaluate(el => el.scrollTo(0, el.scrollHeight));
                await page.waitForTimeout(1000);
                previousHeight = currentHeight;
                scrollAttempts++;
            } catch { break; }
        }

        const places = await page.locator('a[href*="/maps/place/"]').evaluateAll(els =>
            els.map(el => ({ href: el.href }))
        );

        const businesses = [];
        places.forEach(place => {
            try {
                const name = decodeURIComponent(
                    place.href.split('/place/')[1].split('/data=')[0]
                ).replace(/\+/g, ' ');
                if (name && name.length > 2 && !businesses.some(b => b.name === name)) {
                    businesses.push({ name, url: place.href });
                }
            } catch {}
        });

        console.log('Businesses Found:', businesses.length);
        await page.close();

        for (let i = 0; i < businesses.length; i += 2) {
            const batch = businesses.slice(i, i + 2);
            console.log(`Batch ${Math.floor(i / 2) + 1}: ${batch.length} businesses`);
            const batchResults = await processBatch(browser, batch, category);
            results.push(...batchResults);
            console.log(`Completed ${results.length}/${businesses.length}`);
        }

        const { inserted, duplicates } = await saveToDB(results);
        return { results, inserted, duplicates };

    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function scrapeGoogleMapsStream(location, category, onProgress) {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    const results = [];

    try {
        onProgress({ type: 'status', message: 'Opening Google Maps...' });
        await page.goto('https://www.google.com/maps', { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const input = page.locator('input').first();
        await input.click();
        await input.fill(`${category} in ${location}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        onProgress({ type: 'status', message: 'Scrolling to load results...' });
        const scrollableDiv = page.locator('div[role="feed"]').first();
        let previousHeight = 0, scrollAttempts = 0;

        while (scrollAttempts < 5) {
            try {
                const currentHeight = await scrollableDiv.evaluate(el => el.scrollHeight);
                if (currentHeight === previousHeight) break;
                await scrollableDiv.evaluate(el => el.scrollTo(0, el.scrollHeight));
                await page.waitForTimeout(1000);
                previousHeight = currentHeight;
                scrollAttempts++;
                onProgress({ type: 'scroll', attempt: scrollAttempts, max: 5 });
            } catch { break; }
        }

        const places = await page.locator('a[href*="/maps/place/"]').evaluateAll(els =>
            els.map(el => ({ href: el.href }))
        );

        const businesses = [];
        places.forEach(place => {
            try {
                const name = decodeURIComponent(
                    place.href.split('/place/')[1].split('/data=')[0]
                ).replace(/\+/g, ' ');
                if (name && name.length > 2 && !businesses.some(b => b.name === name)) {
                    businesses.push({ name, url: place.href });
                }
            } catch {}
        });

        onProgress({ type: 'found', count: businesses.length, message: `Found ${businesses.length} businesses` });
        await page.close();

        for (let i = 0; i < businesses.length; i += 2) {
            const batch = businesses.slice(i, i + 2);
            onProgress({ type: 'progress', current: i, total: businesses.length,
                message: `Processing ${i + 1}-${Math.min(i + 2, businesses.length)} of ${businesses.length}` });

            const batchResults = await processBatch(browser, batch, category);
            for (const result of batchResults) {
                if (result) {
                    results.push(result);
                    onProgress({ type: 'business', data: result, count: results.length, total: businesses.length });
                }
            }
        }

        onProgress({ type: 'status', message: 'Saving to database...' });
        const { inserted, duplicates } = await saveToDB(results);
        onProgress({ type: 'saved', inserted, duplicates,
            message: `Done! ${inserted} saved, ${duplicates} duplicates skipped` });

        return { results, inserted, duplicates };

    } catch (error) {
        throw error;
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeGoogleMaps, scrapeGoogleMapsStream };