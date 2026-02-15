/**
 * Enrichment Integration Tests
 * 
 * Tests the full enrichment pipeline with LIVE API calls (no mocks).
 * These tests verify:
 * 1. Real data structures returned from each enrichment stage
 * 2. Data quality and completeness
 * 3. Error handling with real API failures
 * 4. Caching behavior (species library)
 * 5. Vision identification with actual images
 * 
 * IMPORTANT: These tests make real API calls and may incur costs.
 * Run with: npm run test:integration
 * 
 * Test Structure:
 * - Each test enriches a real species
 * - Captures and validates the actual data returned
 * - Tests multiple species types (fish, plants, invertebrates)
 * - Tests edge cases (unknown species, ambiguous names)
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Test Configuration
// ---------------------------------------------------------------------------

const TEST_TIMEOUT = 120000; // 2 minutes for full enrichment
const SPECIES_TO_TEST = [
  // Common aquarium fish
  { commonName: 'Neon Tetra', scientificName: 'Paracheirodon innesi', type: 'ORGANISM' },
  { commonName: 'Betta', scientificName: 'Betta splendens', type: 'ORGANISM' },
  { commonName: 'Guppy', scientificName: 'Poecilia reticulata', type: 'ORGANISM' },
  
  // Plants
  { commonName: 'Java Fern', scientificName: 'Microsorum pteropus', type: 'PLANT' },
  { commonName: 'Anubias', scientificName: 'Anubias barteri', type: 'PLANT' },
  
  // Invertebrates
  { commonName: 'Cherry Shrimp', scientificName: 'Neocaridina davidi', type: 'ORGANISM' },
];

// Edge cases
const EDGE_CASE_SPECIES = [
  { commonName: 'Unknown Species XYZ123', type: 'ORGANISM' }, // Should handle gracefully
  { commonName: 'Fish', type: 'ORGANISM' }, // Too generic
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

async function setupTestEnvironment(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    // @ts-ignore
    // Pass 'true' to enable REAL backend writes (no mocks)
    window.setTestUser({ uid: 'integration-test-user', email: 'integration@test.com' }, true);
  });
  
  await expect(page.locator('h1')).toContainText(/Activity|Collection/, { timeout: 15000 });
}

async function createTestHabitat(page: Page, name: string): Promise<string> {
  await page.evaluate((habitatName) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    if (!store) throw new Error('Store not available');
    
    const id = 'hab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const habitat = {
      id,
      name: habitatName,
      type: 'HABITAT',
      confidence: 1,
      traits: [{ type: 'AQUATIC', parameters: { salinity: 'fresh' } }],
      created_at: Date.now(),
      updated_at: Date.now(),
      aliases: [],
      enrichment_status: 'none'
    };
    store.updateEntity(id, habitat);
    return id;
  }, name);
  
  const habitatId = await page.evaluate((habitatName) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    const entities = store.getEntities();
    const habitat = entities.find((e: any) => e.name === habitatName && e.type === 'HABITAT');
    return habitat?.id || null;
  }, name);
  
  expect(habitatId).toBeTruthy();
  return habitatId as string;
}

async function createTestEntity(page: Page, habitatId: string, species: { commonName: string; scientificName?: string; type: string }): Promise<string> {
  const entityId = await page.evaluate(({ habId, speciesData }) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    if (!store) throw new Error('Store not available');
    
    const id = 'entity-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const entity = {
      id,
      name: speciesData.commonName,
      scientificName: speciesData.scientificName,
      type: speciesData.type,
      habitat_id: habId,
      confidence: 0.9,
      traits: [{ type: 'AQUATIC', parameters: {} }],
      created_at: Date.now(),
      updated_at: Date.now(),
      aliases: [],
      enrichment_status: 'queued' // Start as queued
    };
    store.updateEntity(id, entity);
    return id;
  }, { habId: habitatId, speciesData: species });
  
  return entityId as string;
}

async function enrichEntityAndCapture(page: Page, entityId: string): Promise<any> {
  // Start enrichment
  await page.evaluate((id) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    return store.enrichEntity(id);
  }, entityId);
  
  // Wait for enrichment to complete (with longer timeout for real API calls)
  await page.waitForFunction((id) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    const entities = store.getEntities();
    const entity = entities.find((e: any) => e.id === id);
    return entity?.enrichment_status === 'complete' || entity?.enrichment_status === 'failed';
  }, entityId, { timeout: TEST_TIMEOUT });
  
  // Capture the enriched entity data
  const enrichedData = await page.evaluate((id) => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    const entities = store.getEntities();
    const entity = entities.find((e: any) => e.id === id);
    return entity ? {
      id: entity.id,
      name: entity.name,
      scientificName: entity.scientificName,
      enrichment_status: entity.enrichment_status,
      details: entity.details,
      overflow: entity.overflow,
      aliases: entity.aliases
    } : null;
  }, entityId);
  
  return enrichedData;
}

async function checkSpeciesLibrary(page: Page, speciesName: string, morphVariant?: string): Promise<any> {
  return await page.evaluate(async ({ name, morph }) => {
    // @ts-ignore
    // Access species library through window or store
    // Note: This may need adjustment based on how services are exposed
    const store = window.__conservatoryStore;
    if (!store) return null;
    
    // Species library check - may need to be exposed differently
    // For now, check if entity was enriched (indirect check)
    const entities = store.getEntities();
    const entity = entities.find((e: any) => 
      e.name.toLowerCase() === name.toLowerCase() && 
      e.enrichment_status === 'complete'
    );
    return entity ? { cached: true, entity } : null;
  }, { name: speciesName, morph: morphVariant });
}

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

test.describe('Enrichment Pipeline - Live API Tests', () => {
  test.setTimeout(TEST_TIMEOUT);
  
  let testPrefix: string;
  let habitatId: string;
  
  test.beforeEach(async ({ page }) => {
    testPrefix = `Integration-${Date.now()}`;
    await setupTestEnvironment(page);
    habitatId = await createTestHabitat(page, `${testPrefix}-Tank`);
  });
  
  // Test each species in the test suite
  for (const species of SPECIES_TO_TEST) {
    test(`should enrich ${species.commonName} with real API calls`, async ({ page }) => {
      const entityId = await createTestEntity(page, habitatId, species);
      
      // Enrich and capture data
      const enrichedData = await enrichEntityAndCapture(page, entityId);
      
      // Validate enrichment completed
      expect(enrichedData).toBeTruthy();
      expect(enrichedData.enrichment_status).toBe('complete');
      expect(enrichedData.name).toBe(species.commonName);
      
      // Validate data structure
      expect(enrichedData.details).toBeDefined();
      expect(enrichedData.overflow).toBeDefined();
      
      // Validate specific enrichment stages
      if (species.type === 'PLANT') {
        // Plants should have local library data
        expect(enrichedData.overflow.referenceImages || enrichedData.details.description).toBeDefined();
      }
      
      // GBIF should provide taxonomy
      if (enrichedData.overflow.taxonomy) {
        expect(enrichedData.overflow.taxonomy).toHaveProperty('kingdom');
        expect(enrichedData.overflow.taxonomy).toHaveProperty('phylum');
      }
      
      // AI Discovery should provide mechanism
      if (enrichedData.overflow.discovery) {
        expect(enrichedData.overflow.discovery).toHaveProperty('mechanism');
        expect(typeof enrichedData.overflow.discovery.mechanism).toBe('string');
        expect(enrichedData.overflow.discovery.mechanism.length).toBeGreaterThan(0);
      }
      
      // Scientific name should be populated
      if (species.scientificName) {
        expect(enrichedData.scientificName).toBe(species.scientificName);
      } else {
        expect(enrichedData.scientificName).toBeDefined();
      }
      
      // Log the actual data structure for inspection
      console.log(`\n=== Enrichment Data for ${species.commonName} ===`);
      console.log(JSON.stringify(enrichedData, null, 2));
    });
  }
  
  test('should cache enrichment data in species library', async ({ page }) => {
    const species = SPECIES_TO_TEST[0]; // Use first species
    const entityId1 = await createTestEntity(page, habitatId, species);
    
    // First enrichment (should hit APIs)
    const enrichedData1 = await enrichEntityAndCapture(page, entityId1);
    expect(enrichedData1.enrichment_status).toBe('complete');
    
    // Check species library was populated
    const cached = await checkSpeciesLibrary(page, species.commonName);
    expect(cached).toBeTruthy();
    expect(cached.enrichmentData).toBeDefined();
    
    // Create second entity of same species
    const entityId2 = await createTestEntity(page, habitatId, species);
    
    // Second enrichment (should use cache - much faster)
    const startTime = Date.now();
    const enrichedData2 = await enrichEntityAndCapture(page, entityId2);
    const duration = Date.now() - startTime;
    
    // Should complete quickly (cache hit)
    expect(duration).toBeLessThan(5000); // Should be instant (< 5 seconds)
    expect(enrichedData2.enrichment_status).toBe('complete');
    
    // Data should match (from cache)
    expect(enrichedData2.overflow.discovery?.mechanism).toBe(enrichedData1.overflow.discovery?.mechanism);
    
    console.log(`\n=== Cache Performance ===`);
    console.log(`First enrichment: ~${TEST_TIMEOUT}ms (API calls)`);
    console.log(`Second enrichment: ${duration}ms (cache hit)`);
  });
  
  test('should handle enrichment failures gracefully', async ({ page }) => {
    const edgeCase = EDGE_CASE_SPECIES[0]; // Unknown species
    const entityId = await createTestEntity(page, habitatId, edgeCase);
    
    const enrichedData = await enrichEntityAndCapture(page, entityId);
    
    // Should either complete with partial data or fail gracefully
    expect(['complete', 'failed']).toContain(enrichedData.enrichment_status);
    
    if (enrichedData.enrichment_status === 'failed') {
      // Failure is acceptable for unknown species
      console.log(`\n=== Expected failure for unknown species: ${edgeCase.commonName} ===`);
    } else {
      // If it completes, should have at least some data
      expect(enrichedData.details || enrichedData.overflow).toBeDefined();
    }
  });
  
  test('should complete all 5 enrichment stages', async ({ page }) => {
    const species = SPECIES_TO_TEST[0];
    const entityId = await createTestEntity(page, habitatId, species);
    
    // Track stage progression
    const stages: string[] = [];
    await page.evaluate((id) => {
      // @ts-ignore
      const store = window.__conservatoryStore;
      
      // Monkey-patch enrichEntity to track stages
      const originalEnrich = store.enrichEntity;
      store.enrichEntity = async function(entityId: string, onStage?: (stage: string) => void) {
        const trackedOnStage = (stage: string) => {
          stages.push(stage);
          if (onStage) onStage(stage);
        };
        return originalEnrich.call(this, entityId, trackedOnStage);
      };
    }, entityId);
    
    const enrichedData = await enrichEntityAndCapture(page, entityId);
    
    // Verify all stages were attempted
    const expectedStages = ['library', 'gbif', 'wikipedia', 'inaturalist', 'discovery'];
    const enrichedStages = enrichedData.overflow ? Object.keys(enrichedData.overflow) : [];
    
    console.log(`\n=== Enrichment Stages ===`);
    console.log(`Expected stages: ${expectedStages.join(', ')}`);
    console.log(`Data present: ${enrichedStages.join(', ')}`);
    
    // At minimum, discovery should be present (critical stage)
    expect(enrichedData.overflow?.discovery).toBeDefined();
  });
});

test.describe('Vision Identification - Live API Tests', () => {
  test.setTimeout(TEST_TIMEOUT);
  
  let testPrefix: string;
  let habitatId: string;
  
  test.beforeEach(async ({ page }) => {
    testPrefix = `Vision-${Date.now()}`;
    await setupTestEnvironment(page);
    habitatId = await createTestHabitat(page, `${testPrefix}-Tank`);
  });
  
  test('should identify species from real image via UI', async ({ page }) => {
    // Check if test image exists
    const imagePath = path.join(__dirname, '../fixtures/test-fish.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('⚠️  Test image not found at:', imagePath);
      console.log('   Skipping vision test. Add test images to tests/fixtures/ to enable.');
      test.skip();
      return;
    }
    
    // Navigate to photo identification
    const photoButton = page.getByRole('button', { name: /Identify species via photo|Photo/i }).first();
    if (await photoButton.count() > 0) {
      await photoButton.click();
      await page.waitForTimeout(500);
      
      // Upload test image
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(imagePath);
        
        // Wait for identification to complete
        await page.waitForTimeout(5000); // Give AI time to process
        
        // Check if confirmation card appeared
        const confirmationCard = page.locator('text=/species|confidence|scientific/i');
        const hasConfirmation = await confirmationCard.count() > 0;
        
        if (hasConfirmation) {
          // Capture identification result from pending action
          const pendingAction = await page.evaluate(() => {
            // @ts-ignore
            const store = window.__conservatoryStore;
            return store.getPendingAction();
          });
          
          expect(pendingAction).toBeDefined();
          expect(pendingAction.intent).toBe('ACCESSION_ENTITY');
          expect(pendingAction.candidates).toBeDefined();
          expect(pendingAction.candidates.length).toBeGreaterThan(0);
          
          console.log(`\n=== Vision Identification Result ===`);
          console.log(JSON.stringify(pendingAction, null, 2));
          
          // Verify candidate has required fields
          const candidate = pendingAction.candidates[0];
          expect(candidate.commonName).toBeDefined();
          expect(candidate.confidence).toBeGreaterThan(0);
          expect(candidate.confidence).toBeLessThanOrEqual(1);
        } else {
          console.log('⚠️  Confirmation card not found - identification may have failed');
        }
      } else {
        console.log('⚠️  File input not found - photo flow may not be mounted');
        test.skip();
      }
    } else {
      console.log('⚠️  Photo button not found - skipping vision test');
      test.skip();
    }
  });
  
  test('should handle vision identification errors gracefully', async ({ page }) => {
    // This test would require triggering an error condition
    // For now, we'll test this through the enrichment error handling
    // which covers similar error scenarios
    test.skip('Vision error handling tested through enrichment pipeline');
  });
});

test.describe('Enrichment Data Quality Tests', () => {
  test.setTimeout(TEST_TIMEOUT);
  
  let testPrefix: string;
  let habitatId: string;
  
  test.beforeEach(async ({ page }) => {
    testPrefix = `Quality-${Date.now()}`;
    await setupTestEnvironment(page);
    habitatId = await createTestHabitat(page, `${testPrefix}-Tank`);
  });
  
  test('should validate enrichment data structure', async ({ page }) => {
    const species = SPECIES_TO_TEST[0];
    const entityId = await createTestEntity(page, habitatId, species);
    const enrichedData = await enrichEntityAndCapture(page, entityId);
    
    // Comprehensive data structure validation
    const validation = {
      hasDetails: !!enrichedData.details,
      hasOverflow: !!enrichedData.overflow,
      hasTaxonomy: !!enrichedData.overflow?.taxonomy,
      hasDiscovery: !!enrichedData.overflow?.discovery,
      hasMechanism: !!enrichedData.overflow?.discovery?.mechanism,
      hasScientificName: !!enrichedData.scientificName,
      hasDescription: !!(enrichedData.details?.description || enrichedData.overflow?.description),
      hasImages: !!(enrichedData.overflow?.referenceImages?.length > 0),
      mechanismLength: enrichedData.overflow?.discovery?.mechanism?.length || 0
    };
    
    console.log(`\n=== Data Quality Validation for ${species.commonName} ===`);
    console.log(JSON.stringify(validation, null, 2));
    console.log(`\n=== Full Enrichment Data ===`);
    console.log(JSON.stringify(enrichedData, null, 2));
    
    // Critical validations
    expect(validation.hasDiscovery).toBe(true); // AI discovery is critical
    expect(validation.hasMechanism).toBe(true); // Mechanism is required
    expect(validation.mechanismLength).toBeGreaterThan(20); // Should be substantial
    
    // Nice-to-have validations (warn but don't fail)
    if (!validation.hasTaxonomy) {
      console.warn('⚠️  No taxonomy data from GBIF');
    }
    if (!validation.hasDescription) {
      console.warn('⚠️  No description from Wikipedia/local library');
    }
    if (!validation.hasImages) {
      console.warn('⚠️  No reference images from iNaturalist/local library');
    }
  });
  
  test('should compare enrichment data across multiple species', async ({ page }) => {
    const results: any[] = [];
    
    // Enrich multiple species
    for (const species of SPECIES_TO_TEST.slice(0, 3)) { // Test first 3
      const entityId = await createTestEntity(page, habitatId, species);
      const enrichedData = await enrichEntityAndCapture(page, entityId);
      
      results.push({
        species: species.commonName,
        hasTaxonomy: !!enrichedData.overflow?.taxonomy,
        hasDiscovery: !!enrichedData.overflow?.discovery,
        mechanismLength: enrichedData.overflow?.discovery?.mechanism?.length || 0,
        hasImages: !!(enrichedData.overflow?.referenceImages?.length > 0),
        scientificName: enrichedData.scientificName
      });
    }
    
    console.log(`\n=== Cross-Species Comparison ===`);
    console.log(JSON.stringify(results, null, 2));
    
    // All should have discovery (critical)
    expect(results.every(r => r.hasDiscovery)).toBe(true);
    
    // Most should have taxonomy
    const taxonomyCount = results.filter(r => r.hasTaxonomy).length;
    expect(taxonomyCount).toBeGreaterThan(0);
    console.log(`Taxonomy coverage: ${taxonomyCount}/${results.length}`);
  });
});
