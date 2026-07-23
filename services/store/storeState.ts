import { AppEvent, Entity, EntityGroup, PendingAction, ChatMessage, ResearchProgress, User } from '../../types';
import { STORAGE_KEYS } from '../../src/constants';
import { safeStorage } from '../../src/utils/storage';

export interface IConservatoryState {
  events: AppEvent[];
  entities: Entity[];
  groups: EntityGroup[];
  messages: ChatMessage[];
  pendingAction: PendingAction | null;
  user: User | null;
  liveTranscript: string;
  activeHabitatId: string | null;
  isTestMode: boolean;
  researchProgress: ResearchProgress;
  loadLocal(): void;
  persistLocal(): void;
}

export class ConservatoryState implements IConservatoryState {
  events: AppEvent[] = [];
  entities: Entity[] = [];
  groups: EntityGroup[] = [];
  messages: ChatMessage[] = [];
  pendingAction: PendingAction | null = null;
  user: User | null = null;
  liveTranscript: string = '';
  activeHabitatId: string | null = null;
  isTestMode: boolean = false;
  researchProgress: ResearchProgress = {
    isActive: false,
    totalEntities: 0,
    completedEntities: 0,
    currentEntityIndex: -1,
    currentEntity: null,
    currentStage: null,
    entityResults: [],
    discoveries: []
  };

  constructor() {
    this.loadLocal();
  }

  loadLocal() {
    this.events = safeStorage.getItem(STORAGE_KEYS.EVENTS, []);
    this.entities = safeStorage.getItem(STORAGE_KEYS.ENTITIES, []);
    this.groups = safeStorage.getItem(STORAGE_KEYS.GROUPS, []);
    this.messages = safeStorage.getItem(STORAGE_KEYS.MESSAGES, []);
    this.activeHabitatId = localStorage.getItem(STORAGE_KEYS.HABITAT_ID);
  }

  persistLocal() {
    safeStorage.setItem(STORAGE_KEYS.EVENTS, this.events);
    safeStorage.setItem(STORAGE_KEYS.ENTITIES, this.entities);
    safeStorage.setItem(STORAGE_KEYS.GROUPS, this.groups);
    safeStorage.setItem(STORAGE_KEYS.MESSAGES, this.messages);
    if (this.activeHabitatId) {
      localStorage.setItem(STORAGE_KEYS.HABITAT_ID, this.activeHabitatId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.HABITAT_ID);
    }
  }
}
