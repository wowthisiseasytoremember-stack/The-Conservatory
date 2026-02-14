
import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared Helpers (copied from workflow.spec.ts to keep it self-contained)
// ---------------------------------------------------------------------------

async function setupTestEnvironment(page: Page) {
  // Mock /api/proxy for Gemini calls
    // Mock removed to use REAL API/DB
    // await page.route('/api/proxy', async route => { ... });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    // @ts-ignore
    // Pass 'true' to enable REAL backend writes
    window.setTestUser({ uid: 'researcher-id', email: 'research@test.com' }, true);
  });
  
  await expect(page.locator('h1')).toContainText(/Activity|Collection/, { timeout: 15000 });
}

async function sendVoiceCommand(page: Page, text: string) {
  await page.evaluate((t) => {
    // @ts-ignore
    window.processVoiceInput(t);
  }, text);
  await page.waitForTimeout(500);
}

async function confirmAction(page: Page) {
  const btn = page.getByRole('button', { name: /Confirm/i });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(1000);
}

async function goToCollection(page: Page) {
  await page.getByRole('button', { name: /Collection/i }).click();
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

test.describe('Deep Research Enrichment Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('entities are added in "queued" state and can be enriched', async ({ page }) => {
    const timestamp = Date.now();
    const habitatName = `Research Lab ${timestamp}`;
    
    // 1. Create a habitat (using voice for E2E realism)
    await sendVoiceCommand(page, `Create a tank called ${habitatName}`);
    await confirmAction(page);
    
    // Wait for habitat to be created
    await expect(page.locator(`text=${habitatName}`)).toBeVisible({ timeout: 15000 });

    // 2. Add an entity (using voice)
    await sendVoiceCommand(page, `I added a Neon Tetra to ${habitatName}`);
    await confirmAction(page);

    await goToCollection(page);
    
    // 3. Select the habitat to see the entities
    const labBtn = page.getByRole('button').filter({ hasText: habitatName }).first();
    await expect(labBtn).toBeVisible({ timeout: 15000 });
    await labBtn.click();
    await page.waitForTimeout(500); // Wait for list animation

    // 4. Verify "Research" button is visible because of queued entity
    const researchBtn = page.getByTestId('research-habitat-btn');
    // Research button might take a moment if the entity list is refreshing
    await expect(researchBtn).toBeVisible({ timeout: 15000 });

    // 5. Start research
    await researchBtn.click();

    // 6. Verify Deep Research Loader is visible
    const loader = page.locator('text=Deep Research in Progress');
    await expect(loader).toBeVisible({ timeout: 5000 });

    // 7. Verify stages transition (waiting/active/complete)
    // We expect 'library', 'gbif', 'wikipedia', 'inaturalist' and 'discovery' in the loader
    await expect(page.locator('text=Library Match')).toBeVisible();
    await expect(page.locator('text=Global Biodiversity (GBIF)')).toBeVisible();

    // 8. Wait for completion (reveal screen)
    const discoveryHeader = page.locator('text=Biological Discoveries');
    await expect(discoveryHeader).toBeVisible({ timeout: 30000 }); // Enrichment can take some time even when mocked if many entities

    // 9. Verify discovery snippet
    await expect(page.locator('text=Neon Tetra')).toBeVisible();

    // 10. Dismiss
    await page.getByRole('button', { name: /Close/i }).click();
    await expect(loader).not.toBeVisible();

    // 11. Verify entity enrichment_status is now "complete" in storage
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('conservatory_entities') || '[]'));
    const tetra = stored.find((e: any) => e.name === 'Neon Tetra');
    expect(tetra.enrichment_status).toBe('complete');
  });

  test('multi-entity serial research', async ({ page }) => {
    // Create habitat
    await sendVoiceCommand(page, 'Create a tank called Multi-Research.');
    await confirmAction(page);

    // Add multiple entities
    await sendVoiceCommand(page, 'I added a Neon Tetra to Multi-Research.');
    await confirmAction(page);
    await sendVoiceCommand(page, 'I added a Cherry Shrimp to Multi-Research.');
    await confirmAction(page);

    await goToCollection(page);
    await page.locator('button:has-text("Multi-Research")').click();

    const researchBtn = page.getByTestId('research-habitat-btn');
    await researchBtn.click();

    // Verify loader shows "1 of 2" (or similar progress text)
    await expect(page.locator('text=/1 of 2/')).toBeVisible({ timeout: 5000 });

    // Wait for completion
    await expect(page.locator('text=Biological Discoveries')).toBeVisible({ timeout: 45000 });
    
    // Verify both items present in reveal
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
  });
});
