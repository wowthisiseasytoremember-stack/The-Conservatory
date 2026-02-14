
import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared Helpers (copied from workflow.spec.ts to keep it self-contained)
// ---------------------------------------------------------------------------

async function setupTestEnvironment(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    // Mock Gemini AI
    // @ts-ignore
    window.mockGeminiParse = (text: string) => {
      if (text.match(/create.*tank/i)) {
        return Promise.resolve({
          intent: 'MODIFY_HABITAT',
          targetHabitatName: 'Research Lab',
          habitatParams: { name: 'Research Lab', type: 'Freshwater', size: 10, unit: 'gallon' },
        });
      }
      if (text.match(/added.*neon tetra/i)) {
        return Promise.resolve({
          intent: 'ACCESSION_ENTITY',
          targetHabitatName: 'Research Lab',
          candidates: [
            { commonName: 'Neon Tetra', scientificName: 'Paracheirodon innesi', quantity: 1, traits: [{ type: 'AQUATIC', parameters: {} }] }
          ],
        });
      }
      return Promise.resolve({ intent: 'QUERY', aiReasoning: 'Mock fallback' });
    };

    // @ts-ignore
    window.setTestUser({ uid: 'researcher-id', email: 'research@test.com' });
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
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
  });

  test('entities are added in "queued" state and can be enriched', async ({ page }) => {
    // 1. Create habitat
    await sendVoiceCommand(page, 'Create a tank called Research Lab.');
    await confirmAction(page);

    // 2. Add entity (should be queued)
    await sendVoiceCommand(page, 'I added a Neon Tetra to Research Lab.');
    await confirmAction(page);

    await goToCollection(page);
    
    // 3. Select the habitat to see the entities
    const labBtn = page.getByRole('button').filter({ hasText: 'Research Lab' }).first();
    await expect(labBtn).toBeVisible({ timeout: 15000 });
    await labBtn.click();
    await page.waitForTimeout(500); // Wait for list animation

    // 4. Verify "Research" button is visible because of queued entity
    const researchBtn = page.getByTestId('research-habitat-btn');
    await expect(researchBtn).toBeVisible({ timeout: 10000 });

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
