
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for our scraped data
interface PlantData {
  id: string;
  name: string;
  scientificName?: string;
  url: string;
  images: string[];
  details: {
    description?: string;
    notes?: string;
    maintenance?: string;
  };
  traits: Record<string, string>;
  listingType: 'aquasabi';
}

const BASE_URL = 'https://www.aquasabi.com';
const OUTPUT_FILE = path.join(__dirname, '../src/data/plant_library.json');

// Subcategories
const CATEGORIES = [
  '/aquatic-plants-epiphytes',
  '/aquatic-plants-ground-cover',
  '/aquatic-plants-foreground',
  '/aquatic-plants-middleground',
  '/aquatic-plants-background',
  '/aquatic-plants-mosses',
  '/aquatic-plants-floating-plants',
  '/aquatic-plants-rare-plants',
  '/aquatic-plants' // Catch-all for any missed plants
];

async function main() {
  console.log("Script starting...");
  const browser = await chromium.launch({ headless: true }); // Headless by default
  const page = await browser.newPage();

  // --- Step 1: Collect URLs ---
  let sortedUrls: string[] = [];
  const URL_CACHE_FILE = path.join(__dirname, 'plant_urls_cache.json');

  if (fs.existsSync(URL_CACHE_FILE)) {
      console.log("Loading URLs from cache...");
      sortedUrls = JSON.parse(fs.readFileSync(URL_CACHE_FILE, 'utf-8'));
  } else {
      const productUrls = new Set<string>();
      
      console.log("Starting Crawl of Aquasabi Categories (Playwright)...");
    
      for (const cat of CATEGORIES) {
          // Navigate once to the category
          const catUrl = `${BASE_URL}${cat}`;
          console.log(`Navigating to ${cat}...`);
          
          try {
              await page.goto(catUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
              
              // Wait for initial products
              await page.waitForSelector('.product-wrapper', { timeout: 30000 });
              
              // 1. Dismiss Cookie Banner (if present)
              try {
                  const cookieBtn = await page.$('.cc-btn.cc-dismiss, .cc-btn.cc-allow, button:has-text("Accept"), button:has-text("Zustimmen")');
                  if (cookieBtn && await cookieBtn.isVisible()) {
                      console.log("  Dismissing cookie banner...");
                      await cookieBtn.click();
                      await new Promise(r => setTimeout(r, 1000));
                  }
              } catch (e) { /* create no noise */ }

              // Try to find total count for progress logging
              let totalItems = 0;
              try {
                  const countText = await page.$eval('.filter-product-count', el => el.textContent);
                  if (countText) {
                      const match = countText.match(/(\d+)/);
                      if (match) totalItems = parseInt(match[1]);
                      console.log(`  Category reports ${totalItems} total items.`);
                  }
              } catch (e) { }

              let moreButtonExists = true;
              while (moreButtonExists) {
                  // Get current count
                  const currentCount = await page.$$eval('.product-wrapper', els => els.length);
                  console.log(`  Currently loaded: ${currentCount} items.`);

                  // Look for "Show more" button
                  // Scroll to bottom first to ensure it handles lazy loading / visibility
                  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                  await new Promise(r => setTimeout(r, 1000));

                  const button = await page.$('text="Show more items"'); 
                  
                  if (button && await button.isVisible()) {
                      console.log("  Clicking 'Show more items'...");
                      
                      // ROBUST CLICK STRATEGY
                      try {
                          // 1. Force scroll
                          await button.scrollIntoViewIfNeeded();
                          
                          // 2. JS Click (Bypasses overlays/viewport checks)
                          await page.evaluate(el => (el as HTMLElement).click(), button);
                          
                      } catch (err) {
                          console.log("  JS Click failed, trying force click...");
                          await button.click({ force: true });
                      }
                      
                      // Wait for new items to load
                      try {
                          await page.waitForFunction((prevCount) => {
                              return document.querySelectorAll('.product-wrapper').length > prevCount;
                          }, currentCount, { timeout: 15000 });
                      } catch (e) {
                          console.warn("  Wait for new items timed out (or no new items).");
                          moreButtonExists = false;
                      }
                      
                      // Small pause for stability
                      await new Promise(r => setTimeout(r, 1500));
                  } else {
                      console.log("  No more 'Show more' button found. Finished loading category.");
                      moreButtonExists = false;
                  }
              }

              // Extract all links
              const hrefs = await page.$$eval('.product-wrapper .productbox-image a', (links) => 
                  links.map(l => l.getAttribute('href'))
              );

              hrefs.forEach(href => {
                  if (href) productUrls.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
              });
              console.log(`  Extracted ${hrefs.length} total unique product URLs from ${cat}.`);

          } catch (e) {
              console.error(`Failed to crawl category ${cat}:`, e.message);
          }
      }
      sortedUrls = [...productUrls].sort();
      fs.writeFileSync(URL_CACHE_FILE, JSON.stringify(sortedUrls, null, 2));
  }

  console.log(`Total Unique Plants: ${sortedUrls.length}`);

  // --- Step 2: Scrape Details ---
  const library: PlantData[] = [];
  
  for (let i = 0; i < sortedUrls.length; i++) {
      const url = sortedUrls[i];
      const progress = Math.round(((i + 1) / sortedUrls.length) * 100);
      console.log(`[${i+1}/${sortedUrls.length}] ${progress}% - Scraping ${url}...`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Read scraper logic from external file to avoid TS/closure issues
        const scrapeLogic = fs.readFileSync(path.join(__dirname, 'scraper_logic.js'), 'utf8');

        // Extract Data
        const data = await page.evaluate(({ code, url }) => {
            // Evaluate the stringified logic (defines function scrapeProduct(url))
            // eslint-disable-next-line
            // @ts-ignore
            try {
                // @ts-ignore
                const evalResult = eval(code);
                // @ts-ignore
                return scrapeProduct(url);
            } catch (e) {
                return { error: e.toString() }; 
            }
        }, { code: scrapeLogic, url });

        if ((data as any).error) {
             console.error(`Error inside browser for ${url}:`, (data as any).error);
             continue;
        }

        // Post-process
        library.push({
            ...data,
            scientificName: (data as any).scientificName || undefined,
            images: [...new Set((data as any).rawImages)],
            listingType: 'aquasabi'
        } as PlantData);
      } catch (e) {
          console.error(`Failed to scrape product ${url}:`, e.message);
      }
      
      // Save periodically
      if (i % 10 === 0) {
        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(library, null, 2));
      }
  }

  // Final Save
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(library, null, 2));
  console.log(`Saved ${library.length} plants to ${OUTPUT_FILE}`);
  
  await browser.close();
}

main().catch(console.error);
