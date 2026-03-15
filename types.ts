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
  FISH = 'FISH',
  INVERTEBRATE = 'INVERTEBRATE',
  CORAL = 'CORAL',
  OTHER = 'OTHER'
}

export type EnrichmentSource = 'FULL_MATCH' | 'GENUS_FALLBACK' | 'AI_INFERRED';

// --- MIRRORING ORGANISM ATLAS SCHEMA 1:1 ---

export interface CareParameter {
  min: number;
  max: number;
  unit: string;
  ideal?: number;
  notes?: string;
}

export interface CareGuide {
  difficulty: 'beginner' | 'easy' | 'moderate' | 'advanced' | 'expert';
  lightRequirement: string;
  temperature: CareParameter;
  pH: CareParameter;
  hardness?: CareParameter;
  co2Required: boolean;
  co2Benefit: string;
  substrate: string;
  growthRate: 'slow' | 'moderate' | 'fast' | 'variable';
  maxHeight?: CareParameter;
  propagation: string[];
  placement: string;
  trimming: string;
  commonIssues: string[];
  tips: string[];
}

export interface Taxonomy {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  subspecies?: string;
  cultivar?: string;
  commonNames: string[];
  synonyms: string[];
}

export interface TradeInfo {
  availability: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'unknown';
  priceRange?: string;
  popularityTrend?: 'rising' | 'stable' | 'declining' | 'unknown';
  tradeNames: string[];
  firstIntroducedYear?: number;
  originRegion: string;
  naturalHabitat: string;
}

export interface EnrichedData {
  taxonomy: Taxonomy;
  tradeInfo: TradeInfo;
  careGuide: CareGuide;
  description: string;
  funFacts: string[];
  ecologicalRole: string;
  source: EnrichmentSource;
  confidence: number;
  sourcesUsed: string[];
  enrichedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  scientificName?: string;
  type: EntityType;
  group_id?: string;
  habitat_id?: string; // Legacy support
  aliases: string[];
  created_at: number;
  updated_at: number;
  confidence: number;
  enrichment_status: 'none' | 'queued' | 'pending' | 'complete' | 'failed';
  enrichedData?: EnrichedData;
  currentEchoUrl?: string; // High-res photo URL
  delightfulSummary?: string;
  quantity?: number;
  traits: Array<{
    type: string;
    parameters?: Record<string, any>;
  }>;
  observations: Array<{
    id: string;
    timestamp: number;
    label: string;
    value: number;
    unit: string;
    note?: string;
  }>;
  overflow?: any;
}

export interface EntityGroup {
  id: string;
  name: string;
  type: string;
  created_at: number;
}

export interface PendingAction {
  id: string;
  type: 'ADD_ENTITY' | 'REMOVE_ENTITY' | 'UPDATE_PARAMETER' | 'LOG_EVENT' | 'RESEARCH_SPECIES' | 'SYSTEM_COMMAND';
  status: ActionStatus;
  payload: any;
  context?: string;
  confidence: number;
}

export interface ResearchProgress {
  isActive: boolean;
  totalEntities: number;
  completedEntities: number;
  currentEntityIndex: number;
  currentEntity: { id: string; name: string } | null;
  discoveries: Array<{ entityId: string; entityName: string; mechanism: string }>;
}
