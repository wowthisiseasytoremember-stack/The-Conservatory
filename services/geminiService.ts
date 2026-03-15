import { GoogleGenAI, Type } from "@google/genai";
import { z } from 'zod';
import { Entity, PendingAction, IdentifyResult, AdvisoryReport, RackContainer } from "../types.js";
import { 
  PendingActionSchema, 
  IdentifyResultSchema, 
  RackContainerSchema, 
  AdvisoryReportSchema, 
  IntentStrategySchema, 
  EcosystemNarrativeSchema, 
  BiologicalDiscoverySchema,
  EnrichedDataSchema
} from '../src/schemas.js';
import { plantService } from './plantService.js';
import { logger, logAICall, logCache } from './logger.js';
import { trackCost, calculateCost } from './costTracker.js';
import { LRUCache } from 'lru-cache';

const ENRICHED_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    source: { type: Type.STRING, enum: ['DIRECT_MATCH', 'GENUS_FALLBACK', 'NONE'] },
    taxonomy: {
      type: Type.OBJECT,
      properties: {
        kingdom: { type: Type.STRING },
        phylum: { type: Type.STRING },
        class: { type: Type.STRING },
        order: { type: Type.STRING },
        family: { type: Type.STRING },
        genus: { type: Type.STRING },
        species: { type: Type.STRING }
      }
    },
    tradeInfo: {
      type: Type.OBJECT,
      properties: {
        tradeName: { type: Type.STRING },
        cultivar: { type: Type.STRING },
        morph: { type: Type.STRING }
      }
    },
    distribution: {
      type: Type.OBJECT,
      properties: {
        nativeRange: { type: Type.STRING },
        nativeRangeMapUrl: { type: Type.STRING }
      }
    },
    description: { type: Type.STRING },
    careGuide: { type: Type.STRING },
    imageUrl: { type: Type.STRING },
    inferredFrom: { type: Type.STRING }
  },
  required: ["source"]
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 45000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`AI Timed out after ${ms}ms`)), ms))
  ]);
};

const TRAIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['AQUATIC', 'TERRESTRIAL', 'PHOTOSYNTHETIC', 'INVERTEBRATE', 'VERTEBRATE', 'COLONY'] },
    parameters: {
      type: Type.OBJECT,
      properties: {
        pH: { type: Type.NUMBER },
        temp: { type: Type.NUMBER },
        salinity: { type: Type.STRING },
        humidity: { type: Type.NUMBER },
        substrate: { type: Type.STRING },
        lightReq: { type: Type.STRING },
        co2: { type: Type.BOOLEAN },
        molting: { type: Type.BOOLEAN },
        colony: { type: Type.BOOLEAN },
        diet: { type: Type.STRING },
        estimatedCount: { type: Type.NUMBER },
        stable: { type: Type.BOOLEAN },
        nitrates: { type: Type.NUMBER },
        ammonia: { type: Type.NUMBER }
      }
    }
  },
  required: ["type"]
};

const PENDING_ACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, description: "ACCESSION_ENTITY, LOG_OBSERVATION, MODIFY_HABITAT, or QUERY" },
    targetHabitatName: { type: Type.STRING },
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          commonName: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          traits: { type: Type.ARRAY, items: TRAIT_SCHEMA }
        },
        required: ["commonName", "traits"]
      }
    },
    observationNotes: { type: Type.STRING },
    observationParams: {
      type: Type.OBJECT,
      properties: {
        pH: { type: Type.NUMBER },
        temp: { type: Type.NUMBER },
        ammonia: { type: Type.NUMBER },
        nitrites: { type: Type.NUMBER },
        nitrates: { type: Type.NUMBER },
        humidity: { type: Type.NUMBER },
        growth_cm: { type: Type.NUMBER },
        is_blooming: { type: Type.BOOLEAN },
        count_update: { type: Type.NUMBER }
      }
    },
    habitatParams: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        size: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        type: { type: Type.STRING },
        location: { type: Type.STRING }
      }
    },
    aiReasoning: { type: Type.STRING },
    isAmbiguous: { type: Type.BOOLEAN }
  },
  required: ["intent", "aiReasoning"]
};

