import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "Mobile (390x844)", width: 390, height: 844, category: "mobile" },
  { name: "Tablet Portrait (768x1024)", width: 768, height: 1024, category: "tablet" },
  { name: "Tablet Landscape (1024x768)", width: 1024, height: 768, category: "tablet-landscape" },
  { name: "Desktop (1440x900)", width: 1440, height: 900, category: "desktop" }
];

const STATIC_ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/tours", name: "Tours Catalog" },
  { path: "/destinations", name: "Destinations Catalog" },
  { path: "/deals", name: "Deals" },
  { path: "/blogs", name: "Blogs Listing" },
  { path: "/about", name: "About Us" },
  { path: "/contact", name: "Contact Us" },
  { path: "/help", name: "Help Center" },
  { path: "/help-centre", name: "Help Centre Alt" },
  { path: "/travel-advice", name: "Travel Advice" },
  { path: "/external-day-trips", name: "External Day Trips" },
  { path: "/wishlist", name: "Wishlist" },
  { path: "/compare", name: "Compare" },
  { path: "/cart", name: "Cart" },
  { path: "/cancellation-policy", name: "Cancellation Policy" },
  { path: "/privacy-policy", name: "Privacy Policy" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/cookie-policy", name: "Cookie Policy" },
  { path: "/accessibility", name: "Accessibility" },
  { path: "/login", name: "Traveller Login" },
  { path: "/register", name: "Traveller Register" },
  { path: "/agent-portal", name: "Agent Portal Landing" },
  { path: "/supplier-portal", name: "Supplier Portal Landing" },
  { path: "/affiliate-portal", name: "Affiliate Portal Landing" },
  { path: "/partner-terms", name: "Partner Terms" },
  { path: "/partner-privacy", name: "Partner Privacy" },
  { path: "/supplier-terms", name: "Supplier Terms" },
  { path: "/supplier-privacy", name: "Supplier Privacy" },
  { path: "/agent-contact", name: "Agent Contact" },
  { path: "/supplier-contact", name: "Supplier Contact" }
];

