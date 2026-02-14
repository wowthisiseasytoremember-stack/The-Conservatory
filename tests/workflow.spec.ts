import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

/** Bypass auth and install Gemini mocks before each test */
async function setupTestEnvironment(page: Page) {
  await page.goto('/');
  
  await page.evaluate(() => {
    // 1. Bypass Google Auth
    // @ts-ignore
    window.setTestUser({ uid: 'e2e-test-user', email: 'e2e@test.com', displayName: 'E2E Tester' });

    // 2. Mock Gemini AI (voice parser)
    // @ts-ignore
    window.mockGeminiParse = (text: string) => {
      // --- CREATE HABITAT ---
      if (text.match(/create.*tank.*called/i)) {
        const name = text.split(/called\s+/i)[1]?.replace(/[.!?]$/, '').trim() || 'Unknown';
        return Promise.resolve({
          intent: 'MODIFY_HABITAT',
          targetHabitatName: name,
          habitatParams: { name, type: 'Freshwater', size: 20, unit: 'gallon' },
          aiReasoning: 'Mock: Creating habitat'
        });
      }
      // --- CREATE SALTWATER HABITAT ---
      if (text.match(/create.*saltwater.*called/i) || text.match(/create.*reef.*called/i)) {
        const name = text.split(/called\s+/i)[1]?.replace(/[.!?]$/, '').trim() || 'Unknown';
        return Promise.resolve({
          intent: 'MODIFY_HABITAT',
          targetHabitatName: name,
          habitatParams: { name, type: 'Saltwater', size: 40, unit: 'gallon' },
          aiReasoning: 'Mock: Creating saltwater habitat'
        });
      }
      // --- ADD ENTITIES ---
      if (text.match(/added.*neon tetra/i)) {
        const habitatName = text.split(/to\s+/i).pop()?.replace(/[.!?]$/, '').trim() || 'Unknown';
        return Promise.resolve({
          intent: 'ACCESSION_ENTITY',
          targetHabitatName: habitatName,
          candidates: [
            { commonName: 'Neon Tetra', scientificName: 'Paracheirodon innesi', quantity: 12, traits: [{ type: 'AQUATIC', parameters: {} }] },
            { commonName: 'Cherry Shrimp', scientificName: 'Neocaridina davidi', quantity: 5, traits: [{ type: 'INVERTEBRATE', parameters: {} }] }
          ],
          aiReasoning: 'Mock: Adding fauna'
        });
      }
      // --- ADD PLANTS ---
      if (text.match(/planted.*java fern/i)) {
        const habitatName = text.split(/in\s+/i).pop()?.replace(/[.!?]$/, '').trim() || 'Unknown';
        return Promise.resolve({
          intent: 'ACCESSION_ENTITY',
          targetHabitatName: habitatName,
          candidates: [
            { commonName: 'Java Fern', scientificName: 'Microsorum pteropus', quantity: 3, traits: [{ type: 'PHOTOSYNTHETIC', parameters: { placement: 'midground' } }] }
          ],
          aiReasoning: 'Mock: Adding plants'
        });
      }
      // --- LOG OBSERVATION ---
      if (text.match(/pH.*is/i) || text.match(/temperature.*is/i)) {
        const habitatName = text.split(/in\s+/i)[1]?.split(/\s+is/i)[0]?.trim() || 'Unknown';
        return Promise.resolve({
          intent: 'LOG_OBSERVATION',
          targetHabitatName: habitatName,
          observationParams: { pH: 6.8, temp: 78, ammonia: 0 },
          observationNotes: text,
          aiReasoning: 'Mock: Logging water parameters'
        });
      }
      // --- AMBIGUOUS (triggers Strategy Agent) ---
      if (text.match(/do the thing/i) || text.match(/help me with/i)) {
        return Promise.resolve({
          intent: null,
          isAmbiguous: true,
          aiReasoning: 'Mock: Ambiguous input'
        });
      }
      // --- FALLBACK ---
      return Promise.resolve({
        intent: 'LOG_OBSERVATION',
        observationNotes: text,
        aiReasoning: 'Mock: Fallback observation'
      });
    };

    // 3. Mock Strategy Agent (for ambiguous inputs)
    // @ts-ignore
    window.mockGeminiStrategy = () => {
      return Promise.resolve({
        advice: 'Could you be more specific about what you want to do?',
        suggestedCommand: 'Create a 20 gallon tank called My Tank.',
        technicalSteps: ['Step 1: Clarify intent', 'Step 2: Execute']
      });
    };

    // 4. Mock Chat
    // @ts-ignore
    window.mockGeminiChat = () => {
      return Promise.resolve({ text: 'Mock chat response about Neon Tetra care.' });
    };
  });

  // Wait for the authenticated app to render
  await expect(page.locator('h1')).toContainText(/Activity|Collection/, { timeout: 10000 });
}

