
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppEvent, Entity, DomainEvent, EntityGroup, PendingAction, EntityType, EventStatus, ChatMessage,
  IdentifyResult, ResearchProgress, ResearchStage, ResearchEntityProgress, BiomeTheme 
} from '../types';
import { geminiService } from './geminiService';
import { 
  db, auth, collection, addDoc, doc, getDoc, getDocs, setDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, signInWithPopup, signOut, 
  onAuthStateChanged, googleProvider, User, writeBatch
} from './firebase';

import { connectionService, ConnectionStatus } from './connectionService';
import { mockFirestore } from './MockFirestoreService';
import { logger, logEnrichment, logFirestore, logAICall } from './logger';

class ConservatoryStore {
  private events: AppEvent[] = [];
  private entities: Entity[] = [];
  private groups: EntityGroup[] = [];
  private messages: ChatMessage[] = [];
  private pendingAction: PendingAction | null = null;
  private user: User | null = null;
  private liveTranscript: string = '';
  private listeners: (() => void)[] = [];
  private unsubscribes: (() => void)[] = [];

  private activeHabitatId: string | null = null;
  private _isTestMode: boolean = false;

  // Deep Research Pipeline State
  private _researchProgress: ResearchProgress = {
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
    this.initAuth();
    
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.setTestUser = (user: User, useRealBackend = false) => {
        logger.debug({ testMode: true, useRealBackend }, "Setting test user");
        // Prevent Firebase auth from overwriting test user
        this._isTestMode = true;
        this.clearSync();
        this.user = user;
        // Mark test mode to skip Firestore writes ONLY if not using real backend
        (window as any).__TEST_MODE__ = !useRealBackend;
        this.notify();
      };
      
      // Expose processVoiceInput for E2E tests
      // @ts-ignore
      window.processVoiceInput = (text: string) => this.processVoiceInput(text);
      
      // Expose store instance for E2E tests
      // @ts-ignore
      window.__conservatoryStore = this;
    }
  }

  private initAuth() {
    onAuthStateChanged(auth, (user) => {
      // In test mode, never let Firebase auth override the test user
      if (this._isTestMode) return;
      this.user = user;
      if (user) {
        this.initFirestoreSync();
      } else {
        this.clearSync();
      }
      this.notify();
    });
  }

  private clearSync() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }

  async login() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      logger.error({ err: e }, "Login failed");
      throw e;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.clearSync();
    } catch (e) {
      logger.error({ err: e }, "Logout failed");
    }
  }

  // TEST UTILITY: Clears all data from Firestore
  async clearDatabase() {
    logger.warn("Clearing database");
    const batch = writeBatch(db);
    
    // Clear Events
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    eventsSnapshot.forEach((doc) => batch.delete(doc.ref));

    // Clear Entities
    const entitiesSnapshot = await getDocs(collection(db, 'entities'));
    entitiesSnapshot.forEach((doc) => batch.delete(doc.ref));

    // Clear Groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    groupsSnapshot.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
    logger.info("Database cleared");
    
    this.events = [];
    this.entities = [];
    this.groups = [];
    this.persistLocal();
  }

  private loadLocal() {
    try {
        const savedEvents = localStorage.getItem('conservatory_events');
        const savedEntities = localStorage.getItem('conservatory_entities');
        const savedGroups = localStorage.getItem('conservatory_groups');
        const savedMessages = localStorage.getItem('conservatory_messages');
        
        if (savedEvents) this.events = JSON.parse(savedEvents);
        if (savedEntities) this.entities = JSON.parse(savedEntities);
        if (savedGroups) this.groups = JSON.parse(savedGroups);
        if (savedMessages) this.messages = JSON.parse(savedMessages);
    } catch (e) {
        logger.warn("Local storage corrupted, starting fresh");
    }
  }

  private persistLocal() {
    try {
        localStorage.setItem('conservatory_events', JSON.stringify(this.events));
        localStorage.setItem('conservatory_entities', JSON.stringify(this.entities));
        localStorage.setItem('conservatory_groups', JSON.stringify(this.groups));
        localStorage.setItem('conservatory_messages', JSON.stringify(this.messages));
        this.notify();
    } catch (e) {
        logger.error({ err: e }, "LocalStorage write failed");
    }
  }

  private initFirestoreSync() {
    this.clearSync();

    try {
      // 1. Sync Events
      const qEvents = query(collection(db, 'events'), orderBy('timestamp', 'desc'), limit(100));
      const unsubEvents = onSnapshot(qEvents, (snapshot) => {
        const cloudEvents: AppEvent[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now();
          cloudEvents.push({
            id: doc.id,
            timestamp: ts,
            raw_input: data.metadata?.originalTranscript || 'Manual Entry',
            status: EventStatus.PARSED,
            domain_event: {
              eventId: doc.id,
              type: data.type,
              timestamp: new Date(ts).toISOString(),
              payload: data.payload,
              metadata: data.metadata
            }
          });
        });
        
        const localPending = this.events.filter(e => e.status === EventStatus.PENDING || e.status === EventStatus.ERROR);
        this.events = [...localPending, ...cloudEvents];
        this.persistLocal();
      });

      // 2. Sync Entities
      const qEntities = query(collection(db, 'entities'), orderBy('updated_at', 'desc'));
      const unsubEntities = onSnapshot(qEntities, (snapshot) => {
        const cloudEntities: Entity[] = [];
        snapshot.forEach((doc) => {
          cloudEntities.push({ id: doc.id, ...doc.data() } as Entity);
        });
        this.entities = cloudEntities;
        this.persistLocal();
      });

      // 3. Sync Groups
      const qGroups = query(collection(db, 'groups'), orderBy('name', 'asc'));
      const unsubGroups = onSnapshot(qGroups, (snapshot) => {
        const cloudGroups: EntityGroup[] = [];
        snapshot.forEach((doc) => {
          cloudGroups.push({ id: doc.id, ...doc.data() } as EntityGroup);
        });
        this.groups = cloudGroups;
        this.persistLocal();
      });

      this.unsubscribes.push(unsubEvents, unsubEntities, unsubGroups);
    } catch (e) {
        logFirestore('error', "Failed to init Firestore sync", { error: e });
    }
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getEvents() { return [...this.events]; }
  getActiveHabitatId() { return this.activeHabitatId; }

  setActiveHabitat(id: string | null) {
    this.activeHabitatId = id;
    this.persistLocal();
  }

  getEntities() { return this.entities; }
  getGroups() { return [...this.groups]; }
  getMessages() { return [...this.messages]; }
  getPendingAction() { return this.pendingAction ? { ...this.pendingAction } : null; }
  getLiveTranscript() { return this.liveTranscript; }

  setLiveTranscript(text: string) {
    this.liveTranscript = text;
    this.notify();
  }

  getUser() { return this.user; }

  /**
   * Get all inhabitants (organisms, plants, colonies) in a habitat
   */
  getHabitatInhabitants(habitatId: string): Entity[] {
    return this.entities.filter(e => 
      e.habitat_id === habitatId && 
      (e.type === EntityType.ORGANISM || e.type === EntityType.PLANT || e.type === EntityType.COLONY)
    );
  }

  /**
   * Get the habitat that an entity belongs to
   */
  getEntityHabitat(entityId: string): Entity | null {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || !entity.habitat_id) return null;
    return this.entities.find(e => e.id === entity.habitat_id && e.type === EntityType.HABITAT) || null;
  }

  /**
   * Get all entities related to a given entity (tankmates, habitat, etc.)
   */
  getRelatedEntities(entityId: string): { habitat: Entity | null; tankmates: Entity[] } {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || !entity.habitat_id) {
      return { habitat: null, tankmates: [] };
    }
    
    const habitat = this.entities.find(e => e.id === entity.habitat_id && e.type === EntityType.HABITAT) || null;
    const tankmates = this.entities.filter(e => 
      e.habitat_id === entity.habitat_id && 
      e.id !== entityId &&
      (e.type === EntityType.ORGANISM || e.type === EntityType.PLANT || e.type === EntityType.COLONY)
    );
    
    return { habitat, tankmates };
  }

  /**
   * Calculate growth rate from observations
   */
  calculateGrowthRate(entityId: string, metric: string = 'growth'): { rate: number; trend: 'increasing' | 'decreasing' | 'stable'; dataPoints: number } | null {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || !entity.observations || entity.observations.length < 2) return null;

    const relevantObs = entity.observations
      .filter(o => o.label === metric && o.type === 'growth')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (relevantObs.length < 2) return null;

    const first = relevantObs[0];
    const last = relevantObs[relevantObs.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24); // days
    const valueDiff = last.value - first.value;
    const rate = timeDiff > 0 ? valueDiff / timeDiff : 0; // per day

    // Determine trend (simple: compare last 2 points)
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (relevantObs.length >= 2) {
      const recent = relevantObs.slice(-2);
      const diff = recent[1].value - recent[0].value;
      if (Math.abs(diff) < 0.01) trend = 'stable';
      else if (diff > 0) trend = 'increasing';
      else trend = 'decreasing';
    }

    return { rate, trend, dataPoints: relevantObs.length };
  }

  /**
   * Get growth timeline for an entity
   */
  getGrowthTimeline(entityId: string, metric: string = 'growth'): Array<{ timestamp: number; value: number; label: string; unit?: string }> {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || !entity.observations) return [];

    return entity.observations
      .filter(o => o.label === metric)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(o => ({
        timestamp: o.timestamp,
        value: o.value,
        label: o.label,
        unit: o.unit
      }));
  }

  /**
   * Compute synergies for all entities in a habitat
   * Aggregates synergy notes from enriched entities
   */
  computeHabitatSynergies(habitatId: string): Array<{ entityId: string; entityName: string; synergyNote: string }> {
    const inhabitants = this.getHabitatInhabitants(habitatId);
    
    return inhabitants
      .filter(e => e.enrichment_status === 'complete' && e.overflow?.discovery?.synergyNote)
      .map(e => ({
        entityId: e.id,
        entityName: e.name,
        synergyNote: e.overflow.discovery.synergyNote
      }));
  }

  /**
   * Get featured specimen (for Featured Specimen Card)
   * Uses date-based rotation for daily featured entity
   */
  getFeaturedSpecimen(): Entity | null {
    const eligible = this.entities.filter(e => 
      e.type !== EntityType.HABITAT && 
      e.enrichment_status === 'complete' &&
      (e.overflow?.discovery?.mechanism || e.overflow?.images?.[0])
    );
    
    if (eligible.length === 0) return null;
    
    // Date-based rotation (same as FeaturedSpecimenCard logic)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % eligible.length;
    
    return eligible[index];
  }

  /**
   * Calculate habitat health score (0-100)
   * Based on: parameter stability, biodiversity, observation recency
   */
  getHabitatHealth(habitatId: string): { score: number; factors: { stability: number; biodiversity: number; recency: number } } {
    const habitat = this.entities.find(e => e.id === habitatId && e.type === EntityType.HABITAT);
    if (!habitat) return { score: 0, factors: { stability: 0, biodiversity: 0, recency: 0 } };

    const inhabitants = this.getHabitatInhabitants(habitatId);
    
    // Biodiversity score (0-40 points): More species = better
    const uniqueSpecies = new Set(inhabitants.map(e => e.name)).size;
    const biodiversity = Math.min(40, uniqueSpecies * 5); // Max 8 species = 40 points
    
    // Stability score (0-40 points): Based on recent observations
    // For now, assume stable if habitat has been updated recently
    const daysSinceUpdate = (Date.now() - (habitat.updated_at || habitat.created_at)) / (1000 * 60 * 60 * 24);
    const stability = daysSinceUpdate < 7 ? 40 : daysSinceUpdate < 30 ? 30 : 20;
    
    // Recency score (0-20 points): Recent observations = active monitoring
    const recentEvents = this.events.filter(e => {
      const domainEvent = e.domain_event;
      if (!domainEvent) return false;
      const eventHabitatId = domainEvent.payload?.targetHabitatId || 
        (domainEvent.payload?.targetHabitatName && 
         this.entities.find(ent => ent.name === domainEvent.payload.targetHabitatName)?.id);
      return eventHabitatId === habitatId;
    });
    const daysSinceLastEvent = recentEvents.length > 0 
      ? (Date.now() - recentEvents[0].timestamp) / (1000 * 60 * 60 * 24)
      : 999;
    const recency = daysSinceLastEvent < 1 ? 20 : daysSinceLastEvent < 7 ? 15 : daysSinceLastEvent < 30 ? 10 : 0;
    
    const score = Math.round(biodiversity + stability + recency);
    
    return {
      score: Math.min(100, score),
      factors: { stability, biodiversity, recency }
    };
  }

  /**
   * Get ecosystem facts for ambient ticker
   * Extracts interesting facts from enriched entities
   */
  getEcosystemFacts(limit: number = 5): string[] {
    const enriched = this.entities.filter(e => 
      e.enrichment_status === 'complete' && 
      e.overflow?.discovery?.mechanism
    );
    
    return enriched
      .slice(0, limit)
      .map(e => {
        const mechanism = e.overflow.discovery.mechanism;
        const firstSentence = mechanism.split('.')[0];
        return `${e.name}: ${firstSentence}`;
      });
  }

  /**
   * Generates a holistic snapshot of a habitat and its inhabitants
   */
  async generateHabitatSnapshot(habitatId: string) {
    const habitat = this.entities.find(e => e.id === habitatId && e.type === EntityType.HABITAT);
    if (!habitat) return null;

    const inhabitants = this.getHabitatInhabitants(habitatId);
    
    // Enrich inhabitants with their full library data if available
    const enrichedInhabitants = inhabitants.map(entity => {
      // In a real app, we'd look up the library data here
      // For now, we use the entity's existing details/traits
      return {
        id: entity.id,
        name: entity.name,
        scientificName: entity.scientificName,
        type: entity.type,
        traits: entity.traits,
        details: entity.details,
        discovery: (entity as any).discovery
      };
    });

    return {
      habitat: {
        id: habitat.id,
        name: habitat.name,
        params: habitat.traits.find(t => t.type === 'AQUATIC' || t.type === 'TERRESTRIAL')
      },
      inhabitants: enrichedInhabitants
    };
  }

  public get activeBiomeTheme(): BiomeTheme {
    if (!this.activeHabitatId) return 'default';
    const habitat = this.entities.find(e => e.id === this.activeHabitatId);
    if (!habitat) return 'default';

    const type = (habitat as any).details?.type?.toLowerCase() || '';
    const name = habitat.name.toLowerCase();

    if (name.includes('blackwater')) return 'blackwater';
    if (name.includes('tanganyika') || name.includes('malawi')) return 'tanganyika';
    if (type.includes('marine') || type.includes('reef') || name.includes('ocean')) return 'marine';
    if (type.includes('paludarium') || type.includes('terrarium') || type.includes('vivarium')) return 'paludarium';
    
    return 'default';
  }

  resolveEntity<T extends { id: string; name: string; aliases?: string[] }>(
    userInput: string,
    candidates: T[]
  ): { match: T | null; isAmbiguous: boolean } {
    if (!userInput) return { match: null, isAmbiguous: false };
    const normalizedInput = userInput.toLowerCase().trim();
    
    const exact = candidates.filter(c => 
      c.name.toLowerCase() === normalizedInput || 
      c.aliases?.some(a => a.toLowerCase() === normalizedInput)
    );
    if (exact.length === 1) return { match: exact[0], isAmbiguous: false };
    if (exact.length > 1) return { match: null, isAmbiguous: true };

    const partial = candidates.filter(c => 
      c.name.toLowerCase().includes(normalizedInput) ||
      c.aliases?.some(a => a.toLowerCase().includes(normalizedInput))
    );
    if (partial.length === 1) return { match: partial[0], isAmbiguous: false };
    if (partial.length > 1) return { match: null, isAmbiguous: true };

    return { match: null, isAmbiguous: false };
  }

  updateSlot(path: string, value: any) {
    if (!this.pendingAction) return;
    const newPending = JSON.parse(JSON.stringify(this.pendingAction)); 
    const parts = path.split('.');
    let current: any = newPending;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}; 
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    this.pendingAction = newPending;
    this.persistLocal();
  }

  async processVoiceInput(text: string) {
    // Conversational Loop: If we are waiting for strategy confirmation
    if (this.pendingAction?.status === 'STRATEGY_REQUIRED' && this.pendingAction.intentStrategy) {
      const lowerText = text.toLowerCase().trim();
      const isYes = ['yes', 'correct', 'yeah', 'yep', 'do it', 'sure'].some(w => lowerText.includes(w));
      const isNo = ['no', 'nope', 'incorrect', 'wrong', 'wait'].some(w => lowerText.includes(w));

      if (isYes && this.pendingAction.intentStrategy.suggestedCommand) {
        const cmd = this.pendingAction.intentStrategy.suggestedCommand;
        this.pendingAction = null; // Clear strategy and re-process as the suggested command
        return this.processVoiceInput(cmd);
      } else if (isNo) {
        this.pendingAction = {
          ...this.pendingAction,
          status: 'ANALYZING',
          aiReasoning: "Understood. Please tell me more specifically what you'd like to do."
        };
        this.notify();
        return;
      }
    }

    this.pendingAction = {
      status: 'ANALYZING',
      transcript: text,
      intent: null,
      candidates: [],
      aiReasoning: "Processing...",
      isAmbiguous: false
    };
    this.notify();

    try {
      const currentEntities = [...this.entities]; 
      
      // Test Hook for Stability
      const result = (window as any).mockGeminiParse 
        ? await (window as any).mockGeminiParse(text, currentEntities)
        : await geminiService.parseVoiceCommand(text, currentEntities);
      
      // Intent Sovereignty: If the parser is unsure, call the Strategy Agent
      if (!result.intent || result.isAmbiguous) {
        const strategy = (window as any).mockGeminiStrategy
          ? await (window as any).mockGeminiStrategy(text)
          : await geminiService.getIntentStrategy(text, { 
              entities: currentEntities.map(e => ({ name: e.name, type: e.type })) 
            });
        
        this.pendingAction = {
          status: 'STRATEGY_REQUIRED',
          transcript: text,
          intent: result.intent,
          intentStrategy: strategy,
          aiReasoning: result.aiReasoning || "Input is complex or ambiguous.",
          candidates: []
        };
        this.persistLocal();
        return;
      }

      const habitatResolution = result.targetHabitatName 
        ? this.resolveEntity(result.targetHabitatName, currentEntities)
        : { match: null, isAmbiguous: false };
      
      this.pendingAction = {
        status: 'CONFIRMING',
        transcript: text,
        intent: result.intent,
        targetHabitatId: habitatResolution.match?.id || null,
        targetHabitatName: result.targetHabitatName,
        candidates: result.candidates || [],
        habitatParams: result.habitatParams,
        observationNotes: result.observationNotes,
        observationParams: result.observationParams,
        aiReasoning: result.aiReasoning,
        isAmbiguous: result.isAmbiguous || habitatResolution.isAmbiguous
      };
      
      this.persistLocal();
    } catch (e: any) {
      logAICall('error', "AI payload validation/parsing error", { error: e });
      this.pendingAction = {
        status: 'ERROR',
        transcript: text,
        intent: null,
        aiReasoning: `Data Integrity Error: ${e.message}. The AI sent an unexpected response format.`,
        candidates: []
      };
      this.persistLocal();
    }
  }

  private cleanDataObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(v => this.cleanDataObject(v));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .map(([k, v]) => [k, v === undefined ? null : this.cleanDataObject(v)])
      );
    }
    return obj === undefined ? null : obj;
  }

  async commitPendingAction() {
    if (!this.pendingAction) return;
    
    this.pendingAction.status = 'COMMITTING';
    this.notify();

    const intent = this.pendingAction.intent || 'LOG_OBSERVATION';
    const eventType = intent === 'ACCESSION_ENTITY' ? 'ENTITY_ACCESSIONED' : 
                      intent === 'MODIFY_HABITAT' ? 'MODIFY_HABITAT' : 'OBSERVATION_LOGGED';

    const safePayload = JSON.parse(JSON.stringify(this.pendingAction));
    delete safePayload.status;
    delete safePayload.isAmbiguous;

    const tempId = uuidv4();
    const domainEvent: DomainEvent = {
      eventId: tempId,
      type: eventType,
      timestamp: new Date().toISOString(),
      payload: safePayload,
      metadata: {
        source: 'voice',
        originalTranscript: this.pendingAction.transcript,
        enrichmentStatus: 'pending'
      }
    };

    const appEvent: AppEvent = {
      id: tempId,
      timestamp: Date.now(),
      raw_input: this.pendingAction.transcript,
      status: EventStatus.PENDING, 
      domain_event: domainEvent
    };

    this.events.unshift(appEvent);
    this.pendingAction = null;
    this.persistLocal();

    const isTestMode = (window as any).__TEST_MODE__;
    const batch = writeBatch(db);

    try {
      if (!isTestMode) {
        const eventRef = doc(collection(db, 'events'));
        batch.set(eventRef, this.cleanDataObject({
          type: eventType,
          timestamp: serverTimestamp(),
          payload: safePayload,
          metadata: domainEvent.metadata
        }));
      } else {
        mockFirestore.addDoc('events', this.cleanDataObject({
          type: eventType,
          timestamp: Date.now(),
          payload: safePayload,
          metadata: domainEvent.metadata
        }));
      }

      const newEntityIds: string[] = [];

      if (intent === 'MODIFY_HABITAT') {
        const habitatName = safePayload.habitatParams?.name || `New Habitat`;
        const normalizedName = habitatName.toLowerCase().trim();
        const existing = this.entities.find(e => 
          e.type === EntityType.HABITAT && 
          e.name.toLowerCase().trim() === normalizedName
        );

        if (!existing) {
          const id = uuidv4();
          const { name: _n, type: _t, ...otherHabitatParams } = safePayload.habitatParams || {};
          const habitatData: any = this.cleanDataObject({
            name: habitatName,
            type: EntityType.HABITAT,
            aliases: [],
            traits: [{ type: 'AQUATIC', parameters: { salinity: safePayload.habitatParams?.type === 'Saltwater' ? 'marine' : 'fresh' } }],
            confidence: 1,
            enrichment_status: 'none',
            created_at: Date.now(),
            updated_at: Date.now(),
            overflow: otherHabitatParams
          });
          
          // Optimistic Update
          this.entities.push({ id, ...habitatData });
          if (!isTestMode) {
            batch.set(doc(db, 'entities', id), habitatData);
          } else {
            mockFirestore.setDoc('entities', id, habitatData);
          }
        }
      } else if (intent === 'ACCESSION_ENTITY') {
        const targetHabitatId = safePayload.targetHabitatId || 
          this.entities.find(e => e.type === EntityType.HABITAT && e.name.toLowerCase().trim() === (safePayload.targetHabitatName || '').toLowerCase().trim())?.id;

        for (const cand of safePayload.candidates || []) {
          const normalizedName = cand.commonName.toLowerCase().trim();
          const existing = this.entities.find(e => 
            e.habitat_id === targetHabitatId &&
            e.name.toLowerCase().trim() === normalizedName
          );

          if (existing) continue;

          const id = uuidv4();
          newEntityIds.push(id);
          let type = EntityType.ORGANISM;
          if (cand.traits?.some((t: any) => t.type === 'PHOTOSYNTHETIC')) type = EntityType.PLANT;
          if (cand.traits?.some((t: any) => t.type === 'COLONY')) type = EntityType.COLONY;

          const { commonName, scientificName, quantity, traits, ...otherCandidateProps } = cand;
          const entityData: any = this.cleanDataObject({
            name: cand.commonName,
            scientificName: cand.scientificName, 
            habitat_id: targetHabitatId,
            traits: cand.traits || [],
            type,
            quantity: cand.quantity,
            confidence: 0.9,
            aliases: [],
            enrichment_status: 'queued',
            created_at: Date.now(),
            updated_at: Date.now(),
            overflow: otherCandidateProps
          });

          // Optimistic Update
          this.entities.push({ id, ...entityData });
          if (!isTestMode) {
            batch.set(doc(db, 'entities', id), entityData);
          } else {
            mockFirestore.setDoc('entities', id, entityData);
          }
        }
      } else if (intent === 'LOG_OBSERVATION') {
        // CRITICAL FIX: Append observations to entities
        const targetHabitatId = safePayload.targetHabitatId || 
          this.entities.find(e => e.type === EntityType.HABITAT && e.name.toLowerCase().trim() === (safePayload.targetHabitatName || '').toLowerCase().trim())?.id;
        
        if (targetHabitatId && safePayload.observationParams) {
          // Get all organisms in this habitat
          const habitatEntities = this.entities.filter(e => 
            e.habitat_id === targetHabitatId && 
            (e.type === EntityType.ORGANISM || e.type === EntityType.PLANT || e.type === EntityType.COLONY)
          );
          
          // Create observation entries for each parameter
          const timestamp = Date.now();
          const observations: Array<{ timestamp: number; type: 'growth' | 'parameter' | 'note'; label: string; value: number; unit?: string }> = [];
          
          Object.entries(safePayload.observationParams).forEach(([key, value]) => {
            if (typeof value === 'number') {
              observations.push({
                timestamp,
                type: key === 'growth_cm' ? 'growth' : 'parameter',
                label: key,
                value,
                unit: key === 'temp' ? '°F' : key === 'pH' ? '' : key === 'growth_cm' ? 'cm' : undefined
              });
            }
          });
          
          // If observationNotes exists, add as a note observation
          if (safePayload.observationNotes) {
            observations.push({
              timestamp,
              type: 'note',
              label: 'note',
              value: 0, // Notes don't have numeric values
              unit: undefined
            });
          }
          
          // Append observations to each entity in the habitat
          for (const entity of habitatEntities) {
            const existingObs = entity.observations || [];
            const updatedObs = [...existingObs, ...observations];
            
            const idx = this.entities.findIndex(e => e.id === entity.id);
            if (idx !== -1) {
              this.entities[idx] = { ...this.entities[idx], observations: updatedObs, updated_at: timestamp };
              
              if (!isTestMode) {
                batch.update(doc(db, 'entities', entity.id), { 
                  observations: updatedObs, 
                  updated_at: timestamp 
                });
              } else {
                mockFirestore.updateDoc('entities', entity.id, { 
                  observations: updatedObs, 
                  updated_at: timestamp 
                });
              }
            }
          }
        }
      }


      if (!isTestMode) {
        await batch.commit();
      }
      this.persistLocal();

      // Entities are queued for research — no auto-enrichment.
      // User triggers Deep Research when ready (per-habitat or global).
      if (newEntityIds.length > 0) {
        logger.info({ count: newEntityIds.length }, "Entities queued for deep research");
      }
    } catch (e: any) {
      logFirestore('error', "Persistence failed", { error: e });
      const idx = this.events.findIndex(e => e.id === tempId);
      if (idx !== -1) {
        this.events[idx].status = EventStatus.ERROR;
        this.events[idx].error_message = e.message;
        this.persistLocal();
      }
    }
  }

  discardPending() {
    this.pendingAction = null;
    this.persistLocal();
  }

  async updateEntity(id: string, updates: Partial<Entity>) {
    try {
      // @ts-ignore
      if ((window as any).__TEST_MODE__) {
         logger.debug("Test mode: skipping Firestore update");
         // Apply update locally for consistency in test
         const idx = this.entities.findIndex(e => e.id === id);
         if (idx !== -1) {
            this.entities[idx] = { ...this.entities[idx], ...updates, updated_at: Date.now() };
            this.persistLocal();
         }
         return;
      }

      const entityRef = doc(db, 'entities', id);
      await setDoc(entityRef, { ...updates, updated_at: Date.now() }, { merge: true });
    } catch (e) {
      logFirestore('error', "Failed to update entity in Firestore", { documentId: id, error: e });
      const idx = this.entities.findIndex(e => e.id === id);
      if (idx !== -1) {
        this.entities[idx] = { ...this.entities[idx], ...updates, updated_at: Date.now() };
        this.persistLocal();
      }
    }
  }

  async addGroup(name: string) {
    const id = uuidv4();
    const group = { id, name };
    try {
      await setDoc(doc(db, 'groups', id), group);
    } catch (e) {
      logFirestore('error', "Failed to add group to Firestore", { error: e });
      this.groups.push(group);
      this.persistLocal();
    }
    return group;
  }

  /**
   * Creates a PendingAction directly from a vision identification result,
   * bypassing the voice-processing loop entirely.
   */
  createActionFromVision(result: IdentifyResult, habitatId?: string) {
    this.pendingAction = {
      status: 'CONFIRMING',
      transcript: `[Photo ID] ${result.common_name}`,
      intent: 'ACCESSION_ENTITY',
      targetHabitatId: habitatId || null,
      candidates: [{
        commonName: result.common_name,
        scientificName: result.species,
        quantity: 1,
        traits: result.kingdom?.toLowerCase() === 'plantae'
          ? [{ type: 'PHOTOSYNTHETIC' as const, parameters: {} }]
          : [{ type: 'INVERTEBRATE' as const, parameters: {} }]
      }],
      aiReasoning: result.reasoning,
      isAmbiguous: result.confidence < 0.6
    };
    this.persistLocal();
  }

  // -------------------------------------------------------------------
  // Deep Research Pipeline
  // -------------------------------------------------------------------

  getResearchProgress(): ResearchProgress {
    return this._researchProgress;
  }

  resetResearchProgress() {
    this._researchProgress = {
      isActive: false,
      totalEntities: 0,
      completedEntities: 0,
      currentEntityIndex: -1,
      currentEntity: null,
      currentStage: null,
      entityResults: [],
      discoveries: []
    };
    this.notify();
  }

  private setResearchProgress(update: Partial<ResearchProgress>) {
    this._researchProgress = { ...this._researchProgress, ...update };
    this.notify();
  }

  /**
   * Enrich a single entity with stage callbacks for progress tracking.
   * Can be called standalone (single entity) or by deepResearch (batch).
   */
  async enrichEntity(entityId: string, onStage?: (stage: ResearchStage['name']) => void) {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    this.updateEntity(entityId, { enrichment_status: 'pending' });
    logEnrichment('info', `Starting enrichment for ${entity.name}`, { entityId, entityName: entity.name });

    try {
        const { enrichmentService } = await import('./enrichmentService');
        const { speciesLibrary } = await import('./speciesLibrary');
        const searchQuery = entity.scientificName || entity.name;
        
        // Check species library cache first (quick win!)
        const cached = await speciesLibrary.get(searchQuery, entity.overflow?.morphVariant);
        if (cached) {
          logEnrichment('info', `Using cached data for ${searchQuery}`, { entityId, entityName: entity.name, stage: 'cache_hit' });
          this.updateEntity(entityId, {
            details: cached.enrichmentData.details || entity.details,
            overflow: { ...(entity.overflow || {}), ...(cached.enrichmentData.overflow || {}) },
            enrichment_status: 'complete'
          });
          
          // Show instant enrichment toast
          const { toastManager } = await import('../components/Toast');
          const discoveryPreview = cached.enrichmentData.overflow?.discovery?.mechanism?.split('.')[0];
          const message = discoveryPreview 
            ? `✨ ${entity.name} enriched instantly: ${discoveryPreview}...`
            : `✨ ${entity.name} enriched instantly from library`;
          
          toastManager.success(message, 4000, {
            action: {
              label: 'View Details',
              onClick: () => {
                // Trigger entity detail modal (will be handled by App.tsx)
                (window as any).__openEntityDetail?.(entityId);
              }
            }
          });
          
          return cached.enrichmentData.overflow?.discovery?.mechanism?.split('.')[0] + '.';
        }
        
        // Not in cache - proceed with full enrichment
        const mergedDetails: any = { ...entity.details };
        const currentOverflow = { ...(entity.overflow || {}) };

        // Stage 1: Local Library (fastest — check first)
        onStage?.('library');
        let libraryHit = false;
        if (entity.type === EntityType.PLANT) {
          const scraperData = await enrichmentService.scrapeAquasabi(searchQuery);
          if (scraperData) {
            libraryHit = true;
            mergedDetails.description = scraperData.description || mergedDetails.description;
            mergedDetails.notes = scraperData.tips || mergedDetails.notes;
            mergedDetails.origin = scraperData.origin || mergedDetails.origin;
            if (scraperData.images?.length) {
              currentOverflow.referenceImages = scraperData.images;
            }
          }
        }

        // Stage 2: GBIF Taxonomy
        onStage?.('gbif');
        const gbif = await enrichmentService.searchGBIF(searchQuery);
        if (gbif) {
          mergedDetails.origin = mergedDetails.origin || gbif.origin;
          if (gbif.taxonomy) {
            currentOverflow.taxonomy = gbif.taxonomy;
            if (!entity.scientificName && gbif.scientificName) {
              this.updateEntity(entityId, { scientificName: gbif.scientificName });
            }
          }
        }

        // Stage 3: Wikipedia
        onStage?.('wikipedia');
        const wiki = await enrichmentService.searchWikipedia(searchQuery);
        if (wiki?.description) {
          mergedDetails.description = mergedDetails.description || wiki.description;
        }

        // Stage 4: iNaturalist
        onStage?.('inaturalist');
        const inat = await enrichmentService.searchiNaturalist(searchQuery);
        if (inat) {
          if (inat.commonName && !entity.aliases?.includes(inat.commonName)) {
            this.updateEntity(entityId, {
              aliases: [...(entity.aliases || []), inat.commonName]
            });
          }
          if (inat.images?.length && !currentOverflow.referenceImages?.length) {
            currentOverflow.referenceImages = inat.images;
          }
        }

        // Stage 5: AI Discovery (biological secrets)
        onStage?.('discovery');
        let discoverySnippet: string | undefined;
        try {
          const discovery = await geminiService.getBiologicalDiscovery(entity.name);
          if (discovery) {
            currentOverflow.discovery = discovery;
            discoverySnippet = discovery.mechanism?.split('.')[0] + '.';
          }
        } catch (e) {
          logEnrichment('warn', `Discovery generation failed for ${entity.name}`, { entityId, entityName: entity.name, error: e });
          // Non-fatal — continue with enrichment
        }

        // Commit all enrichment data
        this.updateEntity(entityId, {
          details: mergedDetails,
          overflow: currentOverflow,
          enrichment_status: 'complete'
        });
        
        // Save to species library for future use
        await speciesLibrary.save({
          id: searchQuery.toLowerCase() + (entity.overflow?.morphVariant ? `:${entity.overflow.morphVariant}` : ''),
          commonName: entity.name,
          scientificName: entity.scientificName,
          morphVariant: entity.overflow?.morphVariant,
          enrichmentData: {
            details: mergedDetails,
            overflow: currentOverflow
          },
          enrichedAt: new Date()
        });
        
        logEnrichment('info', `Enrichment complete for ${entity.name}`, { entityId, entityName: entity.name });
        
        // Show success toast with discovery preview and "View Details" button
        const { toastManager } = await import('../components/Toast');
        const discoveryPreview = discoverySnippet || currentOverflow.discovery?.mechanism?.split('.')[0];
        const message = discoveryPreview 
          ? `🧬 ${entity.name}: ${discoveryPreview}...`
          : `Enriched ${entity.name}`;
        
        toastManager.success(message, 8000, {
          action: {
            label: 'View Details',
            onClick: () => {
              // Trigger entity detail modal (will be handled by App.tsx)
              (window as any).__openEntityDetail?.(entityId);
            }
          }
        });
        
        return discoverySnippet;

    } catch (e: any) {
        logEnrichment('error', `Enrichment failed for ${entity.name}`, { entityId, entityName: entity.name, error: e });
        this.updateEntity(entityId, { enrichment_status: 'failed' });
        
        // Show error toast with retry option
        const { toastManager } = await import('../components/Toast');
        toastManager.error(
          `Enrichment failed for ${entity.name}: ${e.message || 'Unknown error'}`,
          8000
        );
        
        throw e;
    }
  }

  /**
   * Deep Research: Batch-enrich multiple entities serially with full progress tracking.
   * Designed to be triggered per-habitat ("Research This Habitat") or globally.
   */
  async deepResearch(entityIds: string[]) {
    // Filter to only entities that need research
    const toResearch = entityIds.filter(id => {
      const e = this.entities.find(ent => ent.id === id);
      return e && (e.enrichment_status === 'queued' || e.enrichment_status === 'none' || e.enrichment_status === 'failed');
    });

    if (toResearch.length === 0) return;

    const STAGE_DEFS: Array<{ name: ResearchStage['name']; label: string }> = [
      { name: 'library', label: 'Consulting local library...' },
      { name: 'gbif', label: 'Querying GBIF taxonomy...' },
      { name: 'wikipedia', label: 'Searching Wikipedia...' },
      { name: 'inaturalist', label: 'Checking iNaturalist...' },
      { name: 'discovery', label: 'Synthesizing discoveries...' }
    ];

    // Initialize progress
    this.setResearchProgress({
      isActive: true,
      totalEntities: toResearch.length,
      completedEntities: 0,
      currentEntityIndex: 0,
      currentEntity: null,
      currentStage: null,
      entityResults: [],
      discoveries: []
    });

    for (let i = 0; i < toResearch.length; i++) {
      const entityId = toResearch[i];
      const entity = this.entities.find(e => e.id === entityId);
      if (!entity) continue;

      // Create stage tracker for this entity
      const entityProgress: ResearchEntityProgress = {
        entityId,
        entityName: entity.name,
        stages: STAGE_DEFS.map(s => ({ name: s.name, label: s.label, status: 'waiting' as const }))
      };

      this.setResearchProgress({
        currentEntityIndex: i,
        currentEntity: { id: entityId, name: entity.name },
        entityResults: [...this._researchProgress.entityResults, entityProgress]
      });

      try {
        const discoverySnippet = await this.enrichEntity(entityId, (stage) => {
          // Update the current entity's stage status
          const results = [...this._researchProgress.entityResults];
          const current = results[results.length - 1];
          if (current) {
            current.stages = current.stages.map(s => {
              if (s.name === stage) return { ...s, status: 'active' as const };
              if (s.status === 'active') return { ...s, status: 'complete' as const };
              return s;
            });
            this.setResearchProgress({
              currentStage: stage,
              entityResults: results
            });
          }
        });

        // Mark all stages complete for this entity
        const results = [...this._researchProgress.entityResults];
        const current = results[results.length - 1];
        if (current) {
          current.stages = current.stages.map(s =>
            s.status === 'waiting' || s.status === 'active'
              ? { ...s, status: 'complete' as const }
              : s
          );
          current.discoverySnippet = discoverySnippet;
        }

        // Accumulate discovery
        if (discoverySnippet) {
          this.setResearchProgress({
            completedEntities: this._researchProgress.completedEntities + 1,
            entityResults: results,
            discoveries: [
              ...this._researchProgress.discoveries,
              { entityId, entityName: entity.name, mechanism: discoverySnippet }
            ]
          });
        } else {
          this.setResearchProgress({
            completedEntities: this._researchProgress.completedEntities + 1,
            entityResults: results
          });
        }
      } catch (e) {
        // Mark stages as error for this entity
        const results = [...this._researchProgress.entityResults];
        const current = results[results.length - 1];
        if (current) {
          current.stages = current.stages.map(s =>
            s.status === 'waiting' || s.status === 'active'
              ? { ...s, status: 'error' as const, error: String(e) }
              : s
          );
        }
        this.setResearchProgress({
          completedEntities: this._researchProgress.completedEntities + 1,
          entityResults: results
        });
      }
    }

    // Finished
    this.setResearchProgress({
      isActive: false,
      currentEntity: null,
      currentStage: null
    });
    logger.info({ discoveryCount: this._researchProgress.discoveries.length }, "Deep research complete");
  }

  /**
   * Convenience: Deep Research all queued entities in a specific habitat.
   */
  async deepResearchHabitat(habitatId: string) {
    const targets = this.entities
      .filter(e => e.habitat_id === habitatId && e.type !== EntityType.HABITAT)
      .filter(e => e.enrichment_status === 'queued' || e.enrichment_status === 'none' || e.enrichment_status === 'failed')
      .map(e => e.id);
    return this.deepResearch(targets);
  }

  /**
   * Convenience: Deep Research all queued entities globally.
   */
  async deepResearchAll() {
    const targets = this.entities
      .filter(e => e.type !== EntityType.HABITAT)
      .filter(e => e.enrichment_status === 'queued' || e.enrichment_status === 'none' || e.enrichment_status === 'failed')
      .map(e => e.id);
    return this.deepResearch(targets);
  }

  async sendMessage(text: string, options: { search?: boolean; thinking?: boolean }) {
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    this.messages.push(userMsg);
    this.notify();

    try {
      const history = this.messages.slice(-8);
      const response = (window as any).mockGeminiChat 
        ? await (window as any).mockGeminiChat(text, history, options)
        : await geminiService.chat(text, history, options);
      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        isSearch: options.search,
        isThinking: options.thinking,
        groundingLinks: response.links
      };
      this.messages.push(aiMsg);
      this.persistLocal();
    } catch (e: any) {
      this.messages.push({
        id: uuidv4(),
        role: 'model',
        text: `Consultant Error: ${e.message}`,
        timestamp: Date.now()
      });
      this.persistLocal();
    }
  }

  clearMessages() {
    this.messages = [];
    this.persistLocal();
  }

  async testConnection(): Promise<{ success: boolean; error?: string; code?: ConnectionStatus }> {
    return connectionService.testConnection(this.user);
  }
}

