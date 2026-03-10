export type BiomeTheme = 'default' | 'blackwater' | 'tanganyika' | 'paludarium' | 'marine';

export type ActionStatus = 'LISTENING' | 'ANALYZING' | 'CONFIRMING' | 'COMMITTING' | 'STRATEGY_REQUIRED' | 'ERROR';

export enum EventStatus {
  PENDING = 'pending',
  PARSED = 'parsed',
  SAVED_RAW = 'saved_raw',
  ERROR = 'error'
}

export enum EntityType {
  HABITAT = 'HABITAT',
  PLANT = 'PLANT',
  PLANT_GROUP = 'PLANT_GROUP',
  ORGANISM = 'ORGANISM',
  COLONY = 'COLONY'
}

export type EntityTrait = 
  | { type: 'AQUATIC'; parameters: { pH?: number; temp?: number; salinity?: 'fresh'|'brackish'|'marine'; nitrates?: number; ammonia?: number } }
  | { type: 'TERRESTRIAL'; parameters: { humidity?: number; substrate?: string; temp?: number } }
  | { type: 'PHOTOSYNTHETIC'; parameters: { 
      lightReq?: 'low'|'med'|'high'; 
      co2?: boolean; 
      growth_height?: number;
      growth_rate?: 'slow'|'medium'|'fast';
      difficulty?: 'easy'|'medium'|'hard'|'very_hard';
      placement?: 'foreground'|'midground'|'background'|'floating'|'epiphyte'; 
  } }
  | { type: 'INVERTEBRATE'; parameters: { molting?: boolean; colony?: boolean } }
  | { type: 'VERTEBRATE'; parameters: { diet?: 'carnivore'|'herbivore'|'omnivore' } }
  | { type: 'COLONY'; parameters: { estimatedCount?: number; stable?: boolean } };

// --- NEW ENRICHMENT TYPES (Milestone 1, Task 1.1) ---
export type EnrichmentSource = 'DIRECT_MATCH' | 'GENUS_FALLBACK' | 'NONE';

export interface Taxonomy {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

export interface TradeInfo {
  tradeName?: string;
  cultivar?: string;
  morph?: string;
  originRegion?: string;
}

export interface EnrichedData {
  source: EnrichmentSource;
  taxonomy?: Taxonomy;
  tradeInfo?: TradeInfo;
  description?: string; // Museum-style prose
  careGuide?: string; // Detailed care narrative
  funFacts?: string[];
  confidence: number;
  enrichedAt?: string;
}
// --- END NEW ENRICHMENT TYPES ---

export interface Entity {
  id: string;
  name: string;
  scientificName?: string;
  confidence: number;
  habitat_id?: string; // Relationship
  group_id?: string;
  type: EntityType;
  quantity?: number;
  
  // The "DNA" of the entity. A mix-and-match list of what this thing IS.
  traits: EntityTrait[]; 
  
  // Rich Details (New)
  details?: {
    description?: string;
    origin?: string;
    notes?: string;
    maintenance?: string;
  };
  delightfulSummary?: string;
  aweInspiringFacts?: {
    fact: string;
    source: string;
  }[];

  currentEchoUrl?: string; // New field for the latest Echo wireframe
  echoHistory?: string[]; // New field for storing historical Echoes

  enrichedData?: EnrichedData; // NEW: Structured enrichment data

  // Growth & Observation History
  observations?: Array<{
    timestamp: number;
    type: 'growth' | 'parameter' | 'note';
    label: string;
    value: number;
    unit?: string;
  }>;

  // Legacy/System fields
  created_at: number;
  updated_at: number;
  aliases: string[];
  enrichment_status: 'none' | 'queued' | 'pending' | 'complete' | 'failed';
  overflow?: Record<string, any>;
}

export interface EntityGroup {
  id: string;
  name: string;
  description?: string;
}

export interface Habitat {
  id: string;
  name: string;
  type: string; // e.g., 'aquarium', 'terrarium'
  biomeTheme: BiomeTheme; // For visual styling
  blueprintCoords?: HabitatOutline | null; // New field for Blueprint of Worlds
}

export interface PendingAction {
  status: ActionStatus;
  transcript: string;
  
  intent: 'ACCESSION_ENTITY' | 'LOG_OBSERVATION' | 'MODIFY_HABITAT' | 'QUERY' | null;
  
  // The Payload
  targetHabitatId?: string | null;
  targetHabitatName?: string; // For display/resolution
  
  // For ACCESSION_ENTITY
  candidates: Array<{
    commonName: string;
    scientificName?: string;
    quantity?: number;
    traits: EntityTrait[];
  }>;
  
  // For LOG_OBSERVATION
  observationNotes?: string;
  observationParams?: Record<string, number | string | boolean>; // New structured data
  
  // For MODIFY_HABITAT (Create/Update)
  habitatParams?: {
    name?: string;
    size?: number;
    unit?: string;
    type?: string;
    location?: string;
  };

  imageBase64?: string; // For photo-originated actions
  isBulk?: boolean; // For "All tanks" actions

  aiReasoning?: string;
  isAmbiguous?: boolean;
  intentStrategy?: {
    advice: string;
    suggestedCommand?: string;
    technicalSteps?: string[];
  };
}

export interface DomainEvent {
  eventId: string;
  type: string;
  timestamp: string;
  payload: any;
  metadata: {
    source: 'voice' | 'manual' | 'photo' | 'chat';
    originalTranscript?: string;
    enrichmentStatus: 'pending' | 'none' | 'complete';
  };
}

export interface AppEvent {
  id: string;
  timestamp: number;
  raw_input: string;
  status: EventStatus;
  domain_event?: DomainEvent;
  error_message?: string;
}

export interface RackContainer {
  id: string;
  shelf_level: 'top' | 'middle' | 'bottom' | 'unknown';
  horizontal_position: 'left' | 'center' | 'right' | 'unknown';
  size_estimate: string;
  primary_species: Array<{ common_name: string; scientific_name: string; confidence: number }>;
  plants: string[];
  equipment: string[];
  confidence: number;
}

export interface IdentifyResult {
  species: string;
  common_name: string;
  kingdom: string;
  confidence: number;
  reasoning: string;
}

export interface AdvisoryReport {
  strategy: string;
  implementation_steps: string[];
  impact_analysis: string;
  ide_prompt: string;
  persistence_status: 'SECURE' | 'AUDIT_FAILED';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSearch?: boolean;
  isThinking?: boolean;
  groundingLinks?: Array<{ title: string; uri: string }>;
}

export type ResearchStageStatus = 'waiting' | 'active' | 'complete' | 'error' | 'skipped';

export interface ResearchStage {
  name: 'library' | 'gbif' | 'wikipedia' | 'inaturalist' | 'discovery';
  label: string;
  status: ResearchStageStatus;
  error?: string;
}

export interface ResearchEntityProgress {
  entityId: string;
  entityName: string;
  stages: ResearchStage[];
  discoverySnippet?: string;  // first sentence of mechanism, for the reveal
}

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface ResearchProgress {
  isActive: boolean;
  totalEntities: number;
  completedEntities: number;
  currentEntityIndex: number;
  currentEntity: { id: string; name: string } | null;
  currentStage: ResearchStage['name'] | null;
  entityResults: ResearchEntityProgress[];
  discoveries: Array<{ entityId: string; entityName: string; mechanism: string }>;
}
