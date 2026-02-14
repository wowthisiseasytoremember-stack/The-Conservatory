
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Entity, PendingAction, IdentifyResult, AdvisoryReport, RackContainer } from "../types";
import { plantService } from './plantService';

// Initialize using the mandatory process.env.API_KEY
const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const geminiService = {
  /**
   * Fast parsing for voice commands (gemini-flash-lite-latest)
   */
  async parseVoiceCommand(transcription: string, entities: Entity[]): Promise<any> {
    const ai = getClient();
    const entityIndex = entities.map(e => ({ id: e.id, name: e.name, aliases: e.aliases }));

    const systemInstruction = `
      You are the Principal Curator of "The Conservatory". Parse user voice input into structured JSON.
      Existing Index: ${JSON.stringify(entityIndex)}
      Priority: Speed. Use gemini-flash-lite-latest.
    `;

    // Using gemini-flash-lite-latest as per guidelines for flash lite models
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: transcription,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: PENDING_ACTION_SCHEMA,
      },
    }));
    return JSON.parse(response.text || '{}');
  },

  /**
   * Deep Multimodal Analysis (gemini-3-pro-preview)
   */
  async identifyPhoto(base64Data: string): Promise<IdentifyResult> {
    const ai = getClient();
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: "Identify the species in this photo with high precision. Provide reasoning and confidence." }
        ]
      },
      config: {
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
    return JSON.parse(response.text || '{}');
  },

  /**
   * Analyze rack setup (gemini-3-pro-preview)
   */
  async analyzeRackScene(base64Data: string): Promise<{ containers: RackContainer[] }> {
    const ai = getClient();
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: "Identify all aquarium/terrarium containers on this rack. Map their position and contents." }
        ]
      },
      config: {
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
      }
    }));
    return JSON.parse(response.text || '{"containers": []}');
  },

  /**
   * Advisory Report (gemini-3-pro-preview)
   */
  async getAdvisoryReport(intent: string): Promise<AdvisoryReport> {
    const ai = getClient();
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Propose an implementation strategy for the following user request: ${intent}`,
      config: {
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
    const ai = getClient();
    
    // CONTEXT INJECTION: Plant Library
    // We inject the full list of names so the AI knows what we have.
    // If the user asks about a specific plant, we could inject full details here.
    // For now, we provide the index and a lookup instruction.
    const allPlants = plantService.getAll();
    const plantIndex = allPlants.map(p => p.name).join(', ');
    
    // Smart Lookup: If message contains a plant name, inject its details
    // Simple heuristic: Does the message contain a known plant string?
    const relevantPlants = allPlants.filter(p => 
        message.toLowerCase().includes(p.name.toLowerCase()) || 
        message.toLowerCase().includes(p.id.toLowerCase())
    ).slice(0, 3); // Limit to top 3 matches to save tokens

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

    const model = options.search ? "gemini-3-flash-preview" : "gemini-3-pro-preview";
    const config: any = {};
    
    // ... (existing config logic)
    
    const chatInstance = ai.chats.create({
      model,
      config: {
        ...config,
        systemInstruction: `You are the Conservatory Guide. Help with aquaculture, biology, and system operations. \n${contextString}`
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });


    const response = await chatInstance.sendMessage({ message });
    
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
