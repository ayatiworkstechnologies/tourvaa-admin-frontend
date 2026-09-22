import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Lap1623\\.gemini\\antigravity-ide\\brain\\14d3d71d-a422-442e-a023-9cd2312b8fb3\\screenshots';

const BREAKPOINTS = [
  { name: 'mobile-se', width: 375, height: 667, deviceType: 'mobile' },
  { name: 'mobile-iphone14', width: 390, height: 844, deviceType: 'mobile' },
  { name: 'tablet-portrait', width: 768, height: 1024, deviceType: 'tablet' },
  { name: 'tablet-landscape', width: 1024, height: 768, deviceType: 'tablet' },
  { name: 'desktop-laptop', width: 1280, height: 800, deviceType: 'desktop' },
  { name: 'desktop-wide', width: 1920, height: 1080, deviceType: 'desktop' },
];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'tours', path: '/tours' },
  { name: 'tour-detail', path: '/tours/1' },
  { name: 'country-qatar', path: '/tours/qatar' },
  { name: 'login', path: '/login' },
  { name: 'accessibility', path: '/accessibility' }
];

async function runQA() {
  console.log('Starting Multi-Breakpoint QA Audit on live UI...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const results = [];

  for (const bp of BREAKPOINTS) {
    console.log(`\n========================================`);
    console.log(`Testing Breakpoint: ${bp.name} (${bp.width}x${bp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      userAgent: bp.deviceType === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      isMobile: bp.deviceType === 'mobile',
      hasTouch: bp.deviceType !== 'desktop'
    });

    const page = await context.newPage();

    for (const route of ROUTES) {
      const pageErrors = [];
      const consoleErrors = [];

      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const url = `http://localhost:3000${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);

        // Accept cookie if visible
        try {
          const cookieAccept = page.getByRole('button', { name: /accept all/i });
          if (await cookieAccept.isVisible({ timeout: 500 })) {
            await cookieAccept.click();
            await page.waitForTimeout(300);
          }
        } catch (_) {}

        // 1. Check Horizontal Overflow
        const overflowDetails = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winWidth = window.innerWidth;
          const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const hasOverflow = scrollWidth > winWidth + 1; // 1px margin
          
          let offendingElements = [];
          if (hasOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > winWidth + 1.5) {
                offendingElements.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || undefined,
                  className: typeof el.className === 'string' ? el.className.slice(0, 100) : undefined,
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
                if (offendingElements.length >= 5) break;
              }
            }
          }

          return {
            winWidth,
            scrollWidth,
            hasOverflow,
            offendingElements
          };
        });

        // 2. Capture Screenshot
        const screenshotFile = `${bp.name}-${route.name}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // 3. Mobile Navigation Drawer Test (only on mobile & home page)
        let drawerTest = null;
        if (bp.deviceType === 'mobile' && route.name === 'home') {
          try {
            // Find mobile menu toggle button (aria-label="Open navigation menu")
            const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="Open menu" i]').first();
            if (await hamburger.isVisible()) {
              await hamburger.click();
              await page.waitForTimeout(500);
              const drawerScreenshotFile = `${bp.name}-menu-drawer.png`;
              await page.screenshot({ path: path.join(SCREENSHOT_DIR, drawerScreenshotFile) });
              
              const drawerOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
              drawerTest = {
                opened: true,
                screenshot: drawerScreenshotFile,
                hasOverflow: drawerOverflow
              };
              // Close menu
              const closeBtn = page.locator('button[aria-label*="Close" i]').first();
              if (await closeBtn.isVisible()) {
                await closeBtn.click();
              } else {
                await hamburger.click();
              }
              await page.waitForTimeout(300);
            }
          } catch (e) {
            drawerTest = { opened: false, error: e.message };
          }
        }

        const auditItem = {
          breakpoint: bp.name,
          dimensions: `${bp.width}x${bp.height}`,
          deviceType: bp.deviceType,
          route: route.path,
          routeName: route.name,
          hasOverflow: overflowDetails.hasOverflow,
          scrollWidth: overflowDetails.scrollWidth,
          winWidth: overflowDetails.winWidth,
          offendingElements: overflowDetails.offendingElements,
          screenshot: screenshotFile,
          consoleErrorsCount: consoleErrors.length,
          pageErrorsCount: pageErrors.length,
          drawerTest
        };

        results.push(auditItem);

        const statusIcon = overflowDetails.hasOverflow ? '❌ OVERFLOW' : '✅ OK';
        console.log(`[${bp.name}] ${route.path.padEnd(16)} -> ${statusIcon} (scroll: ${overflowDetails.scrollWidth}px / win: ${overflowDetails.winWidth}px)`);
        if (overflowDetails.hasOverflow) {
          console.log(`   Offenders:`, JSON.stringify(overflowDetails.offendingElements, null, 2));
        }

      } catch (err) {
        console.error(`[${bp.name}] Failed loading ${route.path}:`, err.message);
        results.push({
          breakpoint: bp.name,
          route: route.path,
          error: err.message
        });
      }
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.join(SCREENSHOT_DIR, 'qa_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit Complete! Report saved to ${reportPath}`);
}

runQA().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
