
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../../services/store';
import { EntityType, IdentifyResult } from '../../types';
import { taxonomyService } from '../../services/taxonomy';
import { calculateHabitatHealth } from '../../services/ecosystem';

/**
 * MASTER WORKFLOW INTEGRATION SUITE
 * 
 * This suite tests the end-to-end flow of the application logic
 * without requiring a browser or live Firebase connection.
 * It uses the actual Store and Service logic with mocked network layers.
 */

describe('Master Workflow: Photo -> Accession -> Enrichment -> Observation -> Health', () => {
  
  beforeEach(() => {
    // Reset store and mocks
    store.clearMessages();
    // @ts-ignore - access private entities for reset
    store.entities = [];
    // @ts-ignore
    store.events = [];
    
    // Mock window.confirm for the "Clear DB" logic if needed
    global.window = { 
      confirm: vi.fn(() => true),
      // @ts-ignore
      location: { href: 'http://localhost' },
      // @ts-ignore
      navigator: { userAgent: 'vitest' },
      // @ts-ignore
      __TEST_MODE__: true,
      // @ts-ignore
      Image: class {
        src: string = '';
        onload: () => void = () => {};
        onerror: () => void = () => {};
        width: number = 100;
        height: number = 100;
        constructor() {
          // Trigger onload immediately
          setTimeout(() => this.onload(), 0);
        }
      },
      // @ts-ignore
      document: {
        createElement: (tag: string) => {
          if (tag === 'canvas') {
            return {
              getContext: () => ({
                drawImage: vi.fn(),
              }),
              toDataURL: () => 'data:image/jpeg;base64,compresseddata',
              width: 0,
              height: 0
            };
          }
          return {};
        }
      }
    } as any;

    // @ts-ignore
    global.Image = global.window.Image;
    // @ts-ignore
    global.document = global.window.document;

    // Reset store state
    // @ts-ignore
    store.entities = [];
  });

  it('should complete the full lifecycle of a biological accession', async () => {
    // 1. SETUP: Create a Habitat
    const habitatId = 'test-habitat-123';
    // @ts-ignore
    store.entities.push({
      id: habitatId,
      name: 'The Shallows',
      type: EntityType.HABITAT,
      traits: [{ type: 'AQUATIC', parameters: { pH: 7.0, temp: 78 } }],
      created_at: Date.now(),
      updated_at: Date.now(),
      confidence: 1,
      aliases: [],
      enrichment_status: 'complete'
    });

    // 2. VISION: Identify a species (Simulated Vision Result)
    const visionResult: IdentifyResult = {
      common_name: 'Neon Tetra',
      species: 'Paracheirodon innesi',
      kingdom: 'Animalia',
      confidence: 0.98,
      reasoning: 'Distinct blue iridescent stripe and red tail.'
    };
    const mockImage = 'data:image/jpeg;base64,mockdata';

    // 3. ACCESSION: Create pending action from vision
    vi.spyOn(taxonomyService, 'resolveVisionResult').mockResolvedValue(null);
    await store.createActionFromVision(visionResult, mockImage, habitatId);
    
    const pending = store.getPendingAction();
    expect(pending).toBeTruthy();
    expect(pending?.intent).toBe('ACCESSION_ENTITY');
    expect(pending?.candidates[0].commonName).toBe('Neon Tetra');
    expect(pending?.imageBase64).toBe(mockImage);

    // 4. COMMIT: Save to "database"
    // Mock autoEnrich to bypass library permissions
    vi.spyOn(taxonomyService, 'autoEnrich').mockImplementation(async (e) => e);

    // Mock image upload
    const { imageService } = await import('../../services/imageService');
    vi.spyOn(imageService, 'uploadImage').mockResolvedValue('http://mock-storage/photo.jpg');
    // Also mock compress to avoid async canvas issues in test
    vi.spyOn(imageService, 'compressImage').mockResolvedValue('mock-data');

    await store.commitPendingAction();
    
    const entities = store.getEntities();
    const fish = entities.find(e => e.name === 'Neon Tetra');
    expect(fish).toBeTruthy();
    expect(fish?.habitat_id).toBe(habitatId);
    expect(fish?.enrichment_status).toBe('queued');
    // Check if photo was "persisted"
    expect(fish?.overflow?.images?.[0]).toBe('http://mock-storage/photo.jpg');

    // 5. ENRICHMENT: Run serial enrichment
    vi.spyOn(store, 'enrichEntity').mockImplementation(async (id) => {
      const e = store.getEntities().find(ent => ent.id === id);
      if (e) {
        await store.updateEntity(id, { 
          enrichment_status: 'complete',
          overflow: { ...e.overflow, discovery: { mechanism: 'Guanine crystals refract light.' } }
        });
      }
      return 'Guanine crystals refract light.';
    });

    await store.deepResearch([fish!.id]);
    
    const enrichedFish = store.getEntities().find(e => e.name === 'Neon Tetra');
    expect(enrichedFish?.enrichment_status).toBe('complete');
    expect(enrichedFish?.overflow?.discovery?.mechanism).toContain('Guanine');

    // 6. OBSERVATION: Log a parameter change via bulk command
    const bulkTranscript = "Every habitat pH is 4.0";
    
    // Bypass actual Gemini call
    const { geminiService } = await import('../../services/geminiService');
    vi.spyOn(geminiService, 'parseVoiceCommand').mockResolvedValue({
      intent: 'LOG_OBSERVATION',
      observationParams: { pH: 4.0 },
      aiReasoning: 'Bulk update detected'
    });

    await store.processVoiceInput(bulkTranscript);
    const bulkPending = store.getPendingAction();
    expect(bulkPending?.isBulk).toBe(true);
    
    await store.commitPendingAction();

    // Verify both habitat and fish got the update
    const updatedHab = store.getEntities().find(e => e.id === habitatId);
    const updatedFish = store.getEntities().find(e => e.name === 'Neon Tetra');
    
    expect(updatedHab?.observations?.some(o => o.value === 4.0)).toBe(true);
    expect(updatedFish?.observations?.some(o => o.value === 4.0)).toBe(true);

    // 7. HEALTH: Verify health engine
    const health = store.getHabitatHealth(habitatId);
    // 5 points for 1 species
    // Stability score (4.0 vs target 7.0 = 3.0 diff = 30 penalty) -> 40-30 = 10
    // Recency = 20
    // Total: ~35
    expect(health.score).toBeGreaterThan(0);
    expect(health.factors.stability).toBe(10); 
  });

  it('should prevent incompatible species from aligning in health warnings', async () => {
    // Test Compatibility logic
    const predator: any = { 
      name: 'Pike', 
      traits: [{ type: 'VERTEBRATE', parameters: { diet: 'carnivore' } }, { type: 'AQUATIC', parameters: { pH: 7.0 } }] 
    };
    const prey: any = { 
      name: 'Shrimp', 
      traits: [{ type: 'INVERTEBRATE', parameters: {} }, { type: 'AQUATIC', parameters: { pH: 7.0 } }] 
    };

    // This is a future win #7 logic check
    // For now we check our current ecosystem.ts implementation
    const { checkCompatibility } = await import('../../services/ecosystem');
    const result = checkCompatibility(predator, prey);
    
    // Our current check is pH and Temp based
    expect(result.compatible).toBe(true); // Since pH matches

    // Now test pH mismatch
    const acidicFish: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 5.5 } }] };
    const alkalineFish: any = { traits: [{ type: 'AQUATIC', parameters: { pH: 8.5 } }] };
    
    const badMatch = checkCompatibility(acidicFish, alkalineFish);
    expect(badMatch.compatible).toBe(false);
    expect(badMatch.reason).toContain('pH');
  });
});
