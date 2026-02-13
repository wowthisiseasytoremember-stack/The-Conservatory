
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

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
    maintainance?: string;
  };
  traits: Record<string, string>;
  listingType: 'aquasabi' | 'flowgrow';
}

const BASE_URL = 'https://www.flowgrow.de';
const DB_URL = 'https://www.flowgrow.de/db/aquaticplants';
const OUTPUT_FILE = path.join(__dirname, '../src/data/plant_library.json');
const DELAY_MS = 1000; // Be polite

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUrl(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return data;
  } catch (e) {
    console.error(`Error fetching ${url}:`, e.message);
    return null;
  }
}

async function getPlantUrls(): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  let hasMore = true;

  console.log("Starting Crawl of Plant URLs...");

  while (hasMore) {
    const listUrl = `${DB_URL}?page=${page}`;
    console.log(`Scanning page ${page}...`);
    const html = await fetchUrl(listUrl);
    
    if (!html) break;
    
    const $ = cheerio.load(html);
    const plantLinks = $('.s360__listingproduct--wrapper a.s360-product--link');
    
    if (plantLinks.length === 0) {
      hasMore = false;
    } else {
      plantLinks.each((_, el) => {
        const href = $(el).attr('href');
        if (href) urls.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
      });
      page++;
      await delay(DELAY_MS);
    }
    
    // Safety break for testing (remove for full run)
    if (page > 3) break; 
  }

  console.log(`Found ${urls.length} plants.`);
  return [...new Set(urls)];
}

async function scrapePlantDetails(url: string): Promise<PlantData | null> {
  const html = await fetchUrl(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  
  // 1. Basic Info
  const name = $('h1').first().text().trim();
  const scientificName = $('.scientific-name').text().trim() || name;
  
  // 2. Rich Text
  // Aquasabi / Flowgrow specific selectors
  const description = $('#description-1 p').text().trim() || $('#flowgrow p').first().text().trim();
  const notes = $('#flowgrow p').text().trim();
  const general = $('#general p').text().trim();

  // 3. Traits
  const traits: Record<string, string> = {};
  
  // Flowgrow "Steckbrief"
  $('#view-group-culture tr, #large-flowgrow-table tr, #small-flowgrow-table tr').each((_, el) => {
    const key = $(el).find('th, td.bold').text().trim();
    const val = $(el).find('td:not(.bold)').text().trim();
    if (key && val) traits[key] = val;
  });

  $('#view-group-general .row').each((_, el) => {
    const key = $(el).find('.label').text().trim();
    const val = $(el).find('.value').text().trim();
    if (key && val) traits[key] = val;
  });

  // 4. Icons / Heuristics
  if ($('img[src*="foreground"]').length) traits['placement'] = 'foreground';
  if ($('img[src*="middleground"]').length) traits['placement'] = 'midground';
  if ($('img[src*="background"]').length) traits['placement'] = 'background';

  // 5. Images
  const images: string[] = [];
  $('.s360-product--image-main img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) images.push(src);
  });

  return {
    id: url.split('/').pop() || 'unknown',
    name,
    scientificName,
    url,
    images,
    details: {
      description,
      notes,
      maintainance: general
    },
    traits,
    listingType: url.includes('aquasabi') ? 'aquasabi' : 'flowgrow'
  };
}

async function main() {
  // Step 1: Get Links
  const urls = await getPlantUrls();
  
  // Step 2: Scrape Each
  const library: PlantData[] = [];
  console.log(`Starting scrape of ${urls.length} plants...`);

  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i+1}/${urls.length}] Scraping ${urls[i]}...`);
    const data = await scrapePlantDetails(urls[i]);
    if (data) library.push(data);
    await delay(DELAY_MS);
  }

  // Step 3: Save
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(library, null, 2));
  console.log(`Saved ${library.length} plants to ${OUTPUT_FILE}`);
}

main().catch(console.error);
