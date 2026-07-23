import { test, expect, Page } from '@playwright/test';

/** 
 * Living Placard E2E Test (v4) - Unified Store
 */

async function setupTestEnvironment(page: Page) {
  await page.addInitScript(() => {
    (window as any).__E2E__ = true;

    // @ts-ignore
    window.mockGeminiParse = (text: string) => {
      return Promise.resolve({
        intent: 'ACCESSION_ENTITY',
        candidates: [{ 
          commonName: 'Neon Tetra', 
          scientificName: 'Paracheirodon innesi', 
          quantity: 1, 
          traits: [{ type: 'AQUATIC', parameters: { pH: 6.5 } }] 
        }],
        aiReasoning: 'Mock: Accessioning'
      });
    };
  });

  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
}

test.describe('Living Placard UI & Unified Store', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('should display the new Hero Section', async ({ page }) => {
    const hero = page.locator('section:has-text("The Living Conservatory")');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('AI-Powered Curator Pipeline');
  });

  test('should complete the enrichment cycle', async ({ page }) => {
    // 1. Add via voice
    await page.evaluate(() => {
      // @ts-ignore
      window.processVoiceInput("Add a neon tetra");
    });

    // 2. Confirm
    const confirmBtn = page.getByRole('button', { name: /Confirm/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    // 3. Go to Collection
    await page.goto('/entities');
    const card = page.locator('button:has-text("Neon Tetra")').first();
    await expect(card).toBeVisible();

    // 4. Research
    const researchBtn = card.locator('button:has-text("Research")');
    await expect(researchBtn).toBeVisible();
    await researchBtn.click();

    // 5. Check "Researching..." status
    await expect(page.locator('text=Researching…')).toBeVisible();
    
    // In E2E mock mode, the store returns enriched data
    await expect(page.locator('text=Enriched')).toBeVisible({ timeout: 5000 });

    // 6. Open Placard
    await card.click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Neon Tetra');
    
    // Check for "Curator's Notes" in Research tab
    await modal.locator('button:has-text("research")').click();
    await expect(modal).toContainText("Curator's Notes");
  });
});