// Internal helper to call the secure Firebase API proxy
/**
 * Calls the Firebase Cloud Function proxy for Gemini API requests.
 */
async function callProxy(config: {
  model: string;
  contents: any;
  systemInstruction?: string;
  generationConfig?: any;
  operation?: string; // For cost tracking
}): Promise<any> {
  const startTime = Date.now();
  const operation = config.operation || 'ai_call';

  // FIXED: For native mobile, use absolute URL for Firebase Functions
  const PROXY_URL = (window as any).Capacitor?.isNativePlatform()
    ? 'https://us-central1-the-conservatory-d858b.cloudfunctions.net/proxy'
    : '/api/proxy';

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        contents: config.contents,
        systemInstruction: config.systemInstruction,
        config: config.generationConfig
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      const duration = Date.now() - startTime;
      
      // Track failed call (no cost but track the attempt)
      await trackCost({
        model: config.model,
        operation,
        estimatedCost: 0,
        duration,
        success: false,
        error: err.error || 'AI Proxy Error'
      });
      
      throw new Error(err.error || 'AI Proxy Error');
    }
    
    const result = await res.json();
    const duration = Date.now() - startTime;
    
    // Estimate tokens (rough approximation)
    const inputText = JSON.stringify(config.contents) + (config.systemInstruction || '');
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    const outputText = result.text || '';
    const estimatedOutputTokens = Math.ceil(outputText.length / 4);
    const cost = calculateCost(config.model, estimatedInputTokens, estimatedOutputTokens);
    
    // Track successful call
    await trackCost({
      model: config.model,
      operation,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      estimatedCost: cost,
      duration,
      success: true
    });
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await trackCost({
      model: config.model,
      operation,
      estimatedCost: 0,
      duration,
      success: false,
      error: error.message || 'Unknown error'
    });
    throw error;
  }
}

// Intent parsing cache with LRU eviction (max 100 entries)
const intentCache = new LRUCache<string, any>({ max: 100 });

