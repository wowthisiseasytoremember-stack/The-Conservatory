
import { z } from 'zod';

/**
 * Trait Parameters Schema
 */
export const TraitParametersSchema = z.object({
  pH: z.number().optional(),
  temp: z.number().optional(),
  salinity: z.enum(['fresh', 'brackish', 'marine']).optional(),
  humidity: z.number().optional(),
  substrate: z.string().optional(),
  lightReq: z.enum(['low', 'med', 'high']).optional(),
  co2: z.boolean().optional(),
  molting: z.boolean().optional(),
  colony: z.boolean().optional(),
  diet: z.enum(['carnivore', 'herbivore', 'omnivore']).optional(),
  estimatedCount: z.number().optional(),
  stable: z.boolean().optional(),
  nitrates: z.number().optional(),
  ammonia: z.number().optional(),
  growth_height: z.number().optional(),
  growth_rate: z.enum(['slow', 'medium', 'fast']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'very_hard']).optional(),
  placement: z.enum(['foreground', 'midground', 'background', 'floating', 'epiphyte']).optional(),
});

/**
 * Entity Trait Schema
 */
export const TraitSchema = z.object({
  type: z.enum(['AQUATIC', 'TERRESTRIAL', 'PHOTOSYNTHETIC', 'INVERTEBRATE', 'VERTEBRATE', 'COLONY']),
  parameters: TraitParametersSchema.optional().default({})
});

/**
 * Pending Action Schema (for parseVoiceCommand)
 */
export const PendingActionSchema = z.object({
  intent: z.enum(['ACCESSION_ENTITY', 'LOG_OBSERVATION', 'MODIFY_HABITAT', 'QUERY']).nullable(),
  targetHabitatName: z.string().optional(),
  candidates: z.array(z.object({
    commonName: z.string(),
    scientificName: z.string().optional(),
    quantity: z.number().optional(),
    traits: z.array(TraitSchema)
  })).optional(),
  observationNotes: z.string().optional(),
  observationParams: z.object({
    pH: z.number().optional(),
    temp: z.number().optional(),
    ammonia: z.number().optional(),
    nitrites: z.number().optional(),
    nitrates: z.number().optional(),
    humidity: z.number().optional(),
    growth_cm: z.number().optional(),
    is_blooming: z.boolean().optional(),
    count_update: z.number().optional()
  }).optional(),
  habitatParams: z.object({
    name: z.string().optional(),
    size: z.number().optional(),
    unit: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional()
  }).optional(),
  aiReasoning: z.string(),
  isAmbiguous: z.boolean().optional()
});

/**
 * Identification Result Schema
 */
export const IdentifyResultSchema = z.object({
  species: z.string(),
  common_name: z.string(),
  kingdom: z.string(),
  confidence: z.number(),
  reasoning: z.string()
});

/**
 * Rack Container Schema
 */
export const RackContainerSchema = z.object({
  id: z.string(),
  shelf_level: z.enum(['top', 'middle', 'bottom', 'unknown']),
  horizontal_position: z.enum(['left', 'center', 'right', 'unknown']),
  size_estimate: z.string(),
  primary_species: z.array(z.object({
    common_name: z.string(),
    scientific_name: z.string(),
    confidence: z.number()
  })),
  plants: z.array(z.string()),
  equipment: z.array(z.string()),
  confidence: z.number()
});

/**
 * Advisory Report Schema
 */
export const AdvisoryReportSchema = z.object({
  strategy: z.string(),
  implementation_steps: z.array(z.string()),
  impact_analysis: z.string(),
  ide_prompt: z.string(),
  persistence_status: z.enum(['SECURE', 'AUDIT_FAILED'])
});

/**
 * Intent Strategy Schema
 */
export const IntentStrategySchema = z.object({
  advice: z.string(),
  suggestedCommand: z.string(),
  technicalSteps: z.array(z.string()).optional()
});

/**
 * Ecosystem Narrative Schema
 */
export const EcosystemNarrativeSchema = z.object({
  webOfLife: z.string(),
  biomicStory: z.string(),
  evolutionaryTension: z.string()
});

/**
 * Biological Discovery Schema
 */
export const BiologicalDiscoverySchema = z.object({
  mechanism: z.string(),
  evolutionaryAdvantage: z.string(),
  synergyNote: z.string()
});
