# PASS 2: Ideal Architecture (Tabula Rasa)

This document designs the **cleanest, most modern, production-ready architecture** for The Conservatory, ignoring all current implementation constraints. This is the target architecture that achieves all inferred goals from PASS 1.

---

## Executive Summary

**Goal**: Design a production-ready, App Store-ready architecture that:
- Separates concerns into clear layers
- Uses standard tooling instead of custom implementations
- Supports multimodal input (voice, text, camera)
- Enables provider-agnostic AI model routing
- Implements proper schema enforcement and validation
- Handles offline-first operation
- Scales to multi-user scenarios
- Provides wonder-inducing discovery experiences

**Architecture Style**: Layered architecture with dependency injection, event sourcing, and CQRS patterns where appropriate.

---

## 1. Logical Layer Architecture

### 1.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Components (UI) - Voice, Camera, Text, Confirmation  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Use Cases / Command Handlers / Query Handlers              │
│  - AccessionUseCase                                          │
│  - EnrichmentUseCase                                         │
│  - ObservationUseCase                                        │
│  - HabitatUseCase                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     DOMAIN LAYER                              │
│  Domain Models / Business Logic / Rules                      │
│  - Entity (Habitat, Organism)                                │
│  - Trait System                                              │
│  - Enrichment Pipeline                                       │
│  - Event Sourcing                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                         │
│  - AI Provider Adapters (Gemini, OpenAI, Anthropic)          │
│  - Repository Implementations (Firestore, LocalStorage)     │
│  - External API Clients (GBIF, iNaturalist, Wikipedia)      │
│  - Schema Validators (Zod)                                   │
│  - Event Store                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Layer Responsibilities

**Presentation Layer**:
- React components for UI
- User input capture (voice, text, camera)
- Confirmation interfaces (Mad-Libs style)
- Display of enriched data and discovery content
- **NO business logic** - only UI concerns

**Application Layer**:
- Orchestrates domain operations
- Handles use cases (Accession, Enrichment, Observation)
- Coordinates between domain and infrastructure
- Manages transactions and side effects
- **NO domain rules** - delegates to domain layer

**Domain Layer**:
- Core business logic and rules
- Entity models (Habitat, Organism, Trait)
- Enrichment pipeline logic
- Event generation
- **NO infrastructure dependencies** - pure TypeScript

**Infrastructure Layer**:
- External service integrations
- Data persistence
- AI provider abstractions
- Schema validation
- **NO business logic** - only technical concerns

---

## 2. Core Domain Models

### 2.1 Entity Hierarchy

```typescript
// Domain/Entities/Entity.ts
interface Entity {
  id: string;
  type: EntityType; // HABITAT | ORGANISM | COLONY
  name: string;
  aliases: string[]; // For fuzzy matching
  traits: Trait[];
  habitat_id?: string; // For organisms
  enrichment_status: EnrichmentStatus;
  created_at: Date;
  updated_at: Date;
  created_by: string; // User ID
}

// Domain/Entities/Habitat.ts
interface Habitat extends Entity {
  type: 'HABITAT';
  size?: number;
  size_unit?: string; // 'gallons', 'liters', 'inches', etc.
  habitat_type: HabitatType; // 'freshwater' | 'saltwater' | 'brackish' | 'terrestrial' | 'pot'
  location?: string;
  environmental_params: Record<string, any>; // pH, temp, etc.
  spatial_position?: SpatialPosition; // For rack layouts
}

// Domain/Entities/Organism.ts
interface Organism extends Entity {
  type: 'ORGANISM' | 'COLONY';
  scientific_name?: string;
  morph_variant?: string; // "Thai Constellation", "Global Green", etc.
  quantity: number;
  habitat_id: string; // Required
  enrichment_data?: EnrichmentData;
}

// Domain/Entities/Trait.ts
interface Trait {
  type: TraitType; // AQUATIC | TERRESTRIAL | PHOTOSYNTHETIC | etc.
  parameters: Record<string, any>; // Trait-specific params
}

// Domain/Entities/EnrichmentData.ts
interface EnrichmentData {
  local_library?: LocalLibraryData;
  gbif?: GBIFData;
  wikipedia?: WikipediaData;
  inaturalist?: iNaturalistData;
  ai_discovery?: AIDiscoveryData; // The "wonder" layer
  overflow?: Record<string, any>; // For morphs/variants that don't fit schema
  enriched_at: Date;
  enriched_by: string; // User ID or 'system'
}
```

### 2.2 Event Sourcing Model

```typescript
// Domain/Events/DomainEvent.ts
interface DomainEvent {
  id: string;
  type: EventType;
  entity_id: string;
  entity_type: EntityType;
  payload: Record<string, any>;
  metadata: {
    user_id: string;
    timestamp: Date;
    original_input?: string; // Voice/text that triggered this
    source: 'voice' | 'text' | 'camera' | 'manual';
  };
  version: number;
}

// Domain/Events/EventTypes.ts
type EventType =
  | 'ACCESSION_ENTITY'
  | 'MODIFY_HABITAT'
  | 'LOG_OBSERVATION'
  | 'REMOVE_ENTITY'
  | 'ENRICHMENT_STARTED'
  | 'ENRICHMENT_COMPLETED'
  | 'ENRICHMENT_FAILED';

// Domain/Events/EventStore.ts
interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(entityId: string): Promise<DomainEvent[]>;
  getEventsByType(type: EventType): Promise<DomainEvent[]>;
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;
}
```

### 2.3 Species Library Model

```typescript
// Domain/SpeciesLibrary/SpeciesRecord.ts
interface SpeciesRecord {
  id: string; // Composite key: scientific_name + morph_variant
  common_name: string;
  scientific_name: string;
  morph_variant?: string;
  traits: Trait[];
  enrichment_data: EnrichmentData;
  first_seen_at: Date;
  last_updated_at: Date;
  access_count: number; // For popularity tracking
}

// Domain/SpeciesLibrary/SpeciesLibrary.ts
interface SpeciesLibrary {
  findByCommonName(name: string, morph?: string): Promise<SpeciesRecord | null>;
  findByScientificName(name: string): Promise<SpeciesRecord | null>;
  findByAlias(alias: string): Promise<SpeciesRecord | null>;
  save(record: SpeciesRecord): Promise<void>;
  incrementAccess(id: string): Promise<void>;
}
```

---

## 3. Input/Output Contracts

### 3.1 Voice/Text Input Contract

```typescript
// Application/Commands/AccessionCommand.ts
interface AccessionCommand {
  input: string; // Raw voice transcription or text
  source: 'voice' | 'text';
  user_id: string;
  timestamp: Date;
}

// Application/Commands/ModifyHabitatCommand.ts
interface ModifyHabitatCommand {
  input: string;
  source: 'voice' | 'text' | 'camera';
  user_id: string;
  timestamp: Date;
}

// Application/Commands/ObservationCommand.ts
interface ObservationCommand {
  input: string;
  source: 'voice' | 'text';
  user_id: string;
  timestamp: Date;
}
```

### 3.2 Camera Input Contract