export const geminiService = {
  /**
   * Synthesize enrichment data from a raw dossier (gemini-pro-latest)
   */
  async synthesizeEnrichmentData(dossier: any, researchContext?: string): Promise<any> {
    const contents = `Synthesize this raw data into a structured digital placard: ${JSON.stringify(dossier)}
                     ${researchContext ? `\n\nDEEP RESEARCH CONTEXT:\n${researchContext}` : ''}`;
    
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'synthesize_enrichment',
      contents,
      systemInstruction: "You are the Principal Curator of The Conservatory. Read the raw scraped data and extract structured info. If direct match not found, use genus fallback.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ENRICHED_DATA_SCHEMA,
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return EnrichedDataSchema.parse(data);
  },

  /**
   * Story Synthesis: Turn deep research into a museum-grade narrative (Living Placard)
   */
  async curateLivingPlacard(entity: Entity, researchSummary: string): Promise<{ narrative: string; biologicalStory: string; discovery: string }> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'curate_living_placard',
      contents: `Entity: ${entity.name}. Research Summary: ${researchSummary}`,
      systemInstruction: `
        You are a Master Storyteller and Biological Curator. 
        Take the provided research and craft a "Living Placard" narrative.
        
        1. narrative: A 2-3 sentence evocative description for a museum exhibit.
        2. biologicalStory: A deeper, fascinating story about the species' evolution or role in the ecosystem.
        3. discovery: One singular "Magic Moment" fact that would wow a visitor.
        
        Style: Sophisticated, authoritative, but accessible. Avoid generic AI fluff.
      `,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            biologicalStory: { type: Type.STRING },
            discovery: { type: Type.STRING }
          },
          required: ["narrative", "biologicalStory", "discovery"]
        }
      }
    }));
    return JSON.parse(response.text || '{}');
  },

  /**
   * Fast parsing for voice commands (gemini-flash-lite-latest)
   */
  async parseVoiceCommand(transcription: string, entities: Entity[]): Promise<any> {
    const cacheKey = `${transcription.toLowerCase().trim()}:${entities.length}`;
    if (intentCache.has(cacheKey)) {
      logCache('debug', 'Intent cache hit', { key: cacheKey.substring(0, 50), hit: true });
      return intentCache.get(cacheKey);
    }
    
    const entityIndex = entities.map(e => ({ id: e.id, name: e.name, aliases: e.aliases }));

    const systemInstruction = `
      You are the Principal Curator of "The Conservatory". Parse user voice input into structured JSON.
      Existing Index: ${JSON.stringify(entityIndex)}
      Priority: Speed. Use gemini-flash-lite-latest.
    `;

    const response = await withTimeout(callProxy({
      model: "gemini-flash-lite-latest",
      contents: transcription,
      systemInstruction,
      operation: 'parse_voice_command',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: PENDING_ACTION_SCHEMA,
      },
    }));

    const data = JSON.parse(response.text || '{}');
    const result = PendingActionSchema.safeParse(data);
    
    if (!result.success) {
      logger.warn({ validationErrors: result.error.errors }, 'Gemini validation errors (storing in overflow)');
      
      const validData: any = {
        intent: data.intent || null,
        targetHabitatName: data.targetHabitatName,
        aiReasoning: data.aiReasoning || 'Parsed with some validation issues',
        isAmbiguous: data.isAmbiguous,
        observationNotes: data.observationNotes,
        observationParams: data.observationParams,
        habitatParams: data.habitatParams,
      };
      
      if (data.candidates) {
        if (!Array.isArray(data.candidates)) {
          if (!validData.overflow) validData.overflow = {};
          validData.overflow.rawCandidates = data.candidates;
          validData.candidates = [];
        } else {
          const candidatesArray = Array.isArray(data.candidates) ? data.candidates : [];
          validData.candidates = candidatesArray.map((c: any, idx: number) => {
          const validCandidate: any = {
            commonName: c.commonName || `Unknown Species ${idx + 1}`,
            scientificName: c.scientificName,
            quantity: typeof c.quantity === 'number' ? c.quantity : undefined,
            traits: [],
          };
          
          const invalidData: any = {};
          if (c.traits && Array.isArray(c.traits)) {
            c.traits.forEach((t: any, traitIdx: number) => {
              if (!t || !t.type) {
                invalidData[`trait_${traitIdx}`] = t;
                return;
              }
              const validTrait: any = {
                type: t.type,
                parameters: {},
              };
              if (t.parameters && typeof t.parameters === 'object' && !Array.isArray(t.parameters)) {
                  Object.keys(t.parameters).forEach(key => {
                    const value = t.parameters[key];
                    try {
                      if (key === 'diet' && ['carnivore', 'herbivore', 'omnivore'].includes(value)) {
                        validTrait.parameters[key] = value;
                      } else if (key === 'lightReq') {
                        const normalized = String(value).toLowerCase();
                        if (normalized === 'medium' || normalized === 'med') validTrait.parameters[key] = 'med';
                        else if (['low', 'high'].includes(normalized)) validTrait.parameters[key] = normalized;
                        else { if (!invalidData.parameters) invalidData.parameters = {}; invalidData.parameters[key] = value; }
                      } else if (key === 'salinity' && ['fresh', 'brackish', 'marine'].includes(value)) {
                        validTrait.parameters[key] = value;
                      } else if (key === 'growth_rate') {
                        const normalized = String(value).toLowerCase();
                        if (normalized === 'medium' || normalized === 'med') validTrait.parameters[key] = 'medium';
                        else if (['slow', 'fast'].includes(normalized)) validTrait.parameters[key] = normalized;
                        else { if (!invalidData.parameters) invalidData.parameters = {}; invalidData.parameters[key] = value; }
                      } else if (key === 'difficulty' && ['easy', 'medium', 'hard', 'very_hard'].includes(value)) {
                        validTrait.parameters[key] = value;
                      } else if (key === 'placement' && ['foreground', 'midground', 'background', 'floating', 'epiphyte'].includes(value)) {
                        validTrait.parameters[key] = value;
                      } else if ((key === 'co2' || key === 'molting' || key === 'colony' || key === 'stable') && typeof value === 'boolean') {
                        validTrait.parameters[key] = value;
                      } else if ((key === 'pH' || key === 'temp' || key === 'humidity' || key === 'ammonia' || key === 'nitrates' || key === 'growth_height' || key === 'estimatedCount') && typeof value === 'number') {
                        validTrait.parameters[key] = value;
                      } else if ((key === 'substrate') && typeof value === 'string') {
                        validTrait.parameters[key] = value;
                      } else {
                        if (!invalidData.parameters) invalidData.parameters = {};
                        invalidData.parameters[key] = value;
                      }
                    } catch (e) {
                      if (!invalidData.parameters) invalidData.parameters = {};
                      invalidData.parameters[key] = value;
                    }
                  });
              }
              if (validTrait.type) validCandidate.traits.push(validTrait);
              else invalidData[`trait_${traitIdx}`] = t;
              if (Object.keys(invalidData).length > 0) {
                if (!validCandidate.overflow) validCandidate.overflow = {};
                Object.assign(validCandidate.overflow, invalidData);
              }
            });
          } else if (c.traits) {
            if (!validCandidate.overflow) validCandidate.overflow = {};
            validCandidate.overflow.rawTraits = c.traits;
          }
          Object.keys(c).forEach(key => {
            if (!['commonName', 'scientificName', 'quantity', 'traits'].includes(key)) {
              if (!validCandidate.overflow) validCandidate.overflow = {};
              validCandidate.overflow[key] = c[key];
            }
          });
          return validCandidate;
          });
        }
      }
      if (!validData.overflow) validData.overflow = {};
      validData.overflow.validationErrors = (result.error?.errors || []).map((e: any) => ({
        path: (e.path || []).join('.'),
        message: e.message || 'Unknown validation error'
      }));
      intentCache.set(cacheKey, validData);
      return validData;
    }
    const parsed = result.data;
    intentCache.set(cacheKey, parsed);
    return parsed;
  },

  /**
   * Deep Multimodal Analysis (gemini-pro-latest)
   */
  async identifyPhoto(base64Data: string): Promise<IdentifyResult> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'identify_photo',
      contents: [
        { role: 'user', parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: "Identify the species in this photo with high precision. Provide reasoning and confidence." }
        ]}
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            species: { type: Type.STRING },
            common_name: { type: Type.STRING },
            kingdom: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["species", "common_name", "kingdom", "confidence"]
        },
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return IdentifyResultSchema.parse(data);
  },

  /**
   * Analyze rack setup (gemini-pro-latest)
   */
  async analyzeRackScene(base64Data: string): Promise<{ containers: RackContainer[] }> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'analyze_rack_scene',
      contents: [
        { role: 'user', parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: "Identify all aquarium/terrarium containers on this rack. Map their position and contents." }
        ]}
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            containers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  shelf_level: { type: Type.STRING, enum: ['top', 'middle', 'bottom', 'unknown'] },
                  horizontal_position: { type: Type.STRING, enum: ['left', 'center', 'right', 'unknown'] },
                  size_estimate: { type: Type.STRING },
                  primary_species: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        common_name: { type: Type.STRING },
                        scientific_name: { type: Type.STRING },
                        confidence: { type: Type.NUMBER }
                      },
                      required: ["common_name", "scientific_name", "confidence"]
                    }
                  },
                  plants: { type: Type.ARRAY, items: { type: Type.STRING } },
                  equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidence: { type: Type.NUMBER }
                },
                required: ["shelf_level", "horizontal_position", "size_estimate", "primary_species", "confidence"]
              }
            }
          },
          required: ["containers"]
        },
      },
    }));
    const data = JSON.parse(response.text || '{"containers": []}');
    return { containers: z.array(RackContainerSchema).parse(data.containers) };
  },

  /**
   * Advisory Report (gemini-pro-latest)
   */
  async getAdvisoryReport(intent: string): Promise<AdvisoryReport> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'generate_advisory_report',
      contents: `Propose an implementation strategy for the following user request: ${intent}`,
      generationConfig: {
        systemInstruction: "You are an expert system architect specializing in digital twin management. Provide implementation reports.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategy: { type: Type.STRING },
            implementation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            impact_analysis: { type: Type.STRING },
            ide_prompt: { type: Type.STRING },
            persistence_status: { type: Type.STRING, enum: ['SECURE', 'AUDIT_FAILED'] }
          },
          required: ["strategy", "implementation_steps", "impact_analysis", "ide_prompt", "persistence_status"]
        },
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return AdvisoryReportSchema.parse(data);
  },

  /**
   * Strategy Agent: Handle unknown or complex intents
   */
  async getIntentStrategy(input: string, context: any): Promise<any> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'get_intent_strategy',
      contents: `The user said: "${input}". Context: ${JSON.stringify(context)}. Analyze what they want and provide a strategy.`,
      systemInstruction: "You are the Conservatory Strategy Agent. Suggest a path forward in a friendly way.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            suggestedCommand: { type: Type.STRING },
            technicalSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["advice", "suggestedCommand"]
        },
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return IntentStrategySchema.parse(data);
  },

  /**
   * Ecosystem Narrative: Holistic Synthesis
   */
  async getEcosystemNarrative(snapshot: any): Promise<{ webOfLife: string; biomicStory: string; evolutionaryTension: string }> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'get_ecosystem_narrative',
      contents: `Synthesize the biological connections of this habitat: ${JSON.stringify(snapshot)}`,
      systemInstruction: "You are the Master Ecologist. Analyze the habitat snapshot and generate a 3-part holistic report.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            webOfLife: { type: Type.STRING },
            biomicStory: { type: Type.STRING },
            evolutionaryTension: { type: Type.STRING }
          },
          required: ["webOfLife", "biomicStory", "evolutionaryTension"]
        },
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return EcosystemNarrativeSchema.parse(data);
  },

  /**
   * Generate a high-fidelity image prompt for habitat visuals
   */
  async generateHabitatVisualPrompt(narrative: string): Promise<string> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'generate_habitat_visual_prompt',
      contents: `Based on this ecosystem narrative, generate a detailed image generation prompt: ${narrative}`,
      systemInstruction: "Generate a descriptive, botanical image prompt. No titles or text.",
    }));
    return response.text || '';
  },

  /**
   * Discovery Layer: Scientific Mechanisms & Ethology
   */
  async getBiologicalDiscovery(speciesName: string): Promise<{ mechanism: string; evolutionaryAdvantage: string; synergyNote: string }> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      operation: 'get_biological_discovery',
      contents: `Identify the biological mechanism of: ${speciesName}.`,
      systemInstruction: "You are the Chief Biologist. Reveal the scientific 'How' and 'Why' behind biological traits.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mechanism: { type: Type.STRING },
            evolutionaryAdvantage: { type: Type.STRING },
            synergyNote: { type: Type.STRING }
          },
          required: ["mechanism", "evolutionaryAdvantage", "synergyNote"]
        },
      }
    }));
    const data = JSON.parse(response.text || '{}');
    return BiologicalDiscoverySchema.parse(data);
  },

  /**
   * Generic Content Generation
   */
  async generateContent(prompt: string, schema?: any): Promise<any> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }));
    return JSON.parse(response.text || '{}');
  },

  /**
   * Integrated Chat (Grounded Flash or Thinking Pro)
   */
  async chat(
    message: string, 
    history: any[] = [], 
    options: { search?: boolean; thinking?: boolean } = {}
  ): Promise<{ text: string; links?: any[] }> {
    const allPlants = await plantService.getAll();
    const plantIndex = allPlants.map(p => p.name).join(', ');
    const model = options.search ? "gemini-flash-latest" : "gemini-pro-latest";
    
    const response = await callProxy({
      model,
      operation: 'chat',
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      systemInstruction: `You are the Conservatory Guide. Plant inventory: ${plantIndex}`
    });
    
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => ({ title: c.web?.title || 'Source', uri: c.web?.uri }))
      .filter((l: any) => l.uri);

    return { text: response.text || "No response received.", links };
  }
};
