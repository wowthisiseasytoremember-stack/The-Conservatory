import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  listingType: 'flowgrow';
}

const BASE_URL = 'https://www.flowgrow.de';
const DB_URL = 'https://www.flowgrow.de/db/aquaticplants';
const FG_OUTPUT = path.join(__dirname, '../src/data/flowgrow_data.json');
const AQ_OUTPUT = path.join(__dirname, '../src/data/plant_library.json');
const ENRICHED_OUTPUT = path.join(__dirname, '../src/data/plant_library_enriched.json');
const DELAY_MS = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUrl(url: string, postData?: URLSearchParams): Promise<string | null> {
  try {
    if (postData) {
      const { data } = await axios.post(url, postData.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 20000
      });
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 20000
    });
    return data;
  } catch (e: any) {
    console.error(`Error fetching ${url}:`, e.message);
    return null;
  }
}

async function getPlantUrls(): Promise<string[]> {
  const urls: Set<string> = new Set();

  console.log("Crawling plant URLs...");

  for (let page = 1; page <= 23; page++) {
    const postData = new URLSearchParams();
    postData.append('entityTypeId', '1');
    postData.append('page', page.toString());
    postData.append('displayMode', 'list');
    postData.append('searchCharacter', '');

    console.log(`  Posting to page ${page}...`);
    const html = await fetchUrl(`https://www.flowgrow.de/db/ajax/search`, postData);
    if (!html) break;

    const responseJson = JSON.parse(html);
    const searchResultsHtml = responseJson.searchResults;
    const $ = cheerio.load(searchResultsHtml);
    const plantLinks = $('a.s360__listingproduct--wrapper');

    plantLinks.each((_, el) => {
      const href = $(el).attr('href');
      if (href) urls.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
    });
  }

  console.log(`Found ${urls.size} unique plant URLs.`);
  return Array.from(urls);
}

async function scrapePlantDetails(url: string): Promise<PlantData | null> {
  const html = await fetchUrl(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  const name = $('h1').first().text().trim();
  const scientificName = $('.scientific-name').text().trim() || name;

  const description = $('.s360__product--tab--content.tab-pane.fade.active p').first().text().trim()
    || $('#description-1 p').text().trim();

  const general = '';

  const traits: Record<string, string> = {};
  $('#view-group-culture table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      const key = $(cells[0]).text().trim().replace(/:$/, '');
      const val = $(cells[1]).text().trim().replace(/&thinsp;/g, ' ');
      if (key && val && key.length < 60) traits[key] = val;
    }
  });

  const seenDivKeys = new Set<string>();
  $('#view-group-culture div').each((_, div) => {
    const html = $(div).html() || '';
    const strongMatch = html.match(/<strong>([^<]+)<\/strong>\s*(?:&nbsp;)?\s*([^<\n]+)/);
    if (strongMatch) {
      const key = strongMatch[1].trim().replace(/:$/, '');
      const val = strongMatch[2].trim();
      if (key && val && key.length < 60 && key !== val && !seenDivKeys.has(key)) {
        seenDivKeys.add(key);
        traits[key] = val;
      }
    }
  });

  if (url.includes('epiphyte')) traits['placement'] = 'epiphyte';
  else if (url.includes('foreground') || url.includes('ground-cover')) traits['placement'] = 'foreground';
  else if (url.includes('middleground')) traits['placement'] = 'midground';
  else if (url.includes('background')) traits['placement'] = 'background';
  else if (url.includes('floating')) traits['placement'] = 'floating';
  else if (url.includes('mosses')) traits['placement'] = 'epiphyte';

  const images: string[] = [];
  $('.s360-product--image-main img, .product-detail-image img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.push(src.startsWith('http') ? src : `https://www.flowgrow.de${src}`);
  });

  return {
    id: url.split('/').pop() || 'unknown',
    name,
    scientificName,
    url,
    images,
    details: { description, notes: '', maintenance: general },
    traits,
    listingType: 'flowgrow'
  };
}

async function main() {
  const urls = await getPlantUrls();
  if (urls.length === 0) {
    console.log('No plants found. Check selectors.');
    return;
  }

  const library: PlantData[] = [];
  console.log(`Scraping ${urls.length} plants...`);

  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}] ${urls[i].split('/').pop()}...`);
    const data = await scrapePlantDetails(urls[i]);
    if (data) library.push(data);
    await delay(DELAY_MS);
  }

  fs.mkdirSync(path.dirname(FG_OUTPUT), { recursive: true });
  fs.writeFileSync(FG_OUTPUT, JSON.stringify(library, null, 2));
  console.log(`Saved ${library.length} plants to ${FG_OUTPUT}`);
}

main().catch(console.error);
