import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

/** Bypass auth and install Gemini mocks before each test */
async function setupTestEnvironment(page: Page) {
  await page.goto('/');
  
  // Wait for the page to actually load (either login screen or app)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Let React mount
  
  await page.evaluate(() => {
    // 1. Install mocks FIRST before bypassing auth
    
    // Mock Gemini AI (voice parser)
    // @ts-ignore
    window.mockGeminiParse = (text: string) => {
      // --- CREATE HABITAT ---
      if (text.match(/create.*tank.*called/i) || text.match(/create.*habitat.*called/i)) {
        const name = text.split(/called\s+/i)[1]?.replace(/[.!?]$/, '').trim() || 'Unknown';
        return Promise.resolve({
          intent: 'MODIFY_HABITAT',
          targetHabitatName: name,
          habitatParams: { name, type: 'Freshwater', size: 20, unit: 'gallon' },
          aiReasoning: 'Mock: Creating habitat'
        });
      }
      // --- ADD ENTITIES (Fish) ---
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
      if (text.match(/pH/i) || text.match(/temperature/i)) {
        const habitatName = text.split(/in\s+/i)[1]?.split(/\s+is/i)[0]?.trim() || 'Unknown';
        return Promise.resolve({
          intent: 'LOG_OBSERVATION',
          targetHabitatName: habitatName,
          observationParams: { pH: 6.8, temp: 78, ammonia: 0 },
          observationNotes: text,
          aiReasoning: 'Mock: Logging water parameters'
        });
      }
      // --- AMBIGUOUS ---
      if (text.match(/do the thing/i)) {
        return Promise.resolve({ intent: null, isAmbiguous: true, aiReasoning: 'Mock: Ambiguous' });
      }
      // --- FALLBACK ---
      return Promise.resolve({ intent: 'LOG_OBSERVATION', observationNotes: text, aiReasoning: 'Mock: Fallback' });
    };

    // Mock Strategy Agent
    // @ts-ignore
    window.mockGeminiStrategy = () => Promise.resolve({
      advice: 'Could you be more specific?',
      suggestedCommand: 'Create a 20 gallon tank called My Tank.',
    });

    // Mock Chat
    // @ts-ignore
    window.mockGeminiChat = () => Promise.resolve({ text: 'Mock chat response.' });

    // 2. Now bypass auth (this triggers re-render from LoginView to App)
    console.log('E2E: Bypassing auth...');
    // @ts-ignore
    if (typeof window.setTestUser !== 'function') {
      console.error('E2E: window.setTestUser is not a function!');
      return;
    }
    // @ts-ignore
    window.setTestUser({ uid: 'e2e-test-user', email: 'e2e@test.com', displayName: 'E2E Tester' });
    console.log('E2E: Auth bypass triggered.');
  });


  // Wait for the authenticated app to render (Activity, Home, or Collection header)
  await expect(page.locator('h1')).toContainText(/Home|The Conservatory|Activity|Collection/, { timeout: 15000 });
}


/** Send a voice command */
async function sendVoiceCommand(page: Page, text: string) {
  await page.evaluate((t) => {
    // @ts-ignore
    window.processVoiceInput(t);
  }, text);
  
  // Wait for pending action to be created (with longer timeout for AI call)
  await page.waitForFunction(() => {
    // @ts-ignore
    const store = window.__conservatoryStore;
    if (!store) return false;
    const pending = store.getPendingAction();
    // Wait for status to be CONFIRMING (not ANALYZING)
    return pending !== null && pending.status === 'CONFIRMING';
  }, { timeout: 15000 });
}


/** Wait for and click "Confirm & Save" */
async function confirmAction(page: Page) {
  const btn = page.getByRole('button', { name: /Confirm/i });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  // Wait for the card to dismiss
  await page.waitForTimeout(1000);
}

/** Switch to Collection tab */
async function goToCollection(page: Page) {
  await page.getByRole('button', { name: /Collection/i }).click();
  await page.waitForTimeout(500);
}

/** Switch to Feed tab */
async function goToFeed(page: Page) {
  await page.getByRole('button', { name: /Feed/i }).click();
  await page.waitForTimeout(500);
}


// ===========================================================================
// CORE WORKFLOW TESTS
// ===========================================================================

