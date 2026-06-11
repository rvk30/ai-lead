const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const page = await browser.newPage();

  try {
    console.log('Opening Google Maps...');

    await page.goto('https://www.google.com/maps', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    const input = page.locator('input').first();

    await input.click();
    await input.fill('Manufacturing companies in Gurgaon');

    console.log('Search text entered');

    await page.keyboard.press('Enter');

    console.log('Search submitted');

    await page.waitForTimeout(15000);

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

    console.log('\n===== BUSINESSES FOUND =====\n');

    businesses.forEach((business, index) => {
      console.log(`${index + 1}. ${business.name}`);
    });

    console.log('\nTotal Businesses:', businesses.length);

    if (businesses.length === 0) {
      console.log('No businesses found');
      return;
    }

    const firstBusiness = businesses[0];

    console.log('\n===== OPENING FIRST BUSINESS =====');
    console.log('Name:', firstBusiness.name);

    await page.goto(firstBusiness.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(10000);

    let address = '';
    let website = '';
    let phone = '';

    // Address
    try {
      address =
        (await page
          .locator('button[data-item-id="address"]')
          .getAttribute('aria-label')) || '';
    } catch (e) {}

    // Website
    try {
      website =
        (await page
          .locator('a[data-item-id="authority"]')
          .first()
          .textContent()) || '';
    } catch (e) {}

    // Phone
    try {
      phone =
        (await page
          .locator('button[data-item-id*="phone"]')
          .first()
          .getAttribute('aria-label')) || '';
    } catch (e) {}

    const result = {
      businessName: firstBusiness.name,
      address,
      website,
      phone,
    };

    console.log('\n===== BUSINESS DETAILS =====');
    console.log(JSON.stringify(result, null, 2));

    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('ERROR:', error);
  }

  // await browser.close();
})();