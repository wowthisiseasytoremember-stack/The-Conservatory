import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppEvent, Entity, EntityGroup, PendingAction, ChatMessage, ResearchProgress, User, EventStatus, DomainEvent, EntityType } from '../../types';
import { STORAGE_KEYS } from '../../src/constants';
import { geminiService } from '../geminiService';
import { logger } from '../logger';
import { db, collection, doc, writeBatch, serverTimestamp, updateDoc } from '../firebase';
import { queryClient } from '../../index';

interface ConservatoryState {
  pendingAction: PendingAction | null;
  liveTranscript: string;
  activeHabitatId: string | null;
  researchProgress: ResearchProgress;

  // Actions
  setPendingAction: (action: PendingAction | null) => void;
  setLiveTranscript: (text: string) => void;
  setActiveHabitatId: (id: string | null) => void;
  
  // Business Logic Actions
  processVoiceInput: (text: string, entities: Entity[]) => Promise<void>;
  commitAction: (action: PendingAction, entities: Entity[]) => Promise<void>;
  
  // Enrichment Actions
  enrichEntity: (entityId: string) => Promise<any>;
  deepResearchHabitat: (habitatId: string) => Promise<void>;
  resetResearchProgress: () => void;
}

export const useConservatoryStore = create<ConservatoryState>((set, get) => ({
  pendingAction: null,
  liveTranscript: '',
  activeHabitatId: localStorage.getItem(STORAGE_KEYS.HABITAT_ID),
  researchProgress: {
    isActive: false,
    totalEntities: 0,
    completedEntities: 0,
    currentEntityIndex: -1,
    currentEntity: null,
    currentStage: null,
    entityResults: [],
    discoveries: []
  },

  setPendingAction: (pendingAction) => set({ pendingAction }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setActiveHabitatId: (id) => {
    set({ activeHabitatId: id });
    if (id) localStorage.setItem(STORAGE_KEYS.HABITAT_ID, id);
    else localStorage.removeItem(STORAGE_KEYS.HABITAT_ID);
  },

  processVoiceInput: async (text, entities) => {
    set({ pendingAction: { status: 'ANALYZING', transcript: text, intent: null, candidates: [], aiReasoning: "Analyzing...", isAmbiguous: false } });
    
    try {
      const result = await geminiService.parseVoiceCommand(text, entities);
      set({ 
        pendingAction: {
          status: 'CONFIRMING',
          transcript: text,
          intent: result.intent,
          targetHabitatName: result.targetHabitatName,
          candidates: result.candidates || [],
          observationParams: result.observationParams,
          aiReasoning: result.aiReasoning,
          isAmbiguous: result.isAmbiguous
        }
      });
    } catch (e: any) {
      logger.error({ err: e }, "Voice parsing failed");
      set({ pendingAction: { status: 'ERROR', transcript: text, intent: null, aiReasoning: e.message, candidates: [] } });
    }
  },

  commitAction: async (action, entities) => {
    const batch = writeBatch(db);
    
    // Create the event record
    const eventRef = doc(collection(db, 'events'));
    batch.set(eventRef, {
      type: action.intent === 'ACCESSION_ENTITY' ? 'ENTITY_ACCESSIONED' : 'OBSERVATION_LOGGED',
      timestamp: serverTimestamp(),
      payload: action,
      metadata: { source: 'voice', originalTranscript: action.transcript }
    });

    if (action.intent === 'ACCESSION_ENTITY') {
      action.candidates.forEach(cand => {
        const id = uuidv4();
        const entityRef = doc(db, 'entities', id);
        batch.set(entityRef, {
          name: cand.commonName,
          scientificName: cand.scientificName,
          type: 'ORGANISM',
          confidence: 0.9,
          created_at: Date.now(),
          updated_at: Date.now(),
          traits: cand.traits,
          enrichment_status: 'queued'
        });
      });
    }

    await batch.commit();
    set({ pendingAction: null });
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    logger.info("Action committed to Firestore");
  },

  enrichEntity: async (entityId: string) => {
    const entityRef = doc(db, 'entities', entityId);
    await updateDoc(entityRef, { enrichment_status: 'pending' });

    try {
      const entities = queryClient.getQueryData<Entity[]>(['entities']) || [];
      const entity = entities.find(e => e.id === entityId);
      
      if (!entity) throw new Error("Entity not found for enrichment");

      logger.info({ entityName: entity.name }, "Triggering Deep Research Scraper");

      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityName: entity.scientificName || entity.name })
      });

      if (!response.ok) {
        throw new Error(`Enrichment service failed: ${response.statusText}`);
      }

      const { enrichedData } = await response.json();
      
      await updateDoc(entityRef, {
        enrichedData,
        enrichment_status: 'complete',
        updated_at: Date.now()
      });

      queryClient.invalidateQueries({ queryKey: ['entities'] });

      // Show Success Toast
      const { toastManager } = await import('../../components/Toast');
      const preview = enrichedData.description?.split('.')[0] || "Dossier synthesized.";
      toastManager.success(`🧬 Enriched ${entity.name}: ${preview}...`, 8000);

      return enrichedData;
    } catch (e: any) {
      logger.error({ err: e, entityId }, "Enrichment failed");
      await updateDoc(entityRef, { enrichment_status: 'failed' });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      throw e;
    }
  },

  deepResearchHabitat: async (habitatId: string) => {
    const entities = queryClient.getQueryData<Entity[]>(['entities']) || [];
    const residents = entities.filter(e => e.habitat_id === habitatId && e.enrichment_status === 'queued');

    if (residents.length === 0) return;

    set(state => ({ researchProgress: { ...state.researchProgress, isActive: true, totalEntities: residents.length, completedEntities: 0 } }));

    for (let i = 0; i < residents.length; i++) {
      const entity = residents[i];
      set(state => ({ researchProgress: { ...state.researchProgress, currentEntity: { id: entity.id, name: entity.name }, currentEntityIndex: i } }));
      
      try {
        await get().enrichEntity(entity.id);
        set(state => ({ 
          researchProgress: { 
            ...state.researchProgress, 
            completedEntities: state.researchProgress.completedEntities + 1,
            discoveries: [...state.researchProgress.discoveries, { entityId: entity.id, entityName: entity.name, mechanism: 'New discovery logged.' }]
          } 
        }));
      } catch (e) {
        logger.error({ err: e, entityId: entity.id }, "Deep research failed for entity");
      }
    }

    set(state => ({ researchProgress: { ...state.researchProgress, isActive: false } }));
  },

  resetResearchProgress: () => set({
    researchProgress: {
      isActive: false,
      totalEntities: 0,
      completedEntities: 0,
      currentEntityIndex: -1,
      currentEntity: null,
      currentStage: null,
      entityResults: [],
      discoveries: []
    }
  })
}));