```typescript
// Application/Commands/PhotoAnalysisCommand.ts
interface PhotoAnalysisCommand {
  image_data: string; // Base64 or blob URL
  mode: 'single_species' | 'rack_scan';
  user_id: string;
  timestamp: Date;
}

// Application/Queries/PhotoAnalysisResult.ts
interface PhotoAnalysisResult {
  mode: 'single_species' | 'rack_scan';
  single_species?: {
    species_name: string;
    confidence: number;
    traits: Trait[];
  };
  rack_scan?: {
    containers: DetectedContainer[];
    species_detections: SpeciesDetection[];
  };
}

interface DetectedContainer {
  position: SpatialPosition;
  estimated_size?: number;
  estimated_size_unit?: string;
  habitat_type?: HabitatType;
  confidence: number;
}

interface SpeciesDetection {
  container_index: number;
  species_name: string;
  confidence: number;
  traits: Trait[];
}
```

### 3.3 AI Provider Contract (Provider-Agnostic)

```typescript
// Infrastructure/AI/IAIProvider.ts
interface IAIProvider {
  // Intent parsing
  parseIntent(input: string, context?: UserContext): Promise<ParsedIntent>;
  
  // Vision
  identifySpecies(image: string): Promise<SpeciesIdentification>;
  analyzeRackScene(image: string): Promise<RackAnalysis>;
  
  // Enrichment
  generateDiscovery(species: SpeciesRecord, context: EnrichmentContext): Promise<AIDiscoveryData>;
  generateEcosystemNarrative(habitat: Habitat, organisms: Organism[]): Promise<EcosystemNarrative>;
  
  // Chat (future)
  chat(messages: ChatMessage[], context: UserContext): Promise<ChatResponse>;
}

// Infrastructure/AI/ParsedIntent.ts
interface ParsedIntent {
  intent: IntentType;
  confidence: number;
  entities: ExtractedEntity[];
  missing_fields: string[]; // For non-blocking UX
}

type IntentType = 
  | 'ACCESSION_ENTITY'
  | 'MODIFY_HABITAT'
  | 'LOG_OBSERVATION'
  | 'REMOVE_ENTITY'
  | 'QUERY'
  | 'AMBIGUOUS';

interface ExtractedEntity {
  type: 'species' | 'habitat' | 'quantity' | 'parameter';
  value: any;
  confidence: number;
  raw_text: string;
}
```

### 3.4 Enrichment Pipeline Contract

```typescript
// Domain/Enrichment/EnrichmentPipeline.ts
interface EnrichmentPipeline {
  enrichSpecies(speciesName: string, morphVariant?: string): Promise<EnrichmentResult>;
  enrichHabitat(habitatId: string): Promise<EcosystemNarrative>;
}

interface EnrichmentResult {
  species_record: SpeciesRecord;
  stages: EnrichmentStage[];
  status: 'complete' | 'partial' | 'failed';
}

interface EnrichmentStage {
  source: EnrichmentSource;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  data?: any;
  error?: string;
  duration_ms?: number;
}

type EnrichmentSource = 
  | 'local_library'
  | 'gbif'
  | 'wikipedia'
  | 'inaturalist'
  | 'ai_discovery';

// Domain/Enrichment/EcosystemNarrative.ts
interface EcosystemNarrative {
  web_of_life: string; // How organisms interact
  biomic_story: string; // Cohesive narrative of habitat theme
  evolutionary_tension: string; // Competition, dynamics, pressures
  thoughts_suggestions: string; // Things AI loved, things to consider
  overall_message: string; // "Look how cool this thing you cared for is"
  practical_tips: string[]; // Actionable suggestions
}
```

---

## 4. Provider-Agnostic Model Routing

### 4.1 AI Provider Adapter Pattern

```typescript
// Infrastructure/AI/Providers/GeminiProvider.ts
class GeminiProvider implements IAIProvider {
  constructor(
    private config: GeminiConfig,
    private schemaValidator: SchemaValidator
  ) {}
  
  async parseIntent(input: string, context?: UserContext): Promise<ParsedIntent> {
    // Use fast model (flash-lite) for low latency
    const response = await this.client.generateContent({
      model: 'gemini-2.0-flash-exp',
      prompt: this.buildIntentPrompt(input, context),
      responseSchema: IntentSchema
    });
    
    return this.schemaValidator.validate<ParsedIntent>(response, IntentSchema);
  }
  
  async generateDiscovery(species: SpeciesRecord, context: EnrichmentContext): Promise<AIDiscoveryData> {
    // Use pro model for quality
    const response = await this.client.generateContent({
      model: 'gemini-2.0-pro-exp',
      prompt: this.buildDiscoveryPrompt(species, context),
      responseSchema: DiscoverySchema
    });
    
    return this.schemaValidator.validate<AIDiscoveryData>(response, DiscoverySchema);
  }
}

// Infrastructure/AI/Providers/OpenAIProvider.ts
class OpenAIProvider implements IAIProvider {
  // Same interface, different implementation
}

// Infrastructure/AI/Providers/AnthropicProvider.ts
class AnthropicProvider implements IAIProvider {
  // Same interface, different implementation
}
```

### 4.2 Provider Router

```typescript
// Infrastructure/AI/AIProviderRouter.ts
class AIProviderRouter {
  constructor(
    private providers: Map<string, IAIProvider>,
    private config: ProviderConfig
  ) {}
  
  getProvider(operation: AIOperation): IAIProvider {
    // Route based on operation type, cost, latency requirements
    switch (operation) {
      case 'parse_intent':
        return this.providers.get(this.config.fast_model_provider); // Flash model
      case 'generate_discovery':
        return this.providers.get(this.config.quality_model_provider); // Pro model
      case 'vision':
        return this.providers.get(this.config.vision_model_provider);
      default:
        return this.providers.get(this.config.default_provider);
    }
  }
  
  async execute<T>(operation: AIOperation, ...args: any[]): Promise<T> {
    const provider = this.getProvider(operation);
    return provider[operation](...args) as Promise<T>;
  }
}
```

### 4.3 Configuration-Driven Provider Selection

```typescript
// Infrastructure/AI/ProviderConfig.ts
interface ProviderConfig {
  default_provider: 'gemini' | 'openai' | 'anthropic';
  fast_model_provider: 'gemini' | 'openai' | 'anthropic';
  quality_model_provider: 'gemini' | 'openai' | 'anthropic';
  vision_model_provider: 'gemini' | 'openai' | 'anthropic';
  
  // Per-provider configs
  gemini: {
    api_key: string;
    fast_model: string; // 'gemini-2.0-flash-exp'
    quality_model: string; // 'gemini-2.0-pro-exp'
    vision_model: string; // 'gemini-2.0-pro-exp'
  };
  
  openai: {
    api_key: string;
    fast_model: string; // 'gpt-4o-mini'
    quality_model: string; // 'gpt-4o'
    vision_model: string; // 'gpt-4o'
  };
  
  anthropic: {
    api_key: string;
    fast_model: string; // 'claude-3-5-haiku'
    quality_model: string; // 'claude-3-5-sonnet'
    vision_model: string; // 'claude-3-5-sonnet'
  };
}
```

---

## 5. Domain-Configurable Prompts

### 5.1 Prompt Template System

