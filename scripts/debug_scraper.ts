
import { chromium } from 'playwright';

async function main() {
    console.log("Starting Debug Scraper...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a realistic User Agent to avoid simple bot detection
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const url = 'https://www.aquasabi.com/aquatic-plants-epiphytes';
    console.log(`Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Take screenshot to see what's happening
    await page.screenshot({ path: 'debug_page_view.png', fullPage: true });
    console.log("Screenshot saved to debug_page_view.png");

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Check selectors
    const wrappers = await page.$$('.product-wrapper');
    console.log(`Found ${wrappers.length} elements with class .product-wrapper`);

    if (wrappers.length > 0) {
        console.log("First 5 items found:");
        for (let i = 0; i < Math.min(5, wrappers.length); i++) {
            const text = await wrappers[i].innerText();
            const cleanText = text.split('\n')[0]; // Just first line
            console.log(`  [${i+1}] ${cleanText}`);
        }
    }

    await browser.close();
}

main().catch(console.error);
