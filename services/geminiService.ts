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
async function callProxy(config: {
  model: string;
  contents: any;
  systemInstruction?: string;
  generationConfig?: any;
}) {
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
    throw new Error(err.error || 'AI Proxy Error');
  }
  
  return await res.json();
}

export const geminiService = {
  /**
   * Fast parsing for voice commands (gemini-flash-lite-latest)
   */
  async parseVoiceCommand(transcription: string, entities: Entity[]): Promise<any> {
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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: PENDING_ACTION_SCHEMA,
      },
    }));

    const data = JSON.parse(response.text || '{}');
    return PendingActionSchema.parse(data);
  },

  /**
   * Deep Multimodal Analysis (gemini-pro-latest)
   */
  async identifyPhoto(base64Data: string): Promise<IdentifyResult> {
    const response = await withTimeout(callProxy({
      model: "gemini-pro-latest",
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
