
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { Type } from '@google/genai';

// --- Copied from services/plantService.ts ---
export interface PlantData {
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
  listingType: 'aquasabi';
}

// --- Copied from services/geminiService.ts ---
const withTimeout = <T>(promise: Promise<T>, ms: number = 45000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`AI Timed out after ${ms}ms`)), ms))
  ]);
};

async function callProxy(config: {
  model: string;
  contents: any;
  systemInstruction?: string;
  generationConfig?: any;
}) {
  const apiKey = "AIzaSyAO_E6wI_YhrD60b4Y0Y9zobg4FcXnN9L8";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: config.contents }] }],
    systemInstruction: config.systemInstruction ? { parts: [{ text: config.systemInstruction }] } : undefined,
    generationConfig: config.generationConfig,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'AI API Error');
  }
  
  const data = await res.json();
  return data.candidates[0].content.parts[0];
}

async function generateContent(prompt: string, schema?: any): Promise<any> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }));
    return JSON.parse(response.text || '{}');
  }

// --- Main logic from scripts/preprocess_plant_data.ts ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EnrichedDataSchema = z.object({
  delightfulSummary: z.string(),
  aweInspiringFacts: z.array(z.object({
    fact: z.string(),
    source: z.string(),
  })),
});

const ENRICHED_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    delightfulSummary: { type: Type.STRING },
    aweInspiringFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fact: { type: Type.STRING },
          source: { type: Type.STRING },
        },
        required: ["fact", "source"],
      },
    },
  },
  required: ["delightfulSummary", "aweInspiringFacts"],
};

interface EnrichedPlantData extends PlantData {
  delightfulSummary?: string;
  aweInspiringFacts?: {
    fact: string;
    source: string;
  }[];
}

async function main() {
  console.log("Starting plant data pre-processing...");

  const plantLibraryRaw = await fs.readFile(path.join(__dirname, '../src/data/plant_library.json'), 'utf-8');
  const plantLibrary = JSON.parse(plantLibraryRaw);

  const enrichedPlants: EnrichedPlantData[] = [];
  const plantsToProcess = plantLibrary;

  for (const plant of plantsToProcess) {
    console.log(`Processing ${plant.name}...`);

    const prompt = `
      You are a botanical expert with a passion for storytelling. Your goal is to make plant information delightful, awe-inspiring, and focused on knowledge rather than just dry facts.

      Given the following plant data:
      ${JSON.stringify(plant, null, 2)}

      Please generate the following in JSON format:
      1.  "delightfulSummary": A short, engaging summary (2-3 sentences) that captures the essence of the plant and would make someone excited to learn more about it. Focus on its beauty, unique characteristics, or interesting history.
      2.  "aweInspiringFacts": An array of 2-3 fascinating, little-known facts about the plant. These should be things that would make someone say "wow!". For each fact, provide a "source" (e.g., "Field Museum, Chicago", "Journal of Experimental Botany", or the name of the book or website where the fact can be found).
    `;

    try {
      const result = await generateContent(prompt, ENRICHED_DATA_SCHEMA);
      const validatedResult = EnrichedDataSchema.parse(result);
      
      const enrichedPlant: EnrichedPlantData = {
        ...plant,
        ...validatedResult,
      };
      enrichedPlants.push(enrichedPlant);

    } catch (error) {
      console.error(`Failed to process ${plant.name}:`, error);
      // Add the original plant data even if enrichment fails
      enrichedPlants.push(plant);
    }
  }

  // Add the rest of the plants without enrichment
  const remainingPlants = plantLibrary.slice(5);
  const finalPlantList = [...enrichedPlants, ...remainingPlants];

  const outputPath = path.join(__dirname, '../src/data/plant_library_enriched.json');
  await fs.writeFile(outputPath, JSON.stringify(finalPlantList, null, 2));

  console.log(`Successfully pre-processed ${plantsToProcess.length} plants.`);
  console.log(`Enriched data written to ${outputPath}`);
}

main().catch(console.error);