async function runAudit() {
  console.log(`Starting Public Pages Responsive & Typography Audit on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Find dynamic routes first
  const routesToTest = [...STATIC_ROUTES];
  try {
    console.log("Discovering dynamic links from /tours and /destinations and /blogs...");
    await page.goto(`${BASE_URL}/tours`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    const tourLinks = await page.$$eval("a[href^='/tours/']", links => 
      [...new Set(links.map(a => a.getAttribute("href")).filter(h => h && h !== "/tours"))]
    );
    if (tourLinks.length > 0) {
      console.log(`Discovered tour link: ${tourLinks[0]}`);
      routesToTest.push({ path: tourLinks[0], name: `Tour Detail (${tourLinks[0]})` });
    }

    await page.goto(`${BASE_URL}/destinations`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    const destLinks = await page.$$eval("a[href^='/destinations/']", links => 
      [...new Set(links.map(a => a.getAttribute("href")).filter(h => h && h !== "/destinations"))]
    );
    if (destLinks.length > 0) {
      console.log(`Discovered destination link: ${destLinks[0]}`);
      routesToTest.push({ path: destLinks[0], name: `Destination Detail (${destLinks[0]})` });
    }

    await page.goto(`${BASE_URL}/blogs`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    const blogLinks = await page.$$eval("a[href^='/blogs/']", links => 
      [...new Set(links.map(a => a.getAttribute("href")).filter(h => h && h !== "/blogs"))]
    );
    if (blogLinks.length > 0) {
      console.log(`Discovered blog link: ${blogLinks[0]}`);
      routesToTest.push({ path: blogLinks[0], name: `Blog Detail (${blogLinks[0]})` });
    }
  } catch (err) {
    console.warn("Dynamic link discovery warning:", err.message);
  }

  const results = [];

  for (const route of routesToTest) {
    console.log(`\n======================================================`);
    console.log(`Auditing: ${route.name} (${route.path})`);
    console.log(`======================================================`);

    const routeResult = {
      name: route.name,
      path: route.path,
      viewports: {}
    };

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(600);

        // Close cookie banner if present to avoid false overlay issues
        try {
          const cookieBtn = await page.$("button:has-text('Accept'), button:has-text('accept')");
          if (cookieBtn && await cookieBtn.isVisible()) {
            await cookieBtn.click();
            await page.waitForTimeout(200);
          }
        } catch (_) {}

        // Evaluate layout, typography, cards
        const auditData = await page.evaluate(({ vpWidth, vpHeight, vpCategory }) => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const hasHorizontalOverflow = scrollWidth > (vpWidth + 2); // allow small subpixel margin

          // Find overflowing elements
          const overflowingElements = [];
          if (hasHorizontalOverflow) {
            const allElements = document.querySelectorAll("header, nav, main, footer, section, div, h1, h2, h3, p, table, ul, img");
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > vpWidth + 5 && rect.width > 0 && rect.height > 0) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || undefined,
                  className: (el.className && typeof el.className === "string") ? el.className.split(" ").slice(0, 4).join(" ") : "",
                  rectRight: Math.round(rect.right),
                  rectWidth: Math.round(rect.width),
                  textSnippet: (el.innerText || "").substring(0, 40).replace(/\n/g, " ")
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          // Inspect Titles (h1, h2, h3, h4)
          const headings = [];
          const headingNodes = document.querySelectorAll("h1, h2, h3, h4");
          headingNodes.forEach((node, idx) => {
            const rect = node.getBoundingClientRect();
            // only check visible or in-document headings
            const style = window.getComputedStyle(node);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.2);
            const text = (node.innerText || "").trim().replace(/\s+/g, " ");
            
            if (text && rect.width > 0 && rect.height > 0) {
              const issues = [];
              if (vpCategory === "mobile") {
                if (fontSize > 40) issues.push(`Very large font size for mobile (${Math.round(fontSize)}px) - may cause awkward wrapping`);
                if (fontSize < 18 && (node.tagName === "H1" || node.tagName === "H2")) issues.push(`Small heading size for ${node.tagName} (${Math.round(fontSize)}px)`);
              }
              if (vpCategory === "desktop") {
                if (fontSize < 20 && node.tagName === "H1") issues.push(`H1 font size (${Math.round(fontSize)}px) might be too small on desktop`);
              }
              if (lineHeight < fontSize * 1.05) {
                issues.push(`Tight line-height (${Math.round(lineHeight)}px vs font ${Math.round(fontSize)}px)`);
              }
              if (rect.right > vpWidth + 2) {
                issues.push(`Heading overflows screen horizontally (right: ${Math.round(rect.right)}px > ${vpWidth}px)`);
              }

              headings.push({
                tag: node.tagName.toLowerCase(),
                text: text.substring(0, 60),
                fontSize: Math.round(fontSize),
                lineHeight: Math.round(lineHeight),
                width: Math.round(rect.width),
                issues
              });
            }
          });

          // Inspect Paragraphs & Body text
          const paragraphs = [];
          const pNodes = document.querySelectorAll("main p, section p, .prose p, footer p");
          let tinyParagraphCount = 0;
          let hugeParagraphCount = 0;
          const pFontSizes = [];

          pNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const style = window.getComputedStyle(node);
              const fontSize = parseFloat(style.fontSize);
              const text = (node.innerText || "").trim();
              if (text.length > 5) {
                pFontSizes.push(fontSize);
                if (fontSize < 12) tinyParagraphCount++;
                if (fontSize > 22 && vpCategory === "mobile") hugeParagraphCount++;
                
                // Sample up to 5 representative paragraphs
                if (paragraphs.length < 5) {
                  paragraphs.push({
                    textSnippet: text.substring(0, 50),
                    fontSize: Math.round(fontSize),
                    lineHeight: Math.round(parseFloat(style.lineHeight) || (fontSize * 1.5)),
                    rectWidth: Math.round(rect.width)
                  });
                }
              }
            }
          });

          const avgPFontSize = pFontSizes.length > 0 ? (pFontSizes.reduce((a, b) => a + b, 0) / pFontSizes.length).toFixed(1) : "N/A";
          const minPFontSize = pFontSizes.length > 0 ? Math.min(...pFontSizes) : "N/A";
          const maxPFontSize = pFontSizes.length > 0 ? Math.max(...pFontSizes) : "N/A";

          // Inspect Cards & Grid items
          // Selectors covering TourCard, DestinationCard, DealCard, BlogCard, etc.
          const cardSelectors = [
            "article",
            "[data-testid*='card']",
            "div.group.relative.rounded-2xl",
            "div.group.relative.rounded-xl",
            "div.bg-white.rounded-2xl",
            "div.bg-white.rounded-xl.shadow",
            "div.bg-white.rounded-2xl.shadow",
            "div.border.rounded-2xl",
            "div.border.rounded-xl"
          ];
          const cardsFound = [];
          const cardNodes = document.querySelectorAll(cardSelectors.join(", "));
          
          cardNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            // Filter out non-card full containers
            if (rect.width > 80 && rect.width < vpWidth * 1.1 && rect.height > 120) {
              const style = window.getComputedStyle(node);
              const issues = [];
              if (rect.width < 180 && vpCategory !== "mobile") {
                issues.push(`Card width very narrow (${Math.round(rect.width)}px)`);
              }
              if (rect.right > vpWidth + 2) {
                issues.push(`Card extends outside viewport (${Math.round(rect.right)}px > ${vpWidth}px)`);
              }

              // Check if card has image
              const img = node.querySelector("img");
              const imgRect = img ? img.getBoundingClientRect() : null;

              cardsFound.push({
                tag: node.tagName.toLowerCase(),
                className: (node.className && typeof node.className === "string") ? node.className.split(" ").slice(0, 3).join(" ") : "",
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                imgHeight: imgRect ? Math.round(imgRect.height) : undefined,
                issues
              });
            }
          });

          // Check Grid structures
          const grids = [];
          const gridNodes = document.querySelectorAll("div.grid, section div.grid");
          gridNodes.forEach((grid) => {
            const rect = grid.getBoundingClientRect();
            if (rect.width > 200 && rect.height > 100) {
              const style = window.getComputedStyle(grid);
              const templateColumns = style.gridTemplateColumns;
              const colCount = templateColumns ? templateColumns.split(" ").length : 1;
              grids.push({
                columns: colCount,
                templateColumns: templateColumns.length > 50 ? `${colCount} cols` : templateColumns,
                width: Math.round(rect.width),
                issues: (vpCategory === "mobile" && colCount > 2) ? [`${colCount} columns on mobile may cause extreme crowding`] : []
              });
            }
          });

          return {
            scrollWidth,
            vpWidth,
            hasHorizontalOverflow,
            overflowingElements,
            headingsCount: headingNodes.length,
            headingsSample: headings.slice(0, 8),
            headingIssues: headings.filter(h => h.issues.length > 0),
            pStats: {
              totalP: pNodes.length,
              avgFontSize: avgPFontSize,
              minFontSize: minPFontSize,
              maxFontSize: maxPFontSize,
              tinyCount: tinyParagraphCount,
              hugeCount: hugeParagraphCount,
              sample: paragraphs
            },
            cardsCount: cardsFound.length,
            cardsSample: cardsFound.slice(0, 6),
            cardIssues: cardsFound.filter(c => c.issues.length > 0),
            gridsSample: grids.slice(0, 4)
          };
        }, { vpWidth: vp.width, vpHeight: vp.height, vpCategory: vp.category });

        routeResult.viewports[vp.name] = auditData;

        // Print quick console summary
        const statusIcon = !auditData.hasHorizontalOverflow && auditData.headingIssues.length === 0 && auditData.cardIssues.length === 0 ? "✅" : "⚠️";
        console.log(`  [${vp.name}] ${statusIcon} Overflow: ${auditData.hasHorizontalOverflow ? "YES (" + auditData.scrollWidth + "px > " + vp.width + "px)" : "NO"} | Headings: ${auditData.headingsCount} (issues: ${auditData.headingIssues.length}) | Paragraph avg: ${auditData.pStats.avgFontSize}px (tiny: ${auditData.pStats.tinyCount}) | Cards: ${auditData.cardsCount}`);

        if (auditData.hasHorizontalOverflow && auditData.overflowingElements.length > 0) {
          console.log(`    ⚠️ Overflow elements:`, auditData.overflowingElements.map(e => `${e.tag}.${e.className} (right=${e.rectRight}px)`).join(", "));
        }
        if (auditData.headingIssues.length > 0) {
          console.log(`    ⚠️ Heading issues:`, auditData.headingIssues.map(h => `${h.tag} "${h.text.substring(0, 25)}...": ${h.issues.join("; ")}`).join(" | "));
        }
        if (auditData.cardIssues.length > 0) {
          console.log(`    ⚠️ Card issues:`, auditData.cardIssues.map(c => `${c.className}: ${c.issues.join("; ")}`).join(" | "));
        }

      } catch (pageErr) {
        console.error(`  [${vp.name}] Failed to audit: ${pageErr.message}`);
        routeResult.viewports[vp.name] = { error: pageErr.message };
      }
    }

    results.push(routeResult);
  }

  await browser.close();

  // Save full JSON report
  const outputPath = path.resolve("./audit-responsive-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\nAudit finished! Detailed results saved to: ${outputPath}`);
}

runAudit().catch(err => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
