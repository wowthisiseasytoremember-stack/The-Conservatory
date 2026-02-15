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
  BiologicalDiscoverySchema 
} from '../src/schemas.js';
import { plantService } from './plantService.js';
import { logger, logAICall, logCache } from './logger.js';
import { trackCost, calculateCost } from './costTracker.js';
import { LRUCache } from '../utils/LRUCache.js';

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

// Internal helper to call the secure Vercel API proxy
/**
 * Calls the Firebase Cloud Function proxy for Gemini API requests.
 * 
 * The `/api/proxy` route is rewritten by firebase.json to the `proxy` Cloud Function
 * (see functions/src/index.ts). This keeps API keys secure on the server.
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
  
  try {
    const res = await fetch('/api/proxy', {
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
    // Input: count characters in prompt (roughly 4 chars per token)
    const inputText = JSON.stringify(config.contents) + (config.systemInstruction || '');
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    
    // Output: count characters in response (roughly 4 chars per token)
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
    
    // Track error (no cost but track the attempt)
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
const intentCache = new LRUCache<string, any>(100);

export const geminiService = {
  /**
   * Fast parsing for voice commands (gemini-flash-lite-latest)
   * 
   * Caches results to avoid re-parsing identical commands.
   * Cache key: transcription + entity count (entities change infrequently)
   */
  async parseVoiceCommand(transcription: string, entities: Entity[]): Promise<any> {
    // Create cache key from transcription and entity count
    // (Entity count is a proxy for context - if entities change, re-parse)
    const cacheKey = `${transcription.toLowerCase().trim()}:${entities.length}`;
    
    // Check cache first
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
    
    // Permissive validation: Extract valid data, store invalid in overflow
    // Never block - always return something usable
    const result = PendingActionSchema.safeParse(data);
    
    if (!result.success) {
      logger.warn({ validationErrors: result.error.errors }, 'Gemini validation errors (storing in overflow)');
      
      // Extract valid data and move invalid to overflow
      const validData: any = {
        intent: data.intent || null,
        targetHabitatName: data.targetHabitatName,
        aiReasoning: data.aiReasoning || 'Parsed with some validation issues',
        isAmbiguous: data.isAmbiguous,
        observationNotes: data.observationNotes,
        observationParams: data.observationParams,
        habitatParams: data.habitatParams,
      };
      
      // Process candidates - extract valid, store invalid in overflow
      if (data.candidates) {
        if (!Array.isArray(data.candidates)) {
          // Candidates is not an array - store in overflow
          if (!validData.overflow) validData.overflow = {};
          validData.overflow.rawCandidates = data.candidates;
          validData.candidates = []; // Empty array as fallback
        } else {
          // Ensure candidates is an array before mapping
          const candidatesArray = Array.isArray(data.candidates) ? data.candidates : [];
          validData.candidates = candidatesArray.map((c: any, idx: number) => {
          const validCandidate: any = {
            commonName: c.commonName || `Unknown Species ${idx + 1}`,
            scientificName: c.scientificName,
            quantity: typeof c.quantity === 'number' ? c.quantity : undefined,
            traits: [],
          };
          
          const invalidData: any = {};
          
              // Process traits - only include valid ones
          if (c.traits && Array.isArray(c.traits)) {
            c.traits.forEach((t: any, traitIdx: number) => {
              if (!t || !t.type) {
                invalidData[`trait_${traitIdx}`] = t;
                return;
              }
              
              const validTrait: any = {
                type: t.type,
                parameters: t.parameters && typeof t.parameters === 'object' && !Array.isArray(t.parameters) 
                  ? {} // Will be populated below
                  : {},
              };
              
              // Only include parameters that pass validation
              // Handle undefined, null, or invalid parameters
              if (t.parameters !== undefined && t.parameters !== null) {
                // Ensure parameters is an object, not array or other type
                if (typeof t.parameters !== 'object' || Array.isArray(t.parameters)) {
                  // Store invalid parameters structure in overflow
                  if (!invalidData.parameters) invalidData.parameters = {};
                  invalidData.rawParameters = t.parameters;
                  // Don't reset - just skip invalid parameters
                } else {
                  // parameters is a valid object - process it
                
                  Object.keys(t.parameters).forEach(key => {
                    const value = t.parameters[key];
                    
                    // Validate based on schema
                    try {
                      // Check if it's a valid enum or type
                      if (key === 'diet' && ['carnivore', 'herbivore', 'omnivore'].includes(value)) {
                        validTrait.parameters[key] = value;
                    } else if (key === 'lightReq') {
                      // Normalize lightReq values
                      const normalized = String(value).toLowerCase();
                      if (normalized === 'medium' || normalized === 'med') {
                        validTrait.parameters[key] = 'med';
                      } else if (['low', 'high'].includes(normalized)) {
                        validTrait.parameters[key] = normalized;
                      } else {
                        // Invalid value - store in overflow
                        if (!invalidData.parameters) invalidData.parameters = {};
                        invalidData.parameters[key] = value;
                      }
                      } else if (key === 'salinity' && ['fresh', 'brackish', 'marine'].includes(value)) {
                        validTrait.parameters[key] = value;
                      } else if (key === 'growth_rate') {
                        // Normalize growth_rate values
                        const normalized = String(value).toLowerCase();
                        if (normalized === 'medium' || normalized === 'med') {
                          validTrait.parameters[key] = 'medium';
                        } else if (['slow', 'fast'].includes(normalized)) {
                          validTrait.parameters[key] = normalized;
                        } else {
                          if (!invalidData.parameters) invalidData.parameters = {};
                          invalidData.parameters[key] = value;
                        }
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
                        // Invalid value - store in overflow
                        if (!invalidData.parameters) invalidData.parameters = {};
                        invalidData.parameters[key] = value;
                      }
                    } catch (e) {
                      // Store in overflow if validation fails
                      if (!invalidData.parameters) invalidData.parameters = {};
                      invalidData.parameters[key] = value;
                    }
                  });
                }
              }
              // If parameters is undefined or null, validTrait.parameters remains {} (empty object)
              
              // Only add trait if it has valid type
              if (validTrait.type) {
                validCandidate.traits.push(validTrait);
              } else {
                invalidData[`trait_${traitIdx}`] = t;
              }
              
              // Store any invalid trait data
              if (Object.keys(invalidData).length > 0) {
                if (!validCandidate.overflow) validCandidate.overflow = {};
                Object.assign(validCandidate.overflow, invalidData);
              }
            });
          } else if (c.traits) {
            // Traits is not an array - store in overflow
            if (!validCandidate.overflow) validCandidate.overflow = {};
            validCandidate.overflow.rawTraits = c.traits;
          }
          
          // Store any other invalid candidate data
          Object.keys(c).forEach(key => {
            if (!['commonName', 'scientificName', 'quantity', 'traits'].includes(key)) {
              if (!validCandidate.overflow) validCandidate.overflow = {};
              validCandidate.overflow[key] = c[key];
            }
          });
          
          return validCandidate;
          });
        }
      } else if (data.candidates) {
        // Candidates exists but is not an array - store in overflow
        if (!validData.overflow) validData.overflow = {};
        validData.overflow.rawCandidates = data.candidates;
        validData.candidates = []; // Empty array as fallback
      } else {
        // No candidates at all - empty array
        validData.candidates = [];
      }
      
      // Store any other invalid top-level data
      Object.keys(data).forEach(key => {
        if (!['intent', 'targetHabitatName', 'candidates', 'observationNotes', 'observationParams', 'habitatParams', 'aiReasoning', 'isAmbiguous'].includes(key)) {
          if (!validData.overflow) validData.overflow = {};
          validData.overflow[key] = data[key];
        }
      });
      
      // Store validation errors for debugging
      if (!validData.overflow) validData.overflow = {};
      validData.overflow.validationErrors = (result.error?.errors || []).map((e: any) => ({
        path: (e.path || []).join('.'),
        message: e.message || 'Unknown validation error',
        code: e.code || 'unknown'
      }));
      
      // Cache and return the permissive result
      intentCache.set(cacheKey, validData);
      logCache('debug', 'Intent cache stored (permissive validation)', { key: cacheKey.substring(0, 50) });
      return validData;
    }
    
    const parsed = result.data;
    
    // Cache the result
    intentCache.set(cacheKey, parsed);
    logCache('debug', 'Intent cache stored', { key: cacheKey.substring(0, 50) });
    
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
      contents: `The user said: "${input}". 
                 Context: ${JSON.stringify(context)}.
                 Analyze what they want and provide a strategy.`,
      systemInstruction: `
        You are the Conservatory Strategy Agent.
        When a user says something the system doesn't understand (e.g. "Crayfish molted"), 
        your job is to suggest a path forward in a friendly, conversational way.
        
        Guidelines:
        1. advice: Phrase this as a helpful suggestion or interpretation. 
           Example: "It sounds like you want to log a biological event for your crayfish. I can help with that—should I add a molting record to its history?"
        2. suggestedCommand: A specific, executable command that the system understands.
           Example: "Update Crayfish to include INVERTEBRATE trait with molting set to true."
        3. Never say "I don't know." Always provide a best-guess interpretation.
      `,
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
      systemInstruction: `
        You are the Master Ecologist. 
        Analyze the habitat snapshot (metadata + inhabitants).
        Generate a 3-part holistic report:
        1. webOfLife: How the specific plants and animals interact (shelter, biological filtration, etc.).
        2. biomicStory: A cohesive narrative of the tank's natural theme and inspiration.
        3. evolutionaryTension: Identifying potential biological dynamics (e.g. who competes for space, who hides where).
        Be sophisticated, educational, and fascinating.
      `,
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
      contents: `Based on this ecosystem narrative, generate a detailed image generation prompt for a premium botanical illustration: ${narrative}`,
      systemInstruction: "Generate a descriptive, photographic, or artistic image prompt focusing on botanical accuracy and atmospheric beauty. No titles or text.",
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
      contents: `Identify the biological mechanism or ethological secret of: ${speciesName}.`,
      systemInstruction: `
        You are the Chief Biologist of The Conservatory. 
        Your goal is to reveal the "How" and "Why" behind biological traits.
        Focus on:
        1. Scientific Mechanisms: (e.g., How photosynthesis adapts to low light, or how shrimp use antennae).
        2. Evolutionary Advantage: Why did this trait evolve in the wild?
        3. Synergy: How does this species benefit others in a captive ecosystem (e.g. nitrogen cycle, physical shelter).
        Avoid "twee" or overly poetic language. Be rigorous, fascinating, and scientific.
      `,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mechanism: { type: Type.STRING, description: "The scientific explanation of the trait/behavior" },
            evolutionaryAdvantage: { type: Type.STRING, description: "Why this trait exists in the wild" },
            synergyNote: { type: Type.STRING, description: "How this species interacts with others (Flora/Fauna)" }
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
    // CONTEXT INJECTION: Plant Library
    const allPlants = await plantService.getAll();
    const plantIndex = allPlants.map(p => p.name).join(', ');
    
    let relevantPlants = allPlants.filter(p => 
        message.toLowerCase().includes(p.name.toLowerCase()) || 
        message.toLowerCase().includes(p.id.toLowerCase())
    ).slice(0, 3);

    if (relevantPlants.length === 0) {
       const potentialGenera = message.split(' ').filter(w => w.length > 3);
       for (const word of potentialGenera) {
          const group = await plantService.getGenusGroup(word);
          if (group.length > 0) {
             relevantPlants = group.slice(0, 10);
             break; 
          }
       }
    }

    let contextString = `
    AVAILABLE PLANT DATABASE:
    The following plants are in your local inventory/library: ${plantIndex}.
    `;

    if (relevantPlants.length > 0) {
        contextString += `
        
        RELEVANT PLANT DETAILS (Found in database):
        ${JSON.stringify(relevantPlants, null, 2)}
        `;
    }

    const model = options.search ? "gemini-flash-latest" : "gemini-pro-latest";
    
    const response = await callProxy({
      model,
      operation: 'chat',
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      systemInstruction: `You are the Conservatory Guide. Help with aquaculture, biology, and system operations. \n${contextString}`
    });
    
    // Extract Grounding Chunks for display as mandatory
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => ({ title: c.web?.title || 'Source', uri: c.web?.uri }))
      .filter((l: any) => l.uri);

    return { 
      text: response.text || "No response received.", 
      links 
    };
  }
};