export const store = new ConservatoryStore();

export function useConservatory() {
  const [data, setData] = useState({
    events: store.getEvents(),
    entities: store.getEntities(),
    groups: store.getGroups(),
    messages: store.getMessages(),
    pendingAction: store.getPendingAction(),
    liveTranscript: store.getLiveTranscript(),
    testConnection: store.testConnection.bind(store),
    login: store.login.bind(store),
    logout: store.logout.bind(store),
    clearDatabase: store.clearDatabase.bind(store),
    createActionFromVision: store.createActionFromVision.bind(store),
    user: store.getUser(),
    activeHabitatId: store.getActiveHabitatId(),
    researchProgress: store.getResearchProgress()
  });

  useEffect(() => {
    return store.subscribe(() => {
      setData({
        events: store.getEvents(),
        entities: store.getEntities(),
        groups: store.getGroups(),
        messages: store.getMessages(),
        pendingAction: store.getPendingAction(),
        liveTranscript: store.getLiveTranscript(),
        user: store.getUser(),
        activeHabitatId: store.getActiveHabitatId(),
        researchProgress: store.getResearchProgress()
      });
    });
  }, []);

  return {
    ...data,
    login: useCallback(() => store.login(), []),
    logout: useCallback(() => store.logout(), []),
    processVoiceInput: useCallback((text: string) => store.processVoiceInput(text), []),
    setActiveHabitat: useCallback((id: string | null) => store.setActiveHabitat(id), []),
    commitPendingAction: useCallback(() => store.commitPendingAction(), []),
    discardPending: useCallback(() => store.discardPending(), []),
    updateSlot: useCallback((path: string, val: any) => store.updateSlot(path, val), []),
    updateEntity: useCallback((id: string, updates: Partial<Entity>) => store.updateEntity(id, updates), []),
    addGroup: useCallback((name: string) => store.addGroup(name), []),
    testConnection: useCallback(() => store.testConnection(), []),
    enrichEntity: useCallback((id: string) => store.enrichEntity(id), []),
    createActionFromVision: useCallback((result: IdentifyResult, habitatId?: string) => store.createActionFromVision(result, habitatId), []),
    deepResearch: useCallback((ids: string[]) => store.deepResearch(ids), []),
    deepResearchHabitat: useCallback((habitatId: string) => store.deepResearchHabitat(habitatId), []),
    deepResearchAll: useCallback(() => store.deepResearchAll(), []),
    resetResearchProgress: useCallback(() => store.resetResearchProgress(), []),
    sendMessage: useCallback((text: string, opts: any) => store.sendMessage(text, opts), []),
    clearMessages: useCallback(() => store.clearMessages(), []),
    // Entity relationship helpers
    getHabitatInhabitants: useCallback((habitatId: string) => store.getHabitatInhabitants(habitatId), []),
    getEntityHabitat: useCallback((entityId: string) => store.getEntityHabitat(entityId), []),
    getRelatedEntities: useCallback((entityId: string) => store.getRelatedEntities(entityId), []),
    // Growth tracking
    calculateGrowthRate: useCallback((entityId: string, metric?: string) => store.calculateGrowthRate(entityId, metric), []),
    getGrowthTimeline: useCallback((entityId: string, metric?: string) => store.getGrowthTimeline(entityId, metric), []),
    // Synergy computation
    computeHabitatSynergies: useCallback((habitatId: string) => store.computeHabitatSynergies(habitatId), []),
    // Feature Manifest backend
    getFeaturedSpecimen: useCallback(() => store.getFeaturedSpecimen(), []),
    getHabitatHealth: useCallback((habitatId: string) => store.getHabitatHealth(habitatId), []),
    getEcosystemFacts: useCallback((limit?: number) => store.getEcosystemFacts(limit), [])
  };
}