/** Send a voice command via the global processVoiceInput function */
async function sendVoiceCommand(page: Page, text: string) {
  await page.evaluate((t) => {
    // @ts-ignore
    window.processVoiceInput(t);
  }, text);
}

/** Wait for the confirmation card to appear */
async function waitForConfirmation(page: Page) {
  await expect(page.locator('text=Confirm & Save')).toBeVisible({ timeout: 10000 });
}

/** Click Confirm & Save */
async function confirmAction(page: Page) {
  await page.locator('button:has-text("Confirm & Save")').click();
  // Wait for the card to dismiss
  await expect(page.locator('text=Confirm & Save')).not.toBeVisible({ timeout: 5000 });
}

/** Switch to the Collection tab */
async function goToCollection(page: Page) {
  await page.locator('button:has-text("Collection")').click();
  await page.waitForTimeout(500);
}

/** Switch to the Feed tab */
async function goToFeed(page: Page) {
  await page.locator('button:has-text("Feed")').click();
  await page.waitForTimeout(500);
}


// ===========================================================================
// TEST SUITE
// ===========================================================================

test.describe('The Conservatory – Core Workflows', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage between tests for isolation
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER_ERROR: ${msg.text()}`);
    });
  });

  // -------------------------------------------------------------------------
  // 1. CREATE HABITAT
  // -------------------------------------------------------------------------
  test('can create a habitat via voice', async ({ page }) => {
    const name = `Reef-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);

    // Confirmation card should appear with the habitat name
    await waitForConfirmation(page);
    await expect(page.locator(`text=${name}`)).toBeVisible();
    await expect(page.locator('text=MODIFY HABITAT')).toBeVisible();

    await confirmAction(page);

    // Navigate to Collection and verify habitat exists
    await goToCollection(page);
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 2. ADD ENTITIES TO HABITAT
  // -------------------------------------------------------------------------
  test('can add entities to a habitat', async ({ page }) => {
    // First, create a habitat
    const hab = `Shallows-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Now add entities
    await sendVoiceCommand(page, `I just added 12 Neon Tetras and 5 Cherry Shrimp to ${hab}.`);
    await waitForConfirmation(page);

    // Both candidates should be visible
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
    await expect(page.locator('text=ACCESSION ENTITY')).toBeVisible();

    await confirmAction(page);

    // Verify in Collection
    await goToCollection(page);
    await expect(page.locator('text=Neon Tetra')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 3. LOG OBSERVATION
  // -------------------------------------------------------------------------
  test('can log water parameters as an observation', async ({ page }) => {
    const hab = `TestTank-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Log observation
    await sendVoiceCommand(page, `The pH in ${hab} is 6.8 and the temperature is 78 degrees.`);
    await waitForConfirmation(page);

    // Should show observation metrics
    await expect(page.locator('text=LOG OBSERVATION')).toBeVisible();
    
    await confirmAction(page);

    // Verify the event appears in the feed
    await goToFeed(page);
    await expect(page.locator('text=OBSERVATION_LOGGED').first()).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 4. DISCARD PENDING ACTION
  // -------------------------------------------------------------------------
  test('can discard a pending action via Cancel', async ({ page }) => {
    await sendVoiceCommand(page, `Create a 20 gallon tank called DiscardMe.`);
    await waitForConfirmation(page);
    await expect(page.locator('text=DiscardMe')).toBeVisible();

    // Click Cancel
    await page.locator('button:has-text("Cancel")').first().click();

    // Confirmation card should disappear
    await expect(page.locator('text=Confirm & Save')).not.toBeVisible({ timeout: 3000 });

    // Navigate to Collection — DiscardMe should NOT exist
    await goToCollection(page);
    await expect(page.locator('text=DiscardMe')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 5. DUPLICATE PREVENTION
  // -------------------------------------------------------------------------
  test('prevents duplicate habitats with the same name', async ({ page }) => {
    const name = `DupeTest-${Date.now()}`;

    // Create it once
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Try to create it again
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Go to Collection – should only have 1 instance
    await goToCollection(page);
    const count = await page.locator(`button:has-text("${name}")`).count();
    expect(count).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 6. FULL WORKFLOW: Create → Add → Observe
  // -------------------------------------------------------------------------
  test('full CUJ: Create Habitat → Add Entities → Log Observation', async ({ page }) => {
    const hab = `FullTest-${Date.now()}`;

    // Step 1: Create Habitat
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Step 2: Add Entities
    await sendVoiceCommand(page, `I just added 12 Neon Tetras and 5 Cherry Shrimp to ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Step 3: Log Observation
    await sendVoiceCommand(page, `The pH in ${hab} is 6.8 and the temperature is 78 degrees.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Verify: Feed should have the events
    await goToFeed(page);
    const feedItems = await page.locator('[class*="border-slate"]').count();
    expect(feedItems).toBeGreaterThan(0);

    // Verify: Collection should have the habitat + entities
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 7. LOCALSTORAGE PERSISTENCE
  // -------------------------------------------------------------------------
  test('data persists across page reloads via localStorage', async ({ page }) => {
    const hab = `PersistTest-${Date.now()}`;

    // Create and commit
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Verify it exists BEFORE reload
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();

    // Reload the page (re-setup test env since auth resets)
    await setupTestEnvironment(page);

    // Verify it still exists AFTER reload
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 8. ADD PLANTS (PHOTOSYNTHETIC TRAIT)
  // -------------------------------------------------------------------------
  test('can add plants with photosynthetic traits', async ({ page }) => {
    const hab = `PlantTank-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    await sendVoiceCommand(page, `I just planted 3 Java Fern in ${hab}.`);
    await waitForConfirmation(page);
    await expect(page.locator('text=Java Fern')).toBeVisible();
    await confirmAction(page);

    await goToCollection(page);
    await expect(page.locator('text=Java Fern')).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 9. RAPID FIRE: Multiple entities in sequence
  // -------------------------------------------------------------------------
  test('can handle rapid sequential voice commands', async ({ page }) => {
    const hab = `RapidTest-${Date.now()}`;
    
    // Create habitat
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(300);

    // Add fauna
    await sendVoiceCommand(page, `I just added 12 Neon Tetras and 5 Cherry Shrimp to ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(300);

    // Add plants
    await sendVoiceCommand(page, `I just planted 3 Java Fern in ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(300);

    // Log observation
    await sendVoiceCommand(page, `The pH in ${hab} is 6.8 and the temperature is 78 degrees.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(300);

    // Verify all entities + habitat in Collection
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
    await expect(page.locator('text=Java Fern')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 10. LOCALSTORAGE: Verify entities and events are saved correctly
  // -------------------------------------------------------------------------
  test('localStorage contains correct serialized data after commit', async ({ page }) => {
    const hab = `StorageCheck-${Date.now()}`;
    
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Read localStorage directly
    const stored = await page.evaluate(() => {
      return {
        entities: JSON.parse(localStorage.getItem('conservatory_entities') || '[]'),
        events: JSON.parse(localStorage.getItem('conservatory_events') || '[]'),
      };
    });

    expect(stored.entities.length).toBeGreaterThan(0);
    expect(stored.events.length).toBeGreaterThan(0);

    const habitat = stored.entities.find((e: any) => e.name === hab);
    expect(habitat).toBeTruthy();
    expect(habitat.type).toBe('HABITAT');
    expect(habitat.traits).toBeTruthy();
    expect(habitat.traits.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// ERROR & EDGE CASE SUITE
// ===========================================================================

test.describe('The Conservatory – Error Handling & Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
  });

  // -------------------------------------------------------------------------
  // 11. EMPTY INPUT
  // -------------------------------------------------------------------------
  test('handles empty string input gracefully', async ({ page }) => {
    await sendVoiceCommand(page, '');
    // Should not crash — either no card appears or a fallback card appears
    await page.waitForTimeout(1000);
    // App should still be functional
    await expect(page.locator('h1')).toContainText(/Activity|Collection/);
  });

  // -------------------------------------------------------------------------
  // 12. TAB SWITCHING preserves state
  // -------------------------------------------------------------------------
  test('tab switching preserves created data', async ({ page }) => {
    const hab = `TabTest-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await waitForConfirmation(page);
    await confirmAction(page);
    await page.waitForTimeout(500);

    // Go to Collection
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();

    // Go to Feed
    await goToFeed(page);
    await expect(page.locator('h1')).toContainText('Activity');

    // Go back to Collection — data should still be there
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();
  });
});
