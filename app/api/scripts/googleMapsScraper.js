const { chromium } = require('playwright');

// Helper function to scrape single business
async function scrapeBusinessDetails(browser, business, category) {
  const page = await browser.newPage();
  
  try {
    console.log('Opening:', business.name);

    await page.goto(business.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000); // Reduced from 5s to 3s

    let address = '';
    let website = '';
    let phone = '';
    let email = '';

    // Address
    try {
      address =
        (await page
          .locator('button[data-item-id="address"]')
          .getAttribute('aria-label')) || '';
    } catch {}

    // Website
    try {
      // Try to get href first (actual link)
      const websiteLink = await page
        .locator('a[data-item-id="authority"]')
        .first()
        .getAttribute('href');
      
      if (websiteLink) {
        // Extract actual domain from Google redirect URL
        website = websiteLink;
      } else {
        // Fallback to text content
        website =
          (await page
            .locator('a[data-item-id="authority"]')
            .first()
            .textContent()) || '';
      }
    } catch {}

    // Phone
    try {
      phone =
        (await page
          .locator('button[data-item-id*="phone"]')
          .first()
          .getAttribute('aria-label')) || '';
    } catch {}

    // Email - Try multiple selectors
    try {
      // Method 1: Look for email in text content
      const pageContent = await page.content();
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = pageContent.match(emailRegex);
      if (emails && emails.length > 0) {
        // Filter out common false positives
        const validEmail = emails.find(e => 
          !e.includes('google.com') && 
          !e.includes('gstatic.com') &&
          !e.includes('example.com')
        );
        email = validEmail || '';
      }
    } catch {}

    await page.close();

    return {
      company_name: business.name,
      mobile_number: phone,
      email: email,
      website_url: website,
      address,
      business_category: category,
      source_file: 'google_maps',
    };
  } catch (err) {
    console.error('Failed for:', business.name, err.message);
    await page.close().catch(() => {});
    return null;
  }
}

// Helper function to process batch
async function processBatch(browser, businesses, category) {
  const promises = businesses.map(business => 
    scrapeBusinessDetails(browser, business, category)
  );
  
  const results = await Promise.all(promises);
  return results.filter(result => result !== null);
}

async function scrapeGoogleMaps(location, category) {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  const searchQuery = `${category} in ${location}`;

  const results = [];

  try {
    console.log('Searching:', searchQuery);

    await page.goto('https://www.google.com/maps', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000); // Reduced from 5s

    const input = page.locator('input').first();

    await input.click();
    await input.fill(searchQuery);

    await page.keyboard.press('Enter');

    await page.waitForTimeout(10000); // Reduced from 15s

    // Scroll to load more results
    console.log('Scrolling to load more results...');
    
    const scrollableDiv = page.locator('div[role="feed"]').first();
    
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 5; // Reduced from 10 to 5
    
    while (scrollAttempts < maxScrollAttempts) {
      try {
        // Get current scroll height
        const currentHeight = await scrollableDiv.evaluate((el) => el.scrollHeight);
        
        // If no more content to load, break
        if (currentHeight === previousHeight) {
          console.log('No more results to load');
          break;
        }
        
        // Scroll to bottom
        await scrollableDiv.evaluate((el) => {
          el.scrollTo(0, el.scrollHeight);
        });
        
        console.log(`Scroll attempt ${scrollAttempts + 1}/${maxScrollAttempts}`);
        
        await page.waitForTimeout(2000); // Wait for new results to load
        
        previousHeight = currentHeight;
        scrollAttempts++;
      } catch (err) {
        console.log('Scroll error, continuing...', err.message);
        break;
      }
    }
    
    console.log('Finished scrolling, extracting all businesses...');

    const places = await page
      .locator('a[href*="/maps/place/"]')
      .evaluateAll((elements) =>
        elements.map((el) => ({
          href: el.href,
        }))
      );

    const businesses = [];

    places.forEach((place) => {
      try {
        const name = decodeURIComponent(
          place.href.split('/place/')[1].split('/data=')[0]
        ).replace(/\+/g, ' ');

        if (
          name &&
          name.length > 2 &&
          !businesses.some((b) => b.name === name)
        ) {
          businesses.push({
            name,
            url: place.href,
          });
        }
      } catch (err) {}
    });

    console.log('Businesses Found:', businesses.length);

    await page.close();

    // Process in batches of 5 for parallel scraping
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} businesses`);
      
      const batchResults = await processBatch(browser, batch, category);
      results.push(...batchResults);
      
      console.log(`Completed ${results.length}/${businesses.length} businesses`);
    }

    return results;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeGoogleMaps,
};