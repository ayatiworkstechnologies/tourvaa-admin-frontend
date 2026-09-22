import { chromium } from '@playwright/test';

const outPath = 'C:\\Users\\Lap1623\\.gemini\\antigravity-ide\\brain\\14d3d71d-a422-442e-a023-9cd2312b8fb3\\screenshots\\tour-detail-mosaic-verified.png';

async function testMosaic() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  console.log('Navigating to /tours/1...');
  await page.goto('http://localhost:3000/tours/1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss cookie banner
  try {
    const cookieClose = page.locator('button:has-text("Accept"), button:has-text("Allow"), button[aria-label="Close"]');
    if (await cookieClose.count() > 0) {
      await cookieClose.first().click();
      await page.waitForTimeout(400);
    }
  } catch (e) {}

  // Find Section 3 photo gallery
  const gallerySection = page.locator('section.mt-5');
  await gallerySection.waitFor({ timeout: 10000 });
  await gallerySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  await gallerySection.screenshot({ path: outPath });
  console.log('Saved mosaic screenshot to:', outPath);

  await browser.close();
}

testMosaic().catch(err => {
  console.error(err);
  process.exit(1);
});
