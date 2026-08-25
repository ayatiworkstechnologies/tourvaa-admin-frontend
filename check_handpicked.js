const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const heading = await page.locator('h2:has-text("Handpicked Tours for You")').count();
  const section = page.locator('h2:has-text("Handpicked Tours for You")').locator('xpath=ancestor::section[1]');
  const cardCount = await section.locator('a, article').count();
  const cardTitles = await section.locator('h3, h4').allTextContents();

  console.log('heading found:', heading);
  console.log('card-like elements in section:', cardCount);
  console.log('titles:', JSON.stringify(cardTitles));
  console.log('console errors:', JSON.stringify(errors.slice(0, 10)));

  await browser.close();
})();
