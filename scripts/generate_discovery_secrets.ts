/**
 * generate_discovery_secrets.ts
 * 
 * Pre-generates "Discovery Secrets" (mechanism, evolutionary advantage, synergy)
 * for all plants in the local library using the Gemini AI.
 * 
 * Usage: npx ts-node scripts/generate_discovery_secrets.ts [--limit N] [--resume]
 * 
 * --limit N   Process only N plants (useful for testing)
 * --resume    Skip plants that already have discovery data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load env vars
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIBRARY_PATH = path.join(__dirname, '../src/data/plant_library.json');
const OUTPUT_PATH = LIBRARY_PATH; // Enrich in-place

interface PlantEntry {
  id: string;
  name: string;
  scientificName?: string;
  url: string;
  images: string[];
  details: {
    description?: string;
    notes?: string;
    maintenance?: string;
    narrativeHtml?: string;
    distributionMap?: string;
  };
  traits: Record<string, string>;
  discovery?: {
    mechanism: string;
    evolutionaryAdvantage: string;
    synergyNote: string;
  };
  listingType: string;
}

const DISCOVERY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mechanism: { type: Type.STRING, description: "The scientific explanation of the primary trait/adaptation" },
    evolutionaryAdvantage: { type: Type.STRING, description: "Why this trait exists in the wild" },
    synergyNote: { type: Type.STRING, description: "How this species interacts with others in a captive ecosystem" }
  },
  required: ["mechanism", "evolutionaryAdvantage", "synergyNote"]
};

async function generateDiscovery(ai: GoogleGenAI, plant: PlantEntry): Promise<PlantEntry['discovery'] | null> {
  const searchName = plant.scientificName || plant.name;
  const context = plant.details.description 
    ? `Context: ${plant.details.description.substring(0, 300)}` 
    : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Identify the biological mechanism or ethological secret of: ${searchName}. ${context}`,
      config: {
        systemInstruction: `
          You are the Chief Biologist of The Conservatory.
          Reveal the "How" and "Why" behind biological traits of aquatic plants.
          Focus on:
          1. Scientific Mechanisms: How photosynthesis, nutrient uptake, or growth patterns work.
          2. Evolutionary Advantage: Why did this trait evolve? Where does this species originate?
          3. Synergy: How does this species benefit others in a captive aquatic ecosystem?
          Be rigorous, fascinating, and scientific. Keep each response to 2-3 sentences max.
        `,
        responseMimeType: "application/json",
        responseSchema: DISCOVERY_SCHEMA as any,
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    if (data.mechanism && data.evolutionaryAdvantage && data.synergyNote) {
      return data;
    }
    return null;
  } catch (e: any) {
    console.warn(`  Failed for ${searchName}: ${e.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;
  const resume = args.includes('--resume');

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is required.");
    console.error("Usage: GEMINI_API_KEY=your_key npx ts-node scripts/generate_discovery_secrets.ts");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log("Loading plant library...");
  const library: PlantEntry[] = JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
  console.log(`Loaded ${library.length} plants.`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < library.length && processed < limit; i++) {
    const plant = library[i];

    // Skip if already has discovery and resume mode is on
    if (resume && plant.discovery?.mechanism) {
      skipped++;
      continue;
    }

    const progress = Math.round(((i + 1) / library.length) * 100);
    console.log(`[${i + 1}/${library.length}] ${progress}% - Generating discovery for: ${plant.name}`);

    const discovery = await generateDiscovery(ai, plant);
    
    if (discovery) {
      library[i].discovery = discovery;
      processed++;
      console.log(`  ✓ ${plant.name}: ${discovery.mechanism.substring(0, 80)}...`);
    } else {
      failed++;
      console.log(`  ✗ No discovery generated for ${plant.name}`);
    }

    // Rate limit: ~15 requests/min for flash-lite
    await new Promise(r => setTimeout(r, 4000));

    // Periodic save every 10 plants
    if (processed % 10 === 0 && processed > 0) {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(library, null, 2));
      console.log(`  [Saved progress: ${processed} enriched]`);
    }
  }

  // Final save
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(library, null, 2));
  
  console.log("\n--- Generation Complete ---");
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (already had discovery): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total in library: ${library.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch(console.error);
