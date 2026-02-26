import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppEvent, Entity, DomainEvent, EntityGroup, PendingAction, EntityType, EventStatus, ChatMessage,
  IdentifyResult, ResearchProgress, ResearchStage, ResearchEntityProgress, BiomeTheme, RackContainer, Habitat, User, HabitatOutline
} from '../../types';
import { geminiService } from '../geminiService';
import { 
  db, auth, collection, addDoc, doc, getDoc, getDocs, setDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, signInWithPopup, signOut, 
  onAuthStateChanged, googleProvider, FirebaseUser, writeBatch
} from '../firebase';

import { connectionService, ConnectionStatus } from '../connectionService';
import { mockFirestore } from '../MockFirestoreService';
import { logger, logEnrichment, logFirestore, logAICall } from '../logger';
import { imageService } from '../imageService';
import { taxonomyService } from '../taxonomy';
import { calculateHabitatHealth, calculateParameterTrend } from '../ecosystem';
import { STORAGE_KEYS } from '../../src/constants';
import { safeStorage } from '../../src/utils/storage';
import { echoEngineService } from '../EchoEngine';

import { IConservatoryState, ConservatoryState } from './storeState';

class ConservatoryStore {
  private state: IConservatoryState;
  private listeners: (() => void)[] = [];
  private unsubscribes: (() => void)[] = [];

