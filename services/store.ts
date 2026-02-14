
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppEvent, Entity, DomainEvent, EntityGroup, PendingAction, EntityType, EventStatus, ChatMessage,
  IdentifyResult 
} from '../types';
import { geminiService } from './geminiService';
import { 
  db, auth, collection, addDoc, doc, getDoc, setDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, signInWithPopup, signOut, 
  onAuthStateChanged, googleProvider, User, writeBatch
} from './firebase';
import { connectionService, ConnectionStatus } from './connectionService';
import { mockFirestore } from './MockFirestoreService';

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

  constructor() {
    this.loadLocal();
    this.initAuth();
    
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.setTestUser = (user: User) => {
        console.log("Setting Test User:", user);
        this.user = user;
        this.notify();
      };
    }
  }

  private initAuth() {
    onAuthStateChanged(auth, (user) => {
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
      console.error("Login failed", e);
      throw e;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.clearSync();
    } catch (e) {
      console.error("Logout failed", e);
    }
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
        console.warn("Local storage corrupted, starting fresh.");
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
        console.error("LocalStorage Write Failed", e);
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
      console.error("Failed to init Firestore sync", e);
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
   * Generates a holistic snapshot of a habitat and its inhabitants
   */
  async generateHabitatSnapshot(habitatId: string) {
    const habitat = this.entities.find(e => e.id === habitatId && e.type === EntityType.HABITAT);
    if (!habitat) return null;

    const inhabitants = this.entities.filter(e => e.habitat_id === habitatId);
    
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
      console.error("AI Payload Validation/Parsing Error:", e);
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

    const isTestMode = (window as any).setTestUser;
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
        for (const cand of safePayload.candidates || []) {
          const normalizedName = cand.commonName.toLowerCase().trim();
          const existing = this.entities.find(e => 
            e.habitat_id === safePayload.targetHabitatId &&
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
            habitat_id: safePayload.targetHabitatId,
            traits: cand.traits || [],
            type,
            quantity: cand.quantity,
            confidence: 0.9,
            aliases: [],
            enrichment_status: 'pending',
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
      }

      if (!isTestMode) {
        await batch.commit();
      }
      this.persistLocal();

      // Trigger Auto-Enrichment for new entities
      newEntityIds.forEach(id => {
        this.enrichEntity(id).catch(err => console.error(`Auto-enrichment failed for ${id}:`, err));
      });
    } catch (e: any) {
      console.error("Persistence Failed", e);
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
      if ((window as any).setTestUser) {
         console.log("Test Mode: Skipping Firestore Update");
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
      console.error("Failed to update entity in Firestore", e);
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
      console.error("Failed to add group to Firestore", e);
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

  async enrichEntity(entityId: string) {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    // Set status to pending
    this.updateEntity(entityId, { enrichment_status: 'pending' });
    console.log(`Starting enrichment for ${entity.name} (${entityId})`);

    try {
        const { enrichmentService } = await import('./enrichmentService');
        const searchQuery = entity.scientificName || entity.name;

        // 1. Search General APIs (real calls)
        const [gbif, wiki, inat] = await Promise.all([
            enrichmentService.searchGBIF(searchQuery),
            enrichmentService.searchWikipedia(searchQuery),
            enrichmentService.searchiNaturalist(searchQuery)
        ]);

        // 2. Build merged details from all sources
        const mergedDetails: any = { ...entity.details };

        if (gbif) {
          mergedDetails.origin = mergedDetails.origin || gbif.origin;
          // Store taxonomy in overflow for now
          if (gbif.taxonomy) {
            this.updateEntity(entityId, {
              overflow: { ...entity.overflow, taxonomy: gbif.taxonomy },
              scientificName: entity.scientificName || gbif.scientificName
            });
          }
        }

        if (wiki?.description) {
          mergedDetails.description = mergedDetails.description || wiki.description;
        }

        if (inat) {
          // Use iNaturalist common name as an alias if we don't have one
          if (inat.commonName && !entity.aliases?.includes(inat.commonName)) {
            this.updateEntity(entityId, {
              aliases: [...(entity.aliases || []), inat.commonName]
            });
          }
        }

        // 3. Try local library if it's a plant
        if (entity.type === EntityType.PLANT) {
             const scraperData = await enrichmentService.scrapeAquasabi(searchQuery);
             if (scraperData) {
                 // Local library data is highest fidelity — override
                 mergedDetails.description = scraperData.description || mergedDetails.description;
                 mergedDetails.notes = scraperData.tips || mergedDetails.notes;
                 mergedDetails.origin = scraperData.origin || mergedDetails.origin;
                 if (scraperData.images?.length) {
                   this.updateEntity(entityId, {
                     overflow: { ...entity.overflow, referenceImages: scraperData.images }
                   });
                 }
             }
        }

        this.updateEntity(entityId, { details: mergedDetails, enrichment_status: 'complete' });
        console.log(`Enrichment complete for ${entityId}`);

    } catch (e) {
        console.error("Enrichment Failed", e);
        this.updateEntity(entityId, { enrichment_status: 'failed' });
    }
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
    user: store.getUser(),
    activeHabitatId: store.getActiveHabitatId()
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
        activeHabitatId: store.getActiveHabitatId()
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
    sendMessage: useCallback((text: string, opts: any) => store.sendMessage(text, opts), []),
    clearMessages: useCallback(() => store.clearMessages(), [])
  };
}
