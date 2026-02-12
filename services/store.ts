import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppEvent, Entity, DomainEvent, EntityGroup, PendingAction, EntityType, EventStatus 
} from '../types';
import { geminiService } from './geminiService';
import { 
  db, auth, collection, addDoc, doc, getDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, signInWithPopup, signOut, 
  onAuthStateChanged, googleProvider, User
} from './firebase';

class ConservatoryStore {
  private events: AppEvent[] = [];
  private entities: Entity[] = [];
  private groups: EntityGroup[] = [];
  private pendingAction: PendingAction | null = null;
  private user: User | null = null;
  private listeners: (() => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.loadLocal();
    this.initAuth();
  }

  private initAuth() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      if (user) {
        this.initFirestoreSync();
      } else {
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
      }
      this.notify();
    });
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
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  private loadLocal() {
    try {
        const savedEvents = localStorage.getItem('conservatory_events');
        const savedEntities = localStorage.getItem('conservatory_entities');
        const savedGroups = localStorage.getItem('conservatory_groups');
        
        if (savedEvents) this.events = JSON.parse(savedEvents);
        if (savedEntities) this.entities = JSON.parse(savedEntities);
        if (savedGroups) this.groups = JSON.parse(savedGroups);
    } catch (e) {
        console.warn("Local storage corrupted, starting fresh.");
    }
  }

  private persistLocal() {
    try {
        localStorage.setItem('conservatory_events', JSON.stringify(this.events));
        localStorage.setItem('conservatory_entities', JSON.stringify(this.entities));
        localStorage.setItem('conservatory_groups', JSON.stringify(this.groups));
        this.notify();
    } catch (e) {
        console.error("LocalStorage Write Failed", e);
    }
  }

  private initFirestoreSync() {
    if (this.unsubscribeFirestore) return;

    try {
      const q = query(collection(db, 'events'), orderBy('timestamp', 'asc'), limit(500));
      
      this.unsubscribeFirestore = onSnapshot(q, (snapshot) => {
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

        const pendingEvents = this.events.filter(e => e.status === EventStatus.PENDING || e.status === EventStatus.ERROR);
        this.events = [...pendingEvents, ...cloudEvents.reverse()];
        this.replayEvents(cloudEvents);
        this.persistLocal();
      }, (error) => {
        console.error("Firestore Sync Error:", error);
      });
    } catch (e) {
      console.error("Failed to init Firestore sync", e);
    }
  }

  private replayEvents(chronologicalEvents: AppEvent[]) {
    this.entities = [];
    chronologicalEvents.forEach(e => {
      if (e.domain_event) {
        this.applyEvent(e.domain_event);
      }
    });
    this.notify();
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
  getEntities() { return [...this.entities]; }
  getGroups() { return [...this.groups]; }
  getPendingAction() { return this.pendingAction ? { ...this.pendingAction } : null; }
  getUser() { return this.user; }

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
      const result = await geminiService.parseVoiceCommand(text, currentEntities);
      
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
      console.error("Voice Parsing Error:", e);
      this.pendingAction = {
        status: 'CONFIRMING',
        transcript: text,
        intent: 'LOG_OBSERVATION',
        aiReasoning: e.message || "Parsing failed. Please edit manually.",
        candidates: [],
        observationNotes: text
      };
      this.persistLocal();
    }
  }

  async commitPendingAction() {
    if (!this.pendingAction) return;
    
    this.pendingAction.status = 'COMMITTING';
    this.notify();

    const intent = this.pendingAction.intent || 'LOG_OBSERVATION';
    const eventType = intent === 'ACCESSION_ENTITY' ? 'ENTITY_ACCESSIONED' : 
                      intent === 'MODIFY_HABITAT' ? 'MODIFY_HABITAT' : 'OBSERVATION_LOGGED';

    const rawPayload = { ...this.pendingAction };
    const safePayload = JSON.parse(JSON.stringify(rawPayload));
    
    delete safePayload.status;
    delete safePayload.isAmbiguous;

    if (intent === 'MODIFY_HABITAT') {
        safePayload.generatedId = uuidv4();
    }
    if (intent === 'ACCESSION_ENTITY' && safePayload.candidates) {
        safePayload.candidates = safePayload.candidates.map((c: any) => ({
            ...c,
            generatedId: uuidv4()
        }));
    }

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

    try {
      const { status, isAmbiguous, ...payloadToSave } = safePayload;
      
      await addDoc(collection(db, 'events'), {
        type: eventType,
        timestamp: serverTimestamp(),
        payload: payloadToSave,
        metadata: domainEvent.metadata
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

  private applyEvent(event: DomainEvent) {
    const { type, payload } = event;

    if (type === 'MODIFY_HABITAT') {
      const id = payload.generatedId || event.eventId; 
      if (this.entities.some(e => e.id === id)) return;

      this.entities.push({
        id,
        name: payload.habitatParams?.name || `New Habitat`,
        type: EntityType.HABITAT,
        aliases: [],
        traits: [
            { type: 'AQUATIC', parameters: { salinity: payload.habitatParams?.type === 'Saltwater' ? 'marine' : 'fresh' } }
        ],
        confidence: 1,
        enrichment_status: 'none',
        created_at: new Date(event.timestamp).getTime(),
        updated_at: new Date(event.timestamp).getTime(),
        habitat_id: undefined
      });
    } 
    else if (type === 'ENTITY_ACCESSIONED') {
      const targetId = payload.targetHabitatId;
      
      payload.candidates?.forEach((cand: any) => {
        const id = cand.generatedId || uuidv4();
        if (this.entities.some(e => e.id === id)) return;

        let type = EntityType.ORGANISM;
        if (cand.traits?.some((t: any) => t.type === 'PHOTOSYNTHETIC')) type = EntityType.PLANT;
        if (cand.traits?.some((t: any) => t.type === 'COLONY')) type = EntityType.COLONY;

        this.entities.push({
          id,
          name: cand.commonName,
          scientificName: cand.scientificName,
          habitat_id: targetId,
          traits: cand.traits || [],
          type,
          quantity: cand.quantity,
          confidence: 0.9,
          aliases: [],
          enrichment_status: 'pending',
          created_at: new Date(event.timestamp).getTime(),
          updated_at: new Date(event.timestamp).getTime()
        });
      });
    }
  }

  discardPending() {
    this.pendingAction = null;
    this.persistLocal();
  }

  updateEntity(id: string, updates: Partial<Entity>) {
    const idx = this.entities.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.entities[idx] = { ...this.entities[idx], ...updates, updated_at: Date.now() };
      this.persistLocal();
    }
  }

  addGroup(name: string) {
    const newGroup = { id: uuidv4(), name };
    this.groups.push(newGroup);
    this.persistLocal();
    return newGroup;
  }

  async testConnection(): Promise<{ success: boolean; error?: string; code?: string }> {
    if (!this.user) {
      return { success: false, error: "Authentication required", code: 'AUTH_REQUIRED' };
    }

    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("Connection Timed Out")), 5000));
      await Promise.race([
          getDoc(doc(db, 'events', 'init')),
          timeout
      ]);
      return { success: true };
    } catch (e: any) {
      const errorMsg = e.message || "Unknown Connection Error";
      const code = e.code;

      if (code === 'permission-denied' || errorMsg.includes("permission-denied")) {
        // Since we checked this.user, this most likely means either a disabled API or bad security rules
        if (errorMsg.includes("API has not been used") || errorMsg.includes("disabled")) {
          return { 
            success: false, 
            error: "Cloud Firestore API is not enabled for project 'the-conservatory-d858b'. Visit the Cloud Console to enable it.", 
            code: 'API_DISABLED' 
          };
        }
        return { 
          success: false, 
          error: "Permission Denied. Check your Security Rules.", 
          code: 'PERMISSION_DENIED' 
        };
      }

      if (errorMsg.includes("offline")) {
        return { 
          success: false, 
          error: "Firestore is currently offline.", 
          code: 'OFFLINE' 
        };
      }
      
      return { success: false, error: errorMsg, code };
    }
  }
}

export const store = new ConservatoryStore();

export function useConservatory() {
  const [data, setData] = useState({
    events: store.getEvents(),
    entities: store.getEntities(),
    groups: store.getGroups(),
    pendingAction: store.getPendingAction(),
    user: store.getUser()
  });

  useEffect(() => {
    return store.subscribe(() => {
      setData({
        events: store.getEvents(),
        entities: store.getEntities(),
        groups: store.getGroups(),
        pendingAction: store.getPendingAction(),
        user: store.getUser()
      });
    });
  }, []);

  return {
    ...data,
    login: useCallback(() => store.login(), []),
    logout: useCallback(() => store.logout(), []),
    processVoiceInput: useCallback((text: string) => store.processVoiceInput(text), []),
    commitPendingAction: useCallback(() => store.commitPendingAction(), []),
    discardPending: useCallback(() => store.discardPending(), []),
    updateSlot: useCallback((path: string, val: any) => store.updateSlot(path, val), []),
    updateEntity: useCallback((id: string, updates: Partial<Entity>) => store.updateEntity(id, updates), []),
    addGroup: useCallback((name: string) => store.addGroup(name), []),
    testConnection: useCallback(() => store.testConnection(), [])
  };
}