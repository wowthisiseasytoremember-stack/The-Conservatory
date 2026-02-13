
import { chromium } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.aquasabi.com/aquatic-plants-epiphytes?p=1';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  console.log(`Page Title: ${await page.title()}`);
  
  try {
      await page.waitForSelector('.product-wrapper', { timeout: 10000 });
      console.log("Found .product-wrapper!");
      const count = await page.$$eval('.product-wrapper', els => els.length);
      console.log(`Product count: ${count}`);
      const firstHtml = await page.$eval('.product-wrapper', el => el.innerHTML.substring(0, 500));
      console.log('First product Inner HTML:', firstHtml);
      
      const linkCount = await page.$$eval('.product-wrapper .productbox-image a', els => els.length);
      console.log(`Links with .productbox-image a: ${linkCount}`);
      
      const linkCount2 = await page.$$eval('.product-wrapper a', els => els.length);
      console.log(`Links with just a: ${linkCount2}`);
  } catch (e) {
      console.error("Failed to find .product-box");
      const bodyText = await page.innerText('body');
      console.log('Body Text Start:', bodyText.substring(0, 500));
      await page.screenshot({ path: path.join(__dirname, 'test_fail.png') });
  }
  console.log(`Content Length: ${(await page.content()).length}`);
  
  const screenshotPath = path.join(__dirname, 'test_screenshot.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);
  
  await browser.close();
}

main().catch(console.error);
