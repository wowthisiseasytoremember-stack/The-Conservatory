
export const STORAGE_KEYS = {
  EVENTS: 'conservatory_events',
  ENTITIES: 'conservatory_entities',
  GROUPS: 'conservatory_groups',
  MESSAGES: 'conservatory_messages',
  HABITAT_ID: 'conservatory_active_habitat',
  BIOME_THEME: 'conservatory_biome_theme'
};

export const ECOSYSTEM_THRESHOLDS = {
  BIODIVERSITY_BONUS_MAX: 40,
  BIODIVERSITY_SPECIES_VALUE: 5,
  PH_STABILITY_MAX: 40,
  PH_PENALTY_MULTIPLIER: 10,
  RECENCY_PENALTY_DAYS: {
    FULL: 1, // day
    HIGH: 7,
    MEDIUM: 30
  },
  HEALTH_RECENCY_SCORE: {
    NEW: 20,
    RECENT: 15,
    STALE: 10,
    OLD: 5
  },
  PH_COMPATIBILITY_THRESHOLD: 1.5,
  TEMP_COMPATIBILITY_THRESHOLD: 10,
  TREND_PH_STABILITY: 0.1,
  TREND_TEMP_STABILITY: 1.0,
  TREND_DEFAULT_STABILITY: 0.5
};

export const Z_INDEX = {
  MODAL_BACKDROP: 70,
  TRANSCRIPT_OVERLAY: 60,
  VOICE_CTA: 50,
  TOAST: 100
};

export const TIME = {
  MS_IN_DAY: 1000 * 60 * 60 * 24,
  AI_TIMEOUT: 45000
};
