import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Testing scraper fix...");
  const browser = await chromium.launch({ 
    headless: true, 
    channel: 'chrome' 
  });
  const page = await browser.newPage();

  const url = 'https://www.aquasabi.com/Acmella-repens';
  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const scrapeLogic = fs.readFileSync(path.join(__dirname, 'scraper_logic.js'), 'utf8');
  const data = await page.evaluate(({ code, url }) => {
    try {
      const evalResult = eval(code);
      return scrapeProduct(url);
    } catch (e) {
      return { error: e.toString() };
    }
  }, { code: scrapeLogic, url });

  if ((data as any).error) {
    console.error("ERROR:", (data as any).error);
  } else {
    const d = data as any;
    console.log("\n=== NAME ===");
    console.log(d.name);

    console.log("\n=== PROFILE ICONS (NEW) ===");
    const iconKeys = ['Difficulty', 'Growth', 'Light', 'CO2', 'Water hardness maximum', 'Recommended care height', 'Discus suitable'];
    iconKeys.forEach(k => {
      if (d.traits[k]) console.log(`  ${k}: ${d.traits[k]}`);
    });

    console.log("\n=== FLOWGROW TABLE TRAITS ===");
    const specKeys = ['Synonyms', 'Complete botanical name', 'Family', 'Genus', 'Difficulty', 'Usage', 'Width', 'Growth', 'Temperature tolerance', 'General hardness'];
    specKeys.forEach(k => {
      if (d.traits[k]) console.log(`  ${k}: ${d.traits[k]}`);
    });

    // Check for key=key artifacts
    const artifacts = Object.entries(d.traits).filter(([k, v]) => k === v);
    if (artifacts.length > 0) {
      console.log("\n⚠️  KEY=VALUE ARTIFACTS FOUND:", artifacts.map(([k]) => k));
    } else {
      console.log("\n✅ No key=value artifacts");
    }

    // Check for 0,00 € artifacts
    const priceArtifacts = Object.entries(d.traits).filter(([_, v]) => (v as string).includes('€'));
    if (priceArtifacts.length > 0) {
      console.log("\n⚠️  PRICE ARTIFACTS FOUND:", priceArtifacts.map(([k]) => k));
    } else {
      console.log("\n✅ No price artifacts from cart table");
    }
  }

  await browser.close();
}

main().catch(console.error);
