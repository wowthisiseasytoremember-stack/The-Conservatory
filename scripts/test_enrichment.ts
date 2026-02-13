
import { enrichmentService } from '../services/enrichmentService';

async function main() {
    console.log("Testing Enrichment Service with Local Data...");

    // Test 1: Exact Match (from JSON)
    const query1 = "Anubias barteri var. nana 'Pangolino Green Tea'";
    console.log(`\nSearching for: "${query1}"`);
    const result1 = await enrichmentService.scrapeAquasabi(query1);
    
    if (result1) {
        console.log("SUCCESS: Found match!");
        console.log("Details:", result1.details?.description?.substring(0, 50) + "...");
    } else {
        console.error("FAILURE: No match found.");
    }

    // Test 2: Fuzzy Match
    const query2 = "Pangolino Green Tea";
    console.log(`\nSearching for: "${query2}"`);
    const result2 = await enrichmentService.scrapeAquasabi(query2);

    if (result2) {
        console.log("SUCCESS: Found match for fuzzy query!");
    } else {
        console.error("FAILURE: No match found for fuzzy query.");
    }
}

main();