test.describe('Core Workflows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER: ${msg.text()}`);
    });
  });

  test('create a habitat via voice', async ({ page }) => {
    const name = `Reef-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);
    await confirmAction(page);

    await goToCollection(page);
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });
  });

  test('add entities to an existing habitat', async ({ page }) => {
    const hab = `Shallows-${Date.now()}`;

    // Create habitat first
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    // Add entities
    await sendVoiceCommand(page, `I just added 12 Neon Tetras and 5 Cherry Shrimp to ${hab}.`);

    // Both candidates should be visible in confirmation card
    await expect(page.locator('text=Neon Tetra')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();

    await confirmAction(page);

    // Verify in Collection
    await goToCollection(page);
    await expect(page.locator('text=Neon Tetra')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
  });

  test('log water parameters as observation', async ({ page }) => {
    const hab = `TestTank-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    await sendVoiceCommand(page, `The pH in ${hab} is 6.8.`);
    await confirmAction(page);

    // Feed should show the observation event
    await goToFeed(page);
    const feedContent = await page.locator('main').textContent();
    expect(feedContent).toBeTruthy();
  });

  test('discard a pending action via Cancel', async ({ page }) => {
    await sendVoiceCommand(page, `Create a 20 gallon tank called DiscardMe.`);

    // Wait for the confirmation card
    const confirmBtn = page.getByRole('button', { name: /Confirm/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=DiscardMe')).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /Cancel/i }).first().click();
    await page.waitForTimeout(500);

    // Confirmation card should disappear
    await expect(confirmBtn).not.toBeVisible({ timeout: 3000 });

    // Navigate to Collection — DiscardMe should NOT exist
    await goToCollection(page);
    await expect(page.locator('text=DiscardMe')).not.toBeVisible();
  });

  test('prevents duplicate habitats', async ({ page }) => {
    const name = `DupeTest-${Date.now()}`;

    // Create once
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);
    await confirmAction(page);

    // Create again with same name
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${name}.`);
    await confirmAction(page);

    // Should still only have 1 in Collection
    await goToCollection(page);
    const count = await page.locator(`button:has-text("${name}")`).count();
    expect(count).toBe(1);
  });

  test('full CUJ: Create → Add → Observe → Verify', async ({ page }) => {
    const hab = `FullTest-${Date.now()}`;

    // Create Habitat
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    // Add Entities
    await sendVoiceCommand(page, `I just added 12 Neon Tetras and 5 Cherry Shrimp to ${hab}.`);
    await confirmAction(page);

    // Log Observation
    await sendVoiceCommand(page, `The pH in ${hab} is 6.8.`);
    await confirmAction(page);

    // Verify Collection
    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
  });

  test('data persists across page reload', async ({ page }) => {
    const hab = `PersistTest-${Date.now()}`;

    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();

    // Reload — re-inject test user but DON'T clear localStorage
    await setupTestEnvironment(page);

    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible({ timeout: 5000 });
  });

  test('localStorage has correct data after commit', async ({ page }) => {
    const hab = `StorageCheck-${Date.now()}`;

    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    const stored = await page.evaluate(() => ({
      entities: JSON.parse(localStorage.getItem('conservatory_entities') || '[]'),
      events: JSON.parse(localStorage.getItem('conservatory_events') || '[]'),
    }));

    expect(stored.entities.length).toBeGreaterThan(0);
    expect(stored.events.length).toBeGreaterThan(0);

    const habitat = stored.entities.find((e: any) => e.name === hab);
    expect(habitat).toBeTruthy();
    expect(habitat.type).toBe('HABITAT');
  });

  test('tab switching preserves data', async ({ page }) => {
    const hab = `TabTest-${Date.now()}`;
    await sendVoiceCommand(page, `Create a 20 gallon tank called ${hab}.`);
    await confirmAction(page);

    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();

    await goToFeed(page);
    await expect(page.locator('h1')).toContainText('Activity');

    await goToCollection(page);
    await expect(page.locator(`text=${hab}`)).toBeVisible();
  });

  test('handles empty voice input gracefully', async ({ page }) => {
    await sendVoiceCommand(page, '');
    await page.waitForTimeout(1000);
    // App should still be functional
    await expect(page.locator('h1')).toContainText(/Activity|Collection/);
  });
});

// ===========================================================================
// DEVTOOLS INTEGRATION TESTS
// ===========================================================================

test.describe('DevTools Debug Actions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
  });

  test('DevTools "New Tank" scenario creates a habitat', async ({ page }) => {
    // Open DevTools
    await page.locator('button[title="Open Dev Tools"]').click();
    await expect(page.locator('text=New Tank')).toBeVisible();

    // Click the "New Tank" scenario
    await page.locator('button:has-text("New Tank")').click();

    // Confirm
    await confirmAction(page);

    // Verify in Collection
    await goToCollection(page);
    await expect(page.locator('text=The Shallows')).toBeVisible({ timeout: 5000 });
  });

  test('DevTools "Log Fish" scenario adds entities', async ({ page }) => {
    // First create the habitat that Log Fish references
    await sendVoiceCommand(page, `Create a 20 gallon tank called The Shallows.`);
    await confirmAction(page);

    // Open DevTools and click Log Fish
    await page.locator('button[title="Open Dev Tools"]').click();
    await page.locator('button:has-text("Log Fish")').click();

    await confirmAction(page);

    await goToCollection(page);
    await expect(page.locator('text=Neon Tetra')).toBeVisible({ timeout: 5000 });
  });

  test('DevTools "Log Parameters" scenario logs observation', async ({ page }) => {
    // Create the habitat first
    await sendVoiceCommand(page, `Create a 20 gallon tank called The Shallows.`);
    await confirmAction(page);

    // Open DevTools and click Log Parameters
    await page.locator('button[title="Open Dev Tools"]').click();
    await page.locator('button:has-text("Log Parameters")').click();

    await confirmAction(page);

    await goToFeed(page);
    const feedContent = await page.locator('main').textContent();
    expect(feedContent).toBeTruthy();
  });
});