  constructor() {
    this.state = new ConservatoryState();
    this.state.loadLocal(); // Load local state via the state object
    this.initAuth();
    
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.setTestUser = (user: User, useRealBackend = false) => {
        logger.debug({ testMode: true, useRealBackend }, "Setting test user");
        // Prevent Firebase auth from overwriting test user
        this.state.isTestMode = true;
        this.clearSync();
        this.state.user = user;
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
      if (this.state.isTestMode) return;
      this.state.user = user;
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
    
    this.state.events = [];
    this.state.entities = [];
    this.state.groups = [];
    this.state.persistLocal();
  }

  // Removed loadLocal() as it's now in ConservatoryState
  // Removed persistLocal() as it's now in ConservatoryState

  private initFirestoreSync() {
    this.clearSync();

    try {
      const { entityRepo } = require('./repositories/EntityRepository');
      const { eventRepo } = require('./repositories/EventRepository');

      const unsubEvents = eventRepo.subscribeToEvents((cloudEvents: AppEvent[]) => {
        const localPending = this.state.events.filter(e => e.status === EventStatus.PENDING || e.status === EventStatus.ERROR);
        this.state.events = [...localPending, ...cloudEvents];
        this.state.persistLocal();
        this.notify();
      });

      const unsubEntities = entityRepo.subscribe((cloudEntities: Entity[]) => {
        this.state.entities = cloudEntities;
        this.state.persistLocal();
        this.notify();
      });

      this.unsubscribes.push(unsubEvents, unsubEntities);
    } catch (e) {
        logFirestore('error', "Failed to init repository sync", { error: e });
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

  getEvents() { return [...this.state.events]; }
  getActiveHabitatId() { return this.state.activeHabitatId; }

  setActiveHabitat(id: string | null) {
    this.state.activeHabitatId = id;
    if (id) localStorage.setItem(STORAGE_KEYS.HABITAT_ID, id);
    else localStorage.removeItem(STORAGE_KEYS.HABITAT_ID);
    this.state.persistLocal();
  }

  getEntities() { return this.state.entities; }
  getGroups() { return [...this.state.groups]; }
  getMessages() { return [...this.state.messages]; }
  getPendingAction() { return this.state.pendingAction ? { ...this.state.pendingAction } : null; }
  getLiveTranscript() { return this.state.liveTranscript; }

  setLiveTranscript(text: string) {
    this.state.liveTranscript = text;
    this.notify();
  }

  getUser() { return this.state.user; }

  /**
   * Get all inhabitants (organisms, plants, colonies) in a habitat
   */
  getHabitatInhabitants(habitatId: string): Entity[] {
    return this.state.entities.filter(e => 
      e.habitat_id === habitatId && 
      (e.type === EntityType.ORGANISM || e.type === EntityType.PLANT || e.type === EntityType.COLONY)
    );
  }

  /**
   * Get the habitat that an entity belongs to
   */
  getEntityHabitat(entityId: string): Entity | null {
    const entity = this.state.entities.find(e => e.id === entityId);
    if (!entity || !entity.habitat_id) return null;
    return this.state.entities.find(e => e.id === entity.habitat_id && e.type === EntityType.HABITAT) || null;
  }

  /**
   * Get all entities related to a given entity (tankmates, habitat, etc.)
   */
  getRelatedEntities(entityId: string): { habitat: Entity | null; tankmates: Entity[] } {
    const entity = this.state.entities.find(e => e.id === entityId);
    if (!entity || !entity.habitat_id) {
      return { habitat: null, tankmates: [] };
    }
    
    const habitat = this.state.entities.find(e => e.id === entity.habitat_id && e.type === EntityType.HABITAT) || null;
    const tankmates = this.state.entities.filter(e => 
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
    const entity = this.state.entities.find(e => e.id === entityId);
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
    const entity = this.state.entities.find(e => e.id === entityId);
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
    const eligible = this.state.entities.filter(e => 
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
  getHabitatHealth(habitatId: string) {
    const habitat = this.state.entities.find(e => e.id === habitatId && e.type === EntityType.HABITAT);
    if (!habitat) return { score: 0, factors: { stability: 0, biodiversity: 0, recency: 0 }, details: [] };

    const inhabitants = this.getHabitatInhabitants(habitatId);
    return calculateHabitatHealth(habitat, inhabitants);
  }

  /**
   * Get ecosystem facts for ambient ticker
   * Extracts interesting facts from enriched entities
   */
  getEcosystemFacts(limit: number = 5): string[] {
    const enriched = this.state.entities.filter(e => 
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
    const habitat = this.state.entities.find(e => e.id === habitatId && e.type === EntityType.HABITAT);
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
    if (!this.state.activeHabitatId) return 'default';
    const habitat = this.state.entities.find(e => e.id === this.state.activeHabitatId);
    if (!habitat) return 'default';

    const type = (habitat as any).details?.type?.toLowerCase() || '';
    const name = habitat.name.toLowerCase();

    if (name.includes('blackwater')) return 'blackwater';
    if (name.includes('tanganyika') || name.includes('malawi')) return 'tanganyika';
    if (type.includes('marine') || type.includes('reef') || name.includes('ocean')) return 'marine';
    if (type.includes('paludarium') || type.includes('terrarium') || type.includes('vivarium')) return 'paludarium';
    
    return 'default';
  }

  /**
   * Assigns blueprint coordinates to a specific habitat.
   * This is used by the BlueprintScreen to visually map habitats on the rack.
   */
  assignHabitatToBlueprint(habitatId: string, blueprintCoords: HabitatOutline) {
    const habitatIndex = this.state.entities.findIndex(e => e.id === habitatId && e.type === EntityType.HABITAT);
    if (habitatIndex === -1) {
      logger.warn(`Attempted to assign blueprint to non-existent habitat: ${habitatId}`);
      return;
    }

    const updatedHabitat = { ...this.state.entities[habitatIndex], blueprintCoords };
    this.state.entities[habitatIndex] = updatedHabitat;
    this.state.persistLocal();
    this.notify();

    // Optionally, persist to Firestore if needed for multi-device sync
    // This is currently a local-only feature as per "just for me" ethos.
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
    if (!this.state.pendingAction) return;
    const newPending = JSON.parse(JSON.stringify(this.state.pendingAction)); 
    const parts = path.split('.');
    let current: any = newPending;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}; 
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    this.state.pendingAction = newPending;
    this.state.persistLocal();
  }

  async processVoiceInput(text: string) {
    // Conversational Loop: If we are waiting for strategy confirmation
    if (this.state.pendingAction?.status === 'STRATEGY_REQUIRED' && this.state.pendingAction.intentStrategy) {
      const lowerText = text.toLowerCase().trim();
      const isYes = ['yes', 'correct', 'yeah', 'yep', 'do it', 'sure'].some(w => lowerText.includes(w));
      const isNo = ['no', 'nope', 'incorrect', 'wrong', 'wait'].some(w => lowerText.includes(w));

      if (isYes && this.state.pendingAction.intentStrategy.suggestedCommand) {
        const cmd = this.state.pendingAction.intentStrategy.suggestedCommand;
        this.state.pendingAction = null; // Clear strategy and re-process as the suggested command
        return this.processVoiceInput(cmd);
      } else if (isNo) {
        this.state.pendingAction = {
          ...this.state.pendingAction,
          status: 'ANALYZING',
          aiReasoning: "Understood. Please tell me more specifically what you'd like to do."
        };
        this.notify();
        return;
      }
    }

    this.state.pendingAction = {
      status: 'ANALYZING',
      transcript: text,
      intent: null,
      candidates: [],
      aiReasoning: "Processing...",
      isAmbiguous: false
    };
    this.notify();

// processVoiceInput log removed
    try {
      const currentEntities = [...this.state.entities]; 
      
      // Test Hook for Stability
      const result = (window as any).mockGeminiParse 
        ? await (window as any).mockGeminiParse(text, currentEntities)
        : await geminiService.parseVoiceCommand(text, currentEntities);
      
// Parse Result log removed
      
      // Intent Sovereignty: If the parser is unsure, call the Strategy Agent
      if (!result.intent || result.isAmbiguous) {
        const strategy = (window as any).mockGeminiStrategy
          ? await (window as any).mockGeminiStrategy(text)
          : await geminiService.getIntentStrategy(text, { 
              entities: currentEntities.map(e => ({ name: e.name, type: e.type })) 
            });
        
        this.state.pendingAction = {
          status: 'STRATEGY_REQUIRED',
          transcript: text,
          intent: result.intent,
          intentStrategy: strategy,
          aiReasoning: result.aiReasoning || "Input is complex or ambiguous.",
          candidates: []
        };
        this.state.persistLocal();
        return;
      }

      const habitatResolution = result.targetHabitatName 
        ? this.resolveEntity(result.targetHabitatName, currentEntities)
        : { match: null, isAmbiguous: false };
      
      const isBulk = ['all tanks', 'every tank', 'all habitats', 'every habitat'].some(phrase => text.toLowerCase().includes(phrase));

      this.state.pendingAction = {
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
        isAmbiguous: result.isAmbiguous || habitatResolution.isAmbiguous,
        isBulk
      };
      
      this.state.persistLocal();
    } catch (e: any) {
      logAICall('error', "AI payload validation/parsing error", { error: e });
      this.state.pendingAction = {
        status: 'ERROR',
        transcript: text,
        intent: null,
        aiReasoning: `Data Integrity Error: ${e.message}. The AI sent an unexpected response format.`,
        candidates: []
      };
      this.state.persistLocal();
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
    if (!this.state.pendingAction) {
      logger.warn("CommitPendingAction: No pending action");
      return;
    }
    
    this.state.pendingAction.status = 'COMMITTING';
    this.notify();

    try {
      const { actionCommittalUseCase } = await import('./useCases/ActionCommittalUseCase');
      await actionCommittalUseCase.execute(this.state.pendingAction, this.state.entities);
      
      this.state.pendingAction = null;
      this.state.persistLocal();
      this.notify();
    } catch (e: any) {
      logger.error({ err: e }, "[STORE] Action committal failed");
      this.state.pendingAction.status = 'ERROR';
      this.state.pendingAction.aiReasoning = `Submission failed: ${e.message}`;
      this.notify();
    }
  }

  discardPending() {
    this.state.pendingAction = null;
    this.state.persistLocal();
  }

  async updateEntity(id: string, updates: Partial<Entity>) {
    try {
      // @ts-ignore
      if ((window as any).__TEST_MODE__) {
         logger.debug("Test mode: skipping Firestore update");
         // Apply update locally for consistency in test
         const idx = this.state.entities.findIndex(e => e.id === id);
         if (idx !== -1) {
            this.state.entities[idx] = { ...this.state.entities[idx], ...updates, updated_at: Date.now() };
            this.state.persistLocal();
         }
         return;
      }

      const entityRef = doc(db, 'entities', id);
      await setDoc(entityRef, { ...updates, updated_at: Date.now() }, { merge: true });
    } catch (e) {
      logFirestore('error', "Failed to update entity in Firestore", { documentId: id, error: e });
      const idx = this.state.entities.findIndex(e => e.id === id);
      if (idx !== -1) {
        this.state.entities[idx] = { ...this.state.entities[idx], ...updates, updated_at: Date.now() };
        this.state.persistLocal();
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
      this.state.groups.push(group);
      this.state.persistLocal();
    }
    return group;
  }

  /**
   * Creates a PendingAction directly from a vision identification result,
   * bypassing the voice-processing loop entirely.
   */
  async createActionFromVision(result: IdentifyResult, imageBase64: string, habitatId?: string) {
    // Win #2: Cross-reference with Species Library
    const canonicalMatch = await taxonomyService.resolveVisionResult(result.species, result.common_name);
    
    const candidateName = canonicalMatch?.commonName || result.common_name;
    const scientificName = canonicalMatch?.scientificName || result.species;
    const traits = canonicalMatch?.enrichmentData.overflow?.traits || (result.kingdom?.toLowerCase() === 'plantae'
      ? [{ type: 'PHOTOSYNTHETIC' as const, parameters: {} }]
      : [{ type: 'INVERTEBRATE' as const, parameters: {} }]);

    this.state.pendingAction = {
      status: 'CONFIRMING',
      transcript: `[Photo ID] ${candidateName}`,
      intent: 'ACCESSION_ENTITY',
      targetHabitatId: habitatId || null,
      candidates: [{
        commonName: candidateName,
        scientificName: scientificName,
        quantity: 1,
        traits
      }],
      imageBase64,
      aiReasoning: canonicalMatch 
        ? `Verified against local species library. ${result.reasoning}`
        : result.reasoning,
      isAmbiguous: !canonicalMatch && result.confidence < 0.6
    };

    // If we have a library match, we can skip future enrichment for this candidate
    if (canonicalMatch) {
      this.state.pendingAction.candidates[0] = {
        ...this.state.pendingAction.candidates[0],
        ...canonicalMatch.enrichmentData.details,
        ...canonicalMatch.enrichmentData.overflow,
        enrichment_status: 'complete'
      } as any;
    }

    this.state.persistLocal();
  }

  /**
   * Creates multiple PendingActions for rack discovery.
   * Hardened to handle batch habitat creation without re-parsing text.
   */
  async createActionsFromRack(containers: RackContainer[]) {
    if (!containers.length) return;

    for (const c of containers) {
      const habitatName = `${c.size_estimate} ${c.shelf_level} ${c.horizontal_position}`;
      const habitatParams = {
        name: habitatName,
        type: 'Freshwater' as 'Freshwater',
        location: `${c.shelf_level} shelf, ${c.horizontal_position}`
      };

      const candidates = c.primary_species.map(s => ({
        commonName: s.common_name,
        scientificName: s.scientific_name || s.common_name,
        quantity: 1,
        traits: []
      }));

      this.state.pendingAction = {
        status: 'CONFIRMING',
        transcript: `[Rack Scan] ${habitatName}`,
        intent: 'MODIFY_HABITAT',
        habitatParams,
        candidates,
        aiReasoning: `Batch detected from rack scan. Shelf: ${c.shelf_level}.`,
        isAmbiguous: false
      };
      
      this.notify();
      this.state.persistLocal();
    }
  }

  // -------------------------------------------------------------------
  // Deep Research Pipeline
  // -------------------------------------------------------------------

  getResearchProgress(): ResearchProgress {
    return this.state.researchProgress;
  }

  resetResearchProgress() {
    this.state.researchProgress = {
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
    this.state.researchProgress = { ...this.state.researchProgress, ...update };
    this.notify();
  }

  /**
   * Enrich a single entity using the new Scrape-Then-Synthesize pipeline.
   */
  async enrichEntity(entityId: string, onStage?: (stage: ResearchStage['name']) => void): Promise<string> {
    const entity = this.state.entities.find(e => e.id === entityId);
    if (!entity) return;

    this.updateEntity(entityId, { enrichment_status: 'pending' });
    logEnrichment('info', `Starting enrichment for ${entity.name}`, { entityId, entityName: entity.name });

    try {
        const { enrichmentService } = await import('../enrichmentService');
        const enrichedData = await enrichmentService.enrichEntity(entity);
        
        // Commit all enrichment data
        this.updateEntity(entityId, {
          enrichedData,
          enrichment_status: 'complete'
        });
        
        logEnrichment('info', `Enrichment complete for ${entity.name}`, { entityId, entityName: entity.name });
        
        // Show success toast with discovery preview
        const { toastManager } = await import('../../components/Toast');
        const discoveryPreview = enrichedData.description?.split('.')[0];
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
        
        return enrichedData.description?.split('.')[0] || "Successfully enriched.";

    } catch (e: any) {
        logEnrichment('error', `Enrichment failed for ${entity.name}`, { entityId, entityName: entity.name, error: e });
        this.updateEntity(entityId, { enrichment_status: 'failed' });
        
        const { toastManager } = await import('../../components/Toast');
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
      const e = this.state.entities.find(ent => ent.id === id);
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
      const entity = this.state.entities.find(e => e.id === entityId);
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
        entityResults: [...this.state.researchProgress.entityResults, entityProgress]
      });

      try {
        const discoverySnippet = await this.enrichEntity(entityId, (stage) => {
          // Update the current entity's stage status
          const results = [...this.state.researchProgress.entityResults];
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
        const results = [...this.state.researchProgress.entityResults];
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
            completedEntities: this.state.researchProgress.completedEntities + 1,
            entityResults: results,
            discoveries: [
              ...this.state.researchProgress.discoveries,
              { entityId, entityName: entity.name, mechanism: discoverySnippet }
            ]
          });
        } else {
          this.setResearchProgress({
            completedEntities: this.state.researchProgress.completedEntities + 1,
            entityResults: results
          });
        }
      } catch (e) {
        // Mark stages as error for this entity
        const results = [...this.state.researchProgress.entityResults];
        const current = results[results.length - 1];
        if (current) {
          current.stages = current.stages.map(s =>
            s.status === 'active' || s.status === 'waiting'
              ? { ...s, status: 'error' as const, error: String(e.message || e) }
              : s
          );
        }
        this.setResearchProgress({
          completedEntities: this.state.researchProgress.completedEntities + 1,
          entityResults: results
        });
        logger.error({ entityId, error: e }, "Research entity failed");
      }
    }

    // Finished
    const finalState = {
      isActive: false,
      currentEntity: null,
      currentStage: null,
      completedEntities: toResearch.length
    };
    this.setResearchProgress(finalState);
    logger.info({ 
      discoveryCount: this.state.researchProgress.discoveries.length,
      successCount: this.state.researchProgress.completedEntities 
    }, "Deep research batch process complete");
  }

  /**
   * Convenience: Deep Research all queued entities in a specific habitat.
   */
  async deepResearchHabitat(habitatId: string) {
    const targets = this.state.entities
      .filter(e => e.habitat_id === habitatId && e.type !== EntityType.HABITAT)
      .filter(e => e.enrichment_status === 'queued' || e.enrichment_status === 'none' || e.enrichment_status === 'failed')
      .map(e => e.id);
    return this.deepResearch(targets);
  }

  /**
   * Convenience: Deep Research all queued entities globally.
   */
  async deepResearchAll() {
    const targets = this.state.entities
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
    this.state.messages.push(userMsg);
    this.notify();

    try {
      const history = this.state.messages.slice(-8);
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
      this.state.messages.push(aiMsg);
      this.state.persistLocal();
    } catch (e: any) {
      this.state.messages.push({
        id: uuidv4(),
        role: 'model',
        text: `Consultant Error: ${e.message}`,
        timestamp: Date.now()
      });
      this.state.persistLocal();
    }
  }

  clearMessages() {
    this.state.messages = [];
    this.state.persistLocal();
  }

  // -------------------------------------------------------------------
  // App Store Compliance
  // -------------------------------------------------------------------

  /**
   * Hard Delete, required by Apple App Store.
   * Deletes all local data AND the Firebase Auth user account.
   */
  async deleteAccount() {
    try {
      if (!this.state.user) throw new Error("No user signed in");
      
      // 1. Clear Data
      await this.clearDatabase();
      
      // 2. Delete Auth User
      const user = auth.currentUser;
      if (user) {
        await user.delete(); // Requires recent login, might throw requires-recent-login
      }
      
      this.logout();
      logger.info({ userId: this.state.user.uid }, "User account deleted successfully");
      return true;
    } catch (e: any) {
      logger.error({ error: e, code: e.code }, "Failed to delete account");
      if (e.code === 'auth/requires-recent-login') {
        throw new Error("Security Check: Please sign out and sign in again before deleting your account.");
      }
      throw e;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; code?: ConnectionStatus }> {
    return connectionService.testConnection(this.state.user as any);
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
        testConnection: store.testConnection.bind(store),
        login: store.login.bind(store),
        logout: store.logout.bind(store),
        clearDatabase: store.clearDatabase.bind(store),
        createActionFromVision: store.createActionFromVision.bind(store),
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
    createActionFromVision: useCallback((result: IdentifyResult, imageBase64: string, habitatId?: string) => store.createActionFromVision(result, imageBase64, habitatId), []),
    createActionsFromRack: useCallback((containers: RackContainer[]) => store.createActionsFromRack(containers), []),
    deepResearch: useCallback((ids: string[]) => store.deepResearch(ids), []),
    deepResearchHabitat: useCallback((habitatId: string) => store.deepResearchHabitat(habitatId), []),
    deepResearchAll: useCallback(() => store.deepResearchAll(), []),
    resetResearchProgress: useCallback(() => store.resetResearchProgress(), []),
    sendMessage: useCallback((text: string, opts: any) => store.sendMessage(text, opts), []),
    clearMessages: useCallback(() => store.clearMessages(), []),
    // Compliance
    deleteAccount: useCallback(() => store.deleteAccount(), []),
    // Entity relationship helpers
    getHabitatInhabitants: useCallback((habitatId: string) => store.getHabitatInhabitants(habitatId), []),
    getEntityHabitat: useCallback((entityId: string) => store.getEntityHabitat(entityId), []),
    getRelatedEntities: useCallback((entityId: string) => store.getRelatedEntities(entityId), []),
    // Growth tracking
    calculateGrowthRate: useCallback((entityId: string, metric?: string) => store.calculateGrowthRate(entityId, metric), []),
    getGrowthTimeline: useCallback((entityId: string, metric?: string) => store.getGrowthTimeline(entityId, metric), []),
    calculateParameterTrend: useCallback((habitatId: string, parameter: string) => {
      const habitat = store.getEntities().find(e => e.id === habitatId);
      return calculateParameterTrend(habitat?.observations || [], parameter);
    }, []),
    // Synergy computation
    computeHabitatSynergies: useCallback((habitatId: string) => store.computeHabitatSynergies(habitatId), []),
    // Feature Manifest backend
    getFeaturedSpecimen: useCallback(() => store.getFeaturedSpecimen(), []),
    getHabitatHealth: useCallback((habitatId: string) => store.getHabitatHealth(habitatId), []),
    getEcosystemFacts: useCallback((limit?: number) => store.getEcosystemFacts(limit), []),
    assignHabitatToBlueprint: useCallback((habitatId: string, outline: HabitatOutline) => store.assignHabitatToBlueprint(habitatId, outline), []),
  };
}