```typescript
// Domain/Prompts/PromptTemplate.ts
interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  schema: ZodSchema; // Output schema
  model_config: {
    temperature: number;
    max_tokens: number;
    provider_preference?: string;
  };
}

// Domain/Prompts/PromptRepository.ts
interface PromptRepository {
  getTemplate(id: string): Promise<PromptTemplate>;
  getAllTemplates(): Promise<PromptTemplate[]>;
  updateTemplate(template: PromptTemplate): Promise<void>;
}

// Domain/Prompts/PromptEngine.ts
class PromptEngine {
  constructor(
    private repository: PromptRepository,
    private aiProvider: IAIProvider
  ) {}
  
  async execute(
    templateId: string,
    variables: Record<string, any>,
    context?: UserContext
  ): Promise<any> {
    const template = await this.repository.getTemplate(templateId);
    const prompt = this.render(template.template, variables);
    
    const response = await this.aiProvider.generateContent({
      prompt,
      schema: template.schema,
      ...template.model_config
    });
    
    return response;
  }
  
  private render(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }
}
```

### 5.2 Standard Prompt Templates

```typescript
// Domain/Prompts/Templates/intent_parsing.ts
const INTENT_PARSING_TEMPLATE: PromptTemplate = {
  id: 'intent_parsing',
  name: 'Intent Parsing',
  template: `
You are parsing a user's natural language command about their biological collection.

User input: "{{input}}"

