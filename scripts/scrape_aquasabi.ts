
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
  '/aquatic-plants-rare-plants'
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
          let pageNum = 1;
          let hasNextPage = true;
    
          while (hasNextPage) {
            const catUrl = `${BASE_URL}${cat}?p=${pageNum}`;
            console.log(`Navigating to ${cat} (Page ${pageNum})...`);
            
            try {
                await page.goto(catUrl, { waitUntil: 'domcontentloaded' });
                
                // Wait briefly for content
                try {
                    // Verified selector
                    await page.waitForSelector('.product-wrapper', { timeout: 30000 });
                } catch (e) {
                    console.log(`No products found for ${cat} page ${pageNum}. Stopping category.`);
                    hasNextPage = false;
                    continue;
                }
    
                // Extract links
                const hrefs = await page.$$eval('.product-wrapper .productbox-image a', (links) => 
                    links.map(l => l.getAttribute('href'))
                );
    
                if (hrefs.length === 0) {
                    hasNextPage = false;
                } else {
                    hrefs.forEach(href => {
                        if (href) productUrls.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
                    });
                    console.log(`  Found ${hrefs.length} products on page ${pageNum}.`);
                    pageNum++;
                }
                
                // Safety break (User mentioned ~26 pages, so 50 is safe)
                if (pageNum > 50) hasNextPage = false;
    
            } catch (e) {
                console.error(`Failed to crawl category ${cat} page ${pageNum}:`, e.message);
                hasNextPage = false;
            }
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
