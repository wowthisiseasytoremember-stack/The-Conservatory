
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.aquasabi.com/aquatic-plants-epiphytes';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  // Find element with text "Hygrophila pinnatifida"
  const structure = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    let targetNode = null;
    while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes('Hygrophila pinnatifida')) {
            targetNode = node.parentElement;
            break;
        }
    }
    
    if (!targetNode) return "Text not found";
    
    const chain = [];
    let curr = targetNode;
    while (curr && curr !== document.body) {
        chain.push(`${curr.tagName.toLowerCase()}${curr.id ? '#' + curr.id : ''}${curr.className ? '.' + curr.className.split(' ').join('.') : ''}`);
        curr = curr.parentElement;
    }
    return chain.join(' > ');
  });

  console.log("Structure Chain:", structure);
  
  // Also dump all classes used in the main area
  const mainClasses = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const classes = new Set();
      main.querySelectorAll('*').forEach(el => el.classList.forEach(c => classes.add(c)));
      return [...classes].filter(c => c.includes('product'));
  });
  console.log("Product-related classes found:", mainClasses);

  await browser.close();
}

main().catch(console.error);