User's current collection context:
{{#if habitats}}
Habitats:
{{#each habitats}}
- {{name}} ({{type}}, {{size}} {{size_unit}})
{{/each}}
{{/if}}

{{#if organisms}}
Recent organisms:
{{#each organisms}}
- {{name}} in {{habitat_name}}
{{/each}}
{{/if}}

Parse the user's intent and extract:
1. Intent type (ACCESSION_ENTITY, MODIFY_HABITAT, LOG_OBSERVATION, REMOVE_ENTITY, QUERY, or AMBIGUOUS)
2. Species names (including morph/variant names like "Thai Constellation", "Global Green")
3. Quantities
4. Habitat/container names
5. Environmental parameters (pH, temp, etc.)
6. Any missing fields (use null, never block user)

Remember: This is about WONDER and DISCOVERY, not maintenance. The user wants to feel smart, happy, and proud about their collection.

Return structured JSON matching the IntentSchema.
  `,
  variables: ['input', 'habitats', 'organisms'],
  schema: IntentSchema,
  model_config: {
    temperature: 0.3,
    max_tokens: 1000,
    provider_preference: 'fast'
  }
};

// Domain/Prompts/Templates/discovery.ts
const DISCOVERY_TEMPLATE: PromptTemplate = {
  id: 'discovery',
  name: 'Biological Discovery',
  template: `
You are revealing the fascinating biological mechanisms behind {{species_name}}{{#if morph_variant}} (specifically the {{morph_variant}} morph/variant){{/if}}.

Scientific name: {{scientific_name}}
Traits: {{traits}}

Your task: Create wonder-inducing content that makes the user feel smart, happy, and proud about this organism.

Include:
1. **Mechanism**: Scientific explanation of how key traits/adaptations work (e.g., "guanine crystals" fact)
2. **Evolutionary Advantage**: Why this trait evolved (for wild species) OR human cultivation history (for cultivars/morphs)
3. **Synergy Note**: How this species benefits others in captive ecosystem
4. **Wonder Facts**: Specific, accurate facts that inspire awe (e.g., "Thai Constellations can't exist without hormones injected during tissue culture - without science and labs, they wouldn't exist!")

Tone: Poetic when appropriate, educational when possible, but always beautiful and never twee. Acknowledge the awesome majesty of biology, time, nature, and human cultivation.

For morphs/variants: Provide way more and better info than Google can - tissue culture processes, specific care needs, how to differentiate from similar morphs, discovery/patenting date or story, what makes THIS morph special.

Return structured JSON matching the DiscoverySchema.
  `,
  variables: ['species_name', 'morph_variant', 'scientific_name', 'traits'],
  schema: DiscoverySchema,
  model_config: {
    temperature: 0.7,
    max_tokens: 2000,
    provider_preference: 'quality'
  }
};

// Domain/Prompts/Templates/ecosystem_narrative.ts
const ECOSYSTEM_NARRATIVE_TEMPLATE: PromptTemplate = {
  id: 'ecosystem_narrative',
  name: 'Ecosystem Narrative',
  template: `
Analyze this complete ecosystem and generate a holistic narrative:

Habitat: {{habitat_name}} ({{size}} {{size_unit}}, {{habitat_type}})
Environmental parameters: {{environmental_params}}

Organisms:
{{#each organisms}}
- {{name}} ({{scientific_name}}) - {{traits}}
{{/each}}

Generate:
1. **Web of Life**: How organisms interact (shelter, filtration, symbiosis)
2. **Biomic Story**: Cohesive narrative of habitat's natural theme
3. **Evolutionary Tension**: Competition, dynamics, biological pressures
4. **Thoughts/Suggestions**: Things you loved, things user might want to think about
5. **Overall Message**: "Look how fucking cool this thing you cared for is"
6. **Practical Tips**: Actionable suggestions (e.g., "If you move that light two inches higher, your moss will start growing higher reaching for it")

Tone: Poetic but not twee. Beautiful and not wrong if it can't be educational. Inspire wonder while being accurate.

Return structured JSON matching the EcosystemNarrativeSchema.
  `,
  variables: ['habitat_name', 'size', 'size_unit', 'habitat_type', 'environmental_params', 'organisms'],
  schema: EcosystemNarrativeSchema,
  model_config: {
    temperature: 0.8,
    max_tokens: 3000,
    provider_preference: 'quality'
  }
};
```

---

## 6. Schema Enforcement and Normalization

### 6.1 Single Source of Truth Schema

```typescript
// Domain/Schemas/EntitySchemas.ts
import { z } from 'zod';

// Single Zod schema defines structure
export const EntitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['HABITAT', 'ORGANISM', 'COLONY']),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  traits: z.array(TraitSchema),
  habitat_id: z.string().uuid().optional(),
  enrichment_status: z.enum(['none', 'queued', 'pending', 'complete', 'failed']),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string()
});

export const HabitatSchema = EntitySchema.extend({
  type: z.literal('HABITAT'),
  size: z.number().positive().optional(),
  size_unit: z.string().optional(),
  habitat_type: z.enum(['freshwater', 'saltwater', 'brackish', 'terrestrial', 'pot']),
  location: z.string().optional(),
  environmental_params: z.record(z.any()),
  spatial_position: SpatialPositionSchema.optional()
});

export const OrganismSchema = EntitySchema.extend({
  type: z.enum(['ORGANISM', 'COLONY']),
  scientific_name: z.string().optional(),
  morph_variant: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  habitat_id: z.string().uuid(),
  enrichment_data: EnrichmentDataSchema.optional()
});

// Infrastructure/AI/SchemaAdapter.ts
// Converts Zod schemas to provider-specific formats
class SchemaAdapter {
  toGeminiSchema(zodSchema: ZodSchema): GeminiSchema {
    // Convert Zod to Google GenAI JSON schema format
  }
  
  toOpenAISchema(zodSchema: ZodSchema): OpenAISchema {
    // Convert Zod to OpenAI function calling format
  }
  
  toAnthropicSchema(zodSchema: ZodSchema): AnthropicSchema {
    // Convert Zod to Anthropic tool use format
  }
}
```

### 6.2 Validation Pipeline

```typescript
// Infrastructure/Validation/ValidationPipeline.ts
class ValidationPipeline {
  constructor(
    private zodValidator: ZodValidator,
    private schemaAdapter: SchemaAdapter
  ) {}
  
  async validateInput<T>(
    data: unknown,
    schema: ZodSchema<T>,
    provider?: 'gemini' | 'openai' | 'anthropic'
  ): Promise<T> {
    // Validate with Zod (single source of truth)
    const validated = await this.zodValidator.validate(data, schema);
    
    // If provider-specific validation needed, convert schema
    if (provider) {
      const providerSchema = this.schemaAdapter.toProviderSchema(schema, provider);
      // Additional provider-specific validation if needed
    }
    
    return validated;
  }
  
  async validateAIResponse<T>(
    response: unknown,
    schema: ZodSchema<T>
  ): Promise<T> {
    // Always validate AI responses with Zod
    // Handle partial responses, missing fields, etc.
    return this.zodValidator.validate(response, schema, {
      allowPartial: true, // For non-blocking UX
      stripUnknown: true
    });
  }
}
```

### 6.3 Normalization Layer

```typescript
// Domain/Normalization/EntityNormalizer.ts
class EntityNormalizer {
  normalize(entity: Partial<Entity>): Entity {
    return {
      id: entity.id ?? this.generateId(),
      type: entity.type ?? this.inferType(entity),
      name: this.normalizeName(entity.name),
      aliases: this.normalizeAliases(entity.aliases ?? [], entity.name),
      traits: this.normalizeTraits(entity.traits ?? []),
      habitat_id: entity.habitat_id,
      enrichment_status: entity.enrichment_status ?? 'none',
      created_at: entity.created_at ?? new Date(),
      updated_at: new Date(),
      created_by: entity.created_by ?? 'system'
    };
  }
  
  private inferType(entity: Partial<Entity>): EntityType {
    // Infer from traits: PHOTOSYNTHETIC → PLANT, COLONY → COLONY, etc.
    const traits = entity.traits ?? [];
    if (traits.some(t => t.type === 'PHOTOSYNTHETIC')) return 'ORGANISM'; // Could be PLANT
    if (traits.some(t => t.type === 'COLONY')) return 'COLONY';
    return 'ORGANISM';
  }
  
  private normalizeName(name?: string): string {
    if (!name) return '---'; // Non-blocking: use placeholder
    return name.trim();
  }
  
  private normalizeAliases(aliases: string[], name: string): string[] {
    // Add name as alias, deduplicate, lowercase
    return [...new Set([name.toLowerCase(), ...aliases.map(a => a.toLowerCase())])];
  }
}
```

---

## 7. Standard Tooling Recommendations

### 7.1 State Management

**❌ DON'T BUILD**: Custom store class mixing state + business logic + data access

**✅ USE**: 
- **Zustand** (lightweight, React-friendly) OR
- **Jotai** (atomic state) OR  
- **Redux Toolkit** (if complex state needed)

**Rationale**: Standard libraries handle reactivity, persistence, devtools. Your store should only manage UI state, not business logic.

```typescript
// Application/State/ConservatoryStore.ts (Zustand example)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConservatoryState {
  // UI state only
  activeHabitatId: string | null;
  pendingActions: PendingAction[];
  selectedEntities: string[];
  
  // Actions (delegate to use cases)
  setActiveHabitat: (id: string) => void;
  addPendingAction: (action: PendingAction) => void;
}

export const useConservatoryStore = create<ConservatoryState>()(
  persist(
    (set) => ({
      activeHabitatId: null,
      pendingActions: [],
      selectedEntities: [],
      
      setActiveHabitat: (id) => set({ activeHabitatId: id }),
      addPendingAction: (action) => set((state) => ({
        pendingActions: [...state.pendingActions, action]
      }))
    }),
    { name: 'conservatory-ui-state' }
  )
);
```

### 7.2 Dependency Injection

**❌ DON'T BUILD**: Direct service instantiation scattered across code

**✅ USE**: 
- **InversifyJS** (TypeScript DI container) OR
- **TSyringe** (simpler, decorator-based) OR
- **Manual DI** (simple factory functions)

**Rationale**: Enables testing, swapping implementations, managing lifecycle.

```typescript
// Infrastructure/DI/Container.ts (TSyringe example)
import { container } from 'tsyringe';

// Register implementations
container.register<IAIProvider>('AIProvider', { useClass: GeminiProvider });
container.register<ISpeciesLibrary>('SpeciesLibrary', { useClass: FirestoreSpeciesLibrary });
container.register<IEventStore>('EventStore', { useClass: FirestoreEventStore });

// In use cases
class AccessionUseCase {
  constructor(
    @inject('AIProvider') private aiProvider: IAIProvider,
    @inject('SpeciesLibrary') private speciesLibrary: ISpeciesLibrary,
    @inject('EventStore') private eventStore: IEventStore
  ) {}
}
```

### 7.3 API Client

**❌ DON'T BUILD**: Custom fetch wrappers, manual retry logic, timeout utilities

**✅ USE**: 
- **Axios** (interceptors, retries) OR
- **Ky** (lightweight, modern) OR
- **tRPC** (if TypeScript-first API)

**Rationale**: Standard libraries handle retries, timeouts, interceptors, error handling.

```typescript
// Infrastructure/HTTP/ApiClient.ts
import axios from 'axios';
import { retry } from 'axios-retry';

const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 30000
});

// Automatic retry on failure
retry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 7.4 Caching

**❌ DON'T BUILD**: Custom caching logic, manual memoization

**✅ USE**: 
- **TanStack Query (React Query)** for server state
- **SWR** (alternative)
- **React Cache** (React 19)

**Rationale**: Handles caching, invalidation, background refetching, optimistic updates.

```typescript
// Application/Queries/useSpeciesQuery.ts
import { useQuery } from '@tanstack/react-query';

export function useSpecies(speciesName: string, morphVariant?: string) {
  return useQuery({
    queryKey: ['species', speciesName, morphVariant],
    queryFn: () => speciesLibrary.findByCommonName(speciesName, morphVariant),
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
```

### 7.5 Form Validation

**❌ DON'T BUILD**: Custom validation logic, manual error handling

**✅ USE**: 
- **React Hook Form** + **Zod** (already using Zod)
- **Formik** (alternative)

**Rationale**: Handles form state, validation, error messages, submission.

```typescript
// Presentation/Forms/AccessionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function AccessionForm() {
  const form = useForm({
    resolver: zodResolver(AccessionSchema),
    defaultValues: {
      species_name: '',
      quantity: 1,
      habitat_id: ''
    }
  });
  
  // Form handles validation, errors, submission
}
```

### 7.6 Event Sourcing

**❌ DON'T BUILD**: Custom event store, manual event replay

**✅ USE**: 
- **EventStore DB** (if dedicated event store needed) OR
- **Firestore** (current, but structure properly) OR
- **PostgreSQL** with event sourcing patterns

**Rationale**: Standard patterns for event storage, replay, snapshots.

### 7.7 Testing

**❌ DON'T BUILD**: Custom test utilities, manual mocking

**✅ USE**: 
- **Vitest** (Vite-native, fast)
- **React Testing Library** (component testing)
- **MSW (Mock Service Worker)** (API mocking)
- **Playwright** (E2E, already using)

**Rationale**: Standard tools for unit, integration, E2E testing.

---

## 8. Data Flow Architecture

### 8.1 Command Flow (Write Operations)

```
User Action (Voice/Text/Camera)
    ↓
Presentation Layer (Component)
    ↓
Application Layer (Use Case)
    ↓
Domain Layer (Entity/Event)
    ↓
Infrastructure Layer (Repository/EventStore)
    ↓
Database (Firestore)
    ↓
Event Store (Firestore events collection)
    ↓
Real-time Sync → UI Update
```

**Example: Voice Accession**

```typescript
// Presentation/VoiceButton.tsx
function VoiceButton() {
  const accessionUseCase = useAccessionUseCase();
  
  const handleVoiceInput = async (transcription: string) => {
    // Delegate to use case
    const result = await accessionUseCase.execute({
      input: transcription,
      source: 'voice',
      user_id: getCurrentUserId(),
      timestamp: new Date()
    });
    
    // Use case returns pending action for confirmation
    showConfirmationCard(result.pendingAction);
  };
}

// Application/UseCases/AccessionUseCase.ts
class AccessionUseCase {
  constructor(
    private aiProvider: IAIProvider,
    private entityRepository: IEntityRepository,
    private eventStore: IEventStore,
    private speciesLibrary: ISpeciesLibrary,
    private enrichmentPipeline: EnrichmentPipeline
  ) {}
  
  async execute(command: AccessionCommand): Promise<AccessionResult> {
    // 1. Parse intent
    const intent = await this.aiProvider.parseIntent(command.input, this.getUserContext());
    
    // 2. Check species library
    const speciesRecord = await this.speciesLibrary.findByCommonName(
      intent.entities.find(e => e.type === 'species')?.value
    );
    
    // 3. Create pending action (non-blocking)
    const pendingAction = this.createPendingAction(intent, speciesRecord);
    
    // 4. Auto-enrich if new species (background, non-blocking)
    if (!speciesRecord) {
      this.enrichmentPipeline.enrichSpecies(intent.entities[0].value)
        .then(record => this.speciesLibrary.save(record))
        .catch(err => console.error('Enrichment failed', err));
    }
    
    return { pendingAction };
  }
}
```

### 8.2 Query Flow (Read Operations)

```
User Request (View Entity/List)
    ↓
Presentation Layer (Component)
    ↓
Application Layer (Query Handler)
    ↓
Infrastructure Layer (Repository)
    ↓
Cache (React Query/TanStack Query)
    ↓
Database (Firestore)
    ↓
UI Update
```

**Example: Entity List**

```typescript
// Presentation/EntityList.tsx
function EntityList() {
  const { data: entities, isLoading } = useEntitiesQuery();
  
  if (isLoading) return <Loading />;
  return <EntityGrid entities={entities} />;
}

// Application/Queries/useEntitiesQuery.ts
export function useEntitiesQuery() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: () => entityRepository.findAll(),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}
```

### 8.3 Enrichment Flow

```
Species Mentioned
    ↓
Check Species Library
    ↓ (cache hit)
Return Cached Data
    ↓ (cache miss)
Enrichment Pipeline
    ↓
Stage 1: Local Library
    ↓
Stage 2: GBIF
    ↓
Stage 3: Wikipedia
    ↓
Stage 4: iNaturalist
    ↓
Stage 5: AI Discovery (Gemini)
    ↓
Merge & Normalize
    ↓
Save to Species Library
    ↓
Update Entity
```

**Example: Enrichment Pipeline**

```typescript
// Domain/Enrichment/EnrichmentPipeline.ts
class EnrichmentPipeline {
  constructor(
    private localLibrary: ILocalLibrary,
    private gbifClient: IGBIFClient,
    private wikipediaClient: IWikipediaClient,
    private inaturalistClient: IiNaturalistClient,
    private aiProvider: IAIProvider
  ) {}
  
  async enrichSpecies(speciesName: string, morphVariant?: string): Promise<EnrichmentResult> {
    const stages: EnrichmentStage[] = [];
    
    // Stage 1: Local Library
    stages.push(await this.runStage('local_library', () =>
      this.localLibrary.find(speciesName, morphVariant)
    ));
    
    // Stage 2: GBIF
    stages.push(await this.runStage('gbif', () =>
      this.gbifClient.search(speciesName)
    ));
    
    // Stage 3: Wikipedia
    stages.push(await this.runStage('wikipedia', () =>
      this.wikipediaClient.search(speciesName)
    ));
    
    // Stage 4: iNaturalist
    stages.push(await this.runStage('inaturalist', () =>
      this.inaturalistClient.search(speciesName)
    ));
    
    // Stage 5: AI Discovery (critical - must succeed)
    stages.push(await this.runStage('ai_discovery', () =>
      this.aiProvider.generateDiscovery(speciesName, morphVariant)
    ));
    
    // Merge results
    const merged = this.mergeStages(stages);
    
    return {
      species_record: this.createSpeciesRecord(speciesName, morphVariant, merged),
      stages,
      status: this.determineStatus(stages)
    };
  }
  
  private async runStage(
    source: EnrichmentSource,
    fn: () => Promise<any>
  ): Promise<EnrichmentStage> {
    const start = Date.now();
    try {
      const data = await fn();
      return {
        source,
        status: 'complete',
        data,
        duration_ms: Date.now() - start
      };
    } catch (error) {
      return {
        source,
        status: 'failed',
        error: error.message,
        duration_ms: Date.now() - start
      };
    }
  }
}
```

---

## 9. Storage Architecture

### 9.1 Repository Pattern

```typescript
// Domain/Repositories/IEntityRepository.ts
interface IEntityRepository {
  findById(id: string): Promise<Entity | null>;
  findAll(): Promise<Entity[]>;
  findByHabitat(habitatId: string): Promise<Entity[]>;
  save(entity: Entity): Promise<void>;
  delete(id: string): Promise<void>;
}

// Infrastructure/Repositories/FirestoreEntityRepository.ts
class FirestoreEntityRepository implements IEntityRepository {
  constructor(
    private db: Firestore,
    private validator: ValidationPipeline
  ) {}
  
  async findById(id: string): Promise<Entity | null> {
    const doc = await this.db.collection('entities').doc(id).get();
    if (!doc.exists) return null;
    
    return this.validator.validateInput(doc.data(), EntitySchema);
  }
  
  async save(entity: Entity): Promise<void> {
    // Validate before save
    const validated = await this.validator.validateInput(entity, EntitySchema);
    
    // Save to Firestore
    await this.db.collection('entities').doc(entity.id).set({
      ...validated,
      updated_at: FieldValue.serverTimestamp()
    });
  }
}

// Infrastructure/Repositories/LocalStorageEntityRepository.ts
class LocalStorageEntityRepository implements IEntityRepository {
  // Offline fallback implementation
  async save(entity: Entity): Promise<void> {
    const entities = this.loadAll();
    entities[entity.id] = entity;
    localStorage.setItem('entities', JSON.stringify(entities));
  }
}
```

### 9.2 Event Store Implementation

```typescript
// Infrastructure/EventStore/FirestoreEventStore.ts
class FirestoreEventStore implements IEventStore {
  constructor(private db: Firestore) {}
  
  async append(event: DomainEvent): Promise<void> {
    await this.db.collection('events').add({
      ...event,
      timestamp: FieldValue.serverTimestamp()
    });
  }
  
  async getEvents(entityId: string): Promise<DomainEvent[]> {
    const snapshot = await this.db.collection('events')
      .where('entity_id', '==', entityId)
      .orderBy('metadata.timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as DomainEvent);
  }
  
  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    const snapshot = await this.db.collection('events')
      .where('metadata.timestamp', '>=', timestamp)
      .orderBy('metadata.timestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as DomainEvent);
  }
}
```

### 9.3 Species Library Storage

```typescript
// Infrastructure/SpeciesLibrary/FirestoreSpeciesLibrary.ts
class FirestoreSpeciesLibrary implements ISpeciesLibrary {
  constructor(
    private db: Firestore,
    private cache: Cache<SpeciesRecord> // In-memory cache
  ) {}
  
  async findByCommonName(name: string, morph?: string): Promise<SpeciesRecord | null> {
    // Check cache first
    const cacheKey = this.getCacheKey(name, morph);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Check Firestore
    const query = this.db.collection('species_library')
      .where('common_name', '==', name.toLowerCase());
    
    if (morph) {
      query.where('morph_variant', '==', morph);
    }
    
    const snapshot = await query.limit(1).get();
    
    if (snapshot.empty) return null;
    
    const record = snapshot.docs[0].data() as SpeciesRecord;
    this.cache.set(cacheKey, record);
    
    return record;
  }
  
  async save(record: SpeciesRecord): Promise<void> {
    const id = this.getId(record.scientific_name, record.morph_variant);
    
    await this.db.collection('species_library').doc(id).set({
      ...record,
      last_updated_at: FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update cache
    this.cache.set(this.getCacheKey(record.common_name, record.morph_variant), record);
  }
  
  async incrementAccess(id: string): Promise<void> {
    await this.db.collection('species_library').doc(id).update({
      access_count: FieldValue.increment(1)
    });
  }
}
```

---

## 10. Security Architecture

### 10.1 Authentication & Authorization

```typescript
// Infrastructure/Auth/AuthService.ts
interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  requireAuth(): Promise<User>;
  hasPermission(user: User, resource: string, action: string): boolean;
}

// Application/Middleware/AuthMiddleware.ts
class AuthMiddleware {
  constructor(private authService: IAuthService) {}
  
  async requireAuth(): Promise<User> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new UnauthorizedError();
    return user;
  }
}

// In use cases
class AccessionUseCase {
  async execute(command: AccessionCommand): Promise<AccessionResult> {
    // Require auth
    const user = await this.authMiddleware.requireAuth();
    command.user_id = user.id;
    
    // Continue with use case...
  }
}
```

### 10.2 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Entities collection - user-scoped
    match /entities/{entityId} {
      allow read: if isAuthenticated() && isOwner(resource.data.created_by);
      allow create: if isAuthenticated() && request.resource.data.created_by == request.auth.uid;
      allow update: if isAuthenticated() && isOwner(resource.data.created_by);
      allow delete: if isAuthenticated() && isOwner(resource.data.created_by);
    }
    
    // Events collection - user-scoped
    match /events/{eventId} {
      allow read: if isAuthenticated() && isOwner(resource.data.metadata.user_id);
      allow create: if isAuthenticated() && request.resource.data.metadata.user_id == request.auth.uid;
      // No update/delete - events are immutable
    }
    
    // Species library - read-only for all authenticated users, write by system only
    match /species_library/{speciesId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only server-side writes
    }
  }
}
```

### 10.3 API Key Management

```typescript
// Infrastructure/Secrets/SecretsManager.ts
interface ISecretsManager {
  getSecret(key: string): Promise<string>;
}

// Infrastructure/Secrets/EnvironmentSecretsManager.ts (dev)
class EnvironmentSecretsManager implements ISecretsManager {
  async getSecret(key: string): Promise<string> {
    const value = process.env[key];
    if (!value) throw new Error(`Secret ${key} not found`);
    return value;
  }
}

// Infrastructure/Secrets/FirebaseSecretsManager.ts (prod)
class FirebaseSecretsManager implements ISecretsManager {
  async getSecret(key: string): Promise<string> {
    // Use Firebase Functions config or Secret Manager
    return await functions.config().secrets[key];
  }
}

// In AI provider
class GeminiProvider {
  constructor(
    private secretsManager: ISecretsManager
  ) {}
  
  private async getApiKey(): Promise<string> {
    return await this.secretsManager.getSecret('GEMINI_API_KEY');
  }
}
```

### 10.4 Rate Limiting

```typescript
// Infrastructure/RateLimit/RateLimiter.ts
interface IRateLimiter {
  checkLimit(userId: string, operation: string): Promise<boolean>;
  recordUsage(userId: string, operation: string): Promise<void>;
}

// Infrastructure/RateLimit/FirestoreRateLimiter.ts
class FirestoreRateLimiter implements IRateLimiter {
  async checkLimit(userId: string, operation: string): Promise<boolean> {
    const key = `${userId}:${operation}`;
    const doc = await this.db.collection('rate_limits').doc(key).get();
    
    if (!doc.exists) return true;
    
    const data = doc.data();
    const windowStart = new Date(Date.now() - this.getWindowMs(operation));
    
    if (data.last_reset < windowStart) {
      // Reset window
      return true;
    }
    
    return data.count < this.getLimit(operation);
  }
  
  private getLimit(operation: string): number {
    const limits = {
      'parse_intent': 100, // 100 per hour
      'generate_discovery': 50, // 50 per hour
      'vision': 30, // 30 per hour
    };
    return limits[operation] ?? 10;
  }
}

// In use cases
class AccessionUseCase {
  async execute(command: AccessionCommand): Promise<AccessionResult> {
    // Check rate limit
    const allowed = await this.rateLimiter.checkLimit(command.user_id, 'parse_intent');
    if (!allowed) throw new RateLimitError();
    
    await this.rateLimiter.recordUsage(command.user_id, 'parse_intent');
    
    // Continue...
  }
}
```

---

## 11. Offline-First Architecture

### 11.1 Local Database Strategy

```typescript
// Infrastructure/Storage/LocalDatabase.ts
interface ILocalDatabase {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any | null>;
  delete(key: string): Promise<void>;
}

// Infrastructure/Storage/IndexedDBLocalDatabase.ts
class IndexedDBLocalDatabase implements ILocalDatabase {
  private db: IDBDatabase;
  
  async save(key: string, data: any): Promise<void> {
    const tx = this.db.transaction(['storage'], 'readwrite');
    await tx.objectStore('storage').put(data, key);
    await tx.complete;
  }
  
  async load(key: string): Promise<any | null> {
    const tx = this.db.transaction(['storage'], 'readonly');
    return await tx.objectStore('storage').get(key);
  }
}

// Application/Sync/SyncService.ts
class SyncService {
  constructor(
    private localRepo: IEntityRepository,
    private remoteRepo: IEntityRepository,
    private connectionService: IConnectionService
  ) {}
  
  async sync(): Promise<void> {
    if (!await this.connectionService.isOnline()) {
      // Offline - use local only
      return;
    }
    
    // Get local pending changes
    const pending = await this.localRepo.findPending();
    
    // Push to remote
    for (const entity of pending) {
      try {
        await this.remoteRepo.save(entity);
        await this.localRepo.markSynced(entity.id);
      } catch (error) {
        // Keep as pending for retry
      }
    }
    
    // Pull remote changes
    const remote = await this.remoteRepo.findSince(this.getLastSyncTime());
    for (const entity of remote) {
      await this.localRepo.save(entity);
    }
    
    this.updateLastSyncTime();
  }
}
```

### 11.2 Plant Database Bundling

```typescript
// Infrastructure/PlantLibrary/BundledPlantLibrary.ts
class BundledPlantLibrary implements ILocalLibrary {
  private data: PlantDatabase;
  
  constructor() {
    // Load bundled JSON at startup
    this.data = require('../data/plant-database.json');
  }
  
  async find(name: string, morph?: string): Promise<LocalLibraryData | null> {
    // Search bundled data (no network call)
    const normalized = name.toLowerCase();
    
    for (const plant of this.data.plants) {
      if (plant.common_name.toLowerCase() === normalized ||
          plant.aliases.some(a => a.toLowerCase() === normalized)) {
        return this.mapToLocalLibraryData(plant);
      }
    }
    
    return null;
  }
}

// Build script to bundle plant database
// scripts/bundle-plant-database.ts
async function bundlePlantDatabase() {
  const plants = await scrapeAquasabi();
  const json = JSON.stringify({ plants }, null, 2);
  await fs.writeFile('src/data/plant-database.json', json);
}
```

---

## 12. iOS App Store Considerations

### 12.1 Native App Architecture (Future)

**Current**: React web app  
**Future**: React Native OR Native iOS (SwiftUI)

**If React Native**:
- Reuse domain and application layers (TypeScript)
- Replace presentation layer with React Native components
- Infrastructure adapters for native APIs (camera, storage)

**If Native iOS**:
- Domain layer in Swift (port from TypeScript)
- Use SwiftUI for presentation
- Native networking, storage

### 12.2 Permissions

```typescript
// Infrastructure/Permissions/IPermissionService.ts
interface IPermissionService {
  requestCameraPermission(): Promise<boolean>;
  requestPhotoLibraryPermission(): Promise<boolean>;
  checkPermission(type: PermissionType): Promise<boolean>;
}

// Infrastructure/Permissions/WebPermissionService.ts (current)
class WebPermissionService implements IPermissionService {
  async requestCameraPermission(): Promise<boolean> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  }
}

// Infrastructure/Permissions/NativePermissionService.ts (future iOS)
class NativePermissionService implements IPermissionService {
  // Use native permission APIs
}
```

### 12.3 Background Tasks

```typescript
// Application/Background/BackgroundTaskService.ts
interface IBackgroundTaskService {
  scheduleEnrichment(speciesId: string): Promise<void>;
  scheduleSync(): Promise<void>;
}

// For iOS: Use Background Tasks API
// For Web: Use Service Workers (limited)
```

### 12.4 Image Compression

```typescript
// Infrastructure/Image/ImageCompressor.ts
interface IImageCompressor {
  compress(image: File, maxSizeKB: number): Promise<Blob>;
}

// Infrastructure/Image/BrowserImageCompressor.ts
class BrowserImageCompressor implements IImageCompressor {
  async compress(image: File, maxSizeKB: number): Promise<Blob> {
    // Use Canvas API to resize/compress
    // Target: < 500KB for uploads
  }
}
```

---

## 13. Observability & Monitoring

### 13.1 Logging

**✅ USE**: 
- **Winston** (Node.js) OR
- **Pino** (faster) OR
- **Structured logging** to Firestore

```typescript
// Infrastructure/Logging/Logger.ts
interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  warn(message: string, meta?: any): void;
}

// Infrastructure/Logging/FirestoreLogger.ts
class FirestoreLogger implements ILogger {
  async error(message: string, error?: Error, meta?: any): Promise<void> {
    await this.db.collection('logs').add({
      level: 'error',
      message,
      error: error?.stack,
      meta,
      timestamp: FieldValue.serverTimestamp(),
      user_id: this.getCurrentUserId()
    });
  }
}
```

### 13.2 Error Tracking

**✅ USE**: 
- **Sentry** (error tracking)
- **Firebase Crashlytics** (if using Firebase)

```typescript
// Infrastructure/ErrorTracking/ErrorTracker.ts
import * as Sentry from '@sentry/react';

class ErrorTracker {
  init() {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV
    });
  }
  
  captureException(error: Error, context?: any): void {
    Sentry.captureException(error, { extra: context });
  }
}
```

### 13.3 Analytics

**✅ USE**: 
- **Firebase Analytics** (if using Firebase) OR
- **PostHog** (open-source alternative) OR
- **Plausible** (privacy-focused)

```typescript
// Infrastructure/Analytics/Analytics.ts
interface IAnalytics {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
}

// Track key events
analytics.track('entity_accessioned', {
  species: 'Neon Tetra',
  habitat: 'The Shallows',
  source: 'voice'
});
```

---

## 14. Cost Control

### 14.1 AI Cost Monitoring

```typescript
// Infrastructure/Cost/CostTracker.ts
class CostTracker {
  async recordAICall(
    provider: string,
    model: string,
    tokens: { input: number; output: number },
    cost: number
  ): Promise<void> {
    await this.db.collection('ai_costs').add({
      provider,
      model,
      tokens,
      cost,
      user_id: this.getCurrentUserId(),
      timestamp: FieldValue.serverTimestamp()
    });
  }
  
  async getDailyCost(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await this.db.collection('ai_costs')
      .where('user_id', '==', userId)
      .where('timestamp', '>=', today)
      .get();
    
    return snapshot.docs.reduce((sum, doc) => sum + doc.data().cost, 0);
  }
}

// In AI provider
class GeminiProvider {
  async generateContent(...) {
    const start = Date.now();
    const response = await this.client.generateContent(...);
    const duration = Date.now() - start;
    
    // Estimate cost (tokens * price per token)
    const cost = this.estimateCost(response.usage);
    
    await this.costTracker.recordAICall('gemini', this.model, response.usage, cost);
    
    return response;
  }
}
```

### 14.2 Caching Strategy

```typescript
// Application/Cache/CacheStrategy.ts
class CacheStrategy {
  // Species library: Cache forever (rarely changes)
  speciesLibraryCache: Cache<SpeciesRecord> = new Cache({ ttl: Infinity });
  
  // Enrichment results: Cache for 24 hours
  enrichmentCache: Cache<EnrichmentData> = new Cache({ ttl: 1000 * 60 * 60 * 24 });
  
  // Intent parsing: No cache (user-specific context)
  // Vision: Cache for 1 hour (same image = same result)
  visionCache: Cache<PhotoAnalysisResult> = new Cache({ ttl: 1000 * 60 * 60 });
}
```

---

## 15. Testing Architecture

### 15.1 Unit Tests

```typescript
// Domain/Entities/Entity.test.ts
describe('Entity', () => {
  it('should infer type from traits', () => {
    const entity = new Entity({
      traits: [{ type: 'PHOTOSYNTHETIC' }]
    });
    expect(entity.type).toBe('ORGANISM'); // Or PLANT
  });
});

// Application/UseCases/AccessionUseCase.test.ts
describe('AccessionUseCase', () => {
  it('should create pending action from voice input', async () => {
    const mockAI = createMockAIProvider();
    const useCase = new AccessionUseCase(mockAI, ...);
    
    const result = await useCase.execute({
      input: 'I added 12 Neon Tetras to The Shallows',
      source: 'voice',
      user_id: 'user1',
      timestamp: new Date()
    });
    
    expect(result.pendingAction.intent).toBe('ACCESSION_ENTITY');
  });
});
```

### 15.2 Integration Tests

```typescript
// Application/Integration/EnrichmentPipeline.test.ts
describe('EnrichmentPipeline Integration', () => {
  it('should enrich species from all sources', async () => {
    const pipeline = createEnrichmentPipeline();
    
    const result = await pipeline.enrichSpecies('Cherry Shrimp');
    
    expect(result.stages).toHaveLength(5);
    expect(result.stages[0].source).toBe('local_library');
    expect(result.stages[4].source).toBe('ai_discovery');
    expect(result.status).toBe('complete');
  });
});
```

### 15.3 E2E Tests

```typescript
// E2E/voice-accession.spec.ts (Playwright)
test('voice accession flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="voice-button"]');
  await page.fill('[data-testid="voice-input"]', 'I added 12 Neon Tetras to The Shallows');
  await page.click('[data-testid="submit"]');
  
  await expect(page.locator('[data-testid="confirmation-card"]')).toBeVisible();
  await expect(page.locator('text=Neon Tetra')).toBeVisible();
  await expect(page.locator('text=12')).toBeVisible();
  
  await page.click('[data-testid="confirm"]');
  
  await expect(page.locator('[data-testid="entity-list"]')).toContainText('Neon Tetra');
});
```

---

## 16. Deployment Architecture

### 16.1 Frontend Deployment

**Current**: Vite dev server  
**Production**: 
- **Vercel** (recommended for React) OR
- **Netlify** OR
- **Firebase Hosting**

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 16.2 Backend Deployment

**Current**: Firebase Functions (partial)  
**Production Options**:

1. **Firebase Functions** (if staying with Firebase)
   - Serverless, auto-scaling
   - Good for AI proxy endpoints

2. **Vercel Serverless Functions** (if using Vercel)
   - Same platform as frontend
   - Simpler deployment

3. **Dedicated Backend** (Node.js/Express)
   - More control
   - Better for complex logic

**Recommendation**: Start with Firebase Functions for AI proxy, migrate to dedicated backend if needed.

### 16.3 Database

**Current**: Firestore  
**Production**: 
- **Firestore** (if staying with Firebase) OR
- **PostgreSQL** (if migrating to dedicated backend)

**Recommendation**: Firestore is fine for current scale. Consider PostgreSQL if:
- Need complex queries
- Need relational data
- Cost becomes issue

---

## 17. Migration Path from Current Architecture

### 17.1 Phase 1: Extract Services (Week 1)

1. Extract AI provider interface
2. Create repository interfaces
3. Move business logic to use cases
4. Keep existing store temporarily

### 17.2 Phase 2: Introduce DI (Week 2)

1. Set up dependency injection container
2. Refactor services to use DI
3. Update use cases to use DI
4. Remove direct instantiation

### 17.3 Phase 3: Split Store (Week 3)

1. Extract UI state to Zustand
2. Move business logic to use cases
3. Move data access to repositories
4. Remove monolithic store

### 17.4 Phase 4: Add Standard Tooling (Week 4)

1. Add React Query for server state
2. Add React Hook Form for forms
3. Add proper error tracking
4. Add rate limiting

### 17.5 Phase 5: Security & Production (Week 5)

1. Fix Firestore security rules
2. Add authentication middleware
3. Add cost tracking
4. Add monitoring

---

## 18. Summary: What to Build vs. Use

### ✅ USE (Standard Tooling)

- **State Management**: Zustand or Jotai
- **Server State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios or Ky
- **Dependency Injection**: TSyringe or InversifyJS
- **Testing**: Vitest, React Testing Library, Playwright
- **Error Tracking**: Sentry
- **Analytics**: Firebase Analytics or PostHog
- **Logging**: Winston or Pino
- **Caching**: React Query (built-in) + custom for species library

### 🔨 BUILD (Custom Domain Logic)

- **Domain Models**: Entity, Habitat, Organism, Trait (core business logic)
- **Enrichment Pipeline**: Multi-source aggregation logic
- **Species Library**: Caching and lookup logic
- **Event Sourcing**: Domain events and event store
- **Prompt Templates**: Domain-specific prompt management
- **AI Provider Adapters**: Abstraction over Gemini/OpenAI/Anthropic
- **Repository Implementations**: Firestore and localStorage adapters
- **Use Cases**: Application orchestration logic

### ⚠️ HYBRID (Custom + Library)

- **Schema Validation**: Zod (standard) + custom adapters for AI providers
- **Offline Sync**: Custom sync logic + IndexedDB (standard storage)
- **Rate Limiting**: Custom logic + Firestore (storage)

---

## 19. Key Architectural Principles

1. **Separation of Concerns**: Each layer has single responsibility
2. **Dependency Inversion**: Depend on abstractions, not implementations
3. **Single Source of Truth**: Zod schemas define structure, adapt to providers
4. **Non-Blocking UX**: Never prompt for missing data, use placeholders
5. **Provider Agnostic**: AI providers swappable via interface
6. **Offline First**: Local database + sync, not sync-first
7. **Event Sourcing**: All changes create events, entities derived
8. **Caching Strategy**: Species library cached forever, enrichment cached 24h
9. **Security First**: Auth required, user-scoped data, rate limiting
10. **Cost Conscious**: Track AI costs, cache aggressively, use fast models for latency

---

## 20. Next Steps

This ideal architecture should be:
1. **Reviewed** for alignment with goals
2. **Compared** to current implementation (PASS 3)
3. **Prioritized** for migration (PASS 8)
4. **Implemented** incrementally (don't rewrite everything at once)

**Key Questions for Validation**:
- Does this architecture support all CUJs from PASS 1?
- Are there any missing capabilities?
- Are the tooling choices appropriate?
- Is the migration path feasible?

---

**End of PASS 2: Ideal Architecture**
