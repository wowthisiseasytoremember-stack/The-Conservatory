import { test, expect } from '@playwright/test';

test.describe('The Conservatory E2E Workflows', () => {
  const uniqueId = Math.random().toString(36).substring(7);
  const habitatName = `The Shallows ${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Bypass Auth
    await page.evaluate(() => {
      // @ts-ignore
      window.setTestUser({ uid: 'test-user', email: 'test@example.com', displayName: 'Test User' });
    });
    // Wait for App to load
    await expect(page.locator('h1')).toContainText(/Activity|Collection/);
  });

  test('CUJ: Create Habitat -> Add Entities -> Log Observation', async ({ page }) => {
    // 1. Create Habitat
    await page.evaluate((name) => {
      // @ts-ignore
      window.processVoiceInput(`Create a 20 gallon tank called ${name}.`);
    }, habitatName);
    
    await expect(page.locator(`text=${habitatName}`)).toBeVisible();
    await page.click('button:has-text("Confirm")');
    
    // Wait for Firestore sync/materialization
    await page.waitForTimeout(3000);

    // Verify in Collection
    await page.click('button:has-text("Collection")');
    await expect(page.locator(`.p-4:has-text("${habitatName}")`)).toBeVisible({ timeout: 15000 });

    // 2. Add Entities
    await page.evaluate((name) => {
      // @ts-ignore
      window.processVoiceInput(`I just added 12 Neon Tetras and 5 Cherry Shrimp to ${name}.`);
    }, habitatName);
    await expect(page.locator('text=Neon Tetra')).toBeVisible();
    await expect(page.locator('text=Cherry Shrimp')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Verify in Feed
    await page.click('button:has-text("Feed")');
    await expect(page.locator('text=Neon Tetra')).toBeVisible();

    // 3. Log Observation
    await page.evaluate((name) => {
      // @ts-ignore
      window.processVoiceInput(`The pH in ${name} is 6.8 and the temp is 78 degrees.`);
    }, habitatName);
    await expect(page.locator('text=Observation')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // 4. Verify Duplicate Prevention
    await page.evaluate((name) => {
      // @ts-ignore
      window.processVoiceInput(`Create a 20 gallon tank called ${name}.`);
    }, habitatName);
    await page.click('button:has-text("Confirm")');
    
    // Check collection count - should still be 1 unique habitat
    await page.click('button:has-text("Collection")');
    const count = await page.locator(`.p-4:has-text("${habitatName}")`).count();
    expect(count).toBe(1);
  });

  test('CUJ: AI Chat Assistant', async ({ page }) => {
    // Open Chat
    await page.getByLabel('Open AI Chat').click();
    await page.getByPlaceholder('Ask a complex question...').fill('How do I care for Neon Tetras?');
    
    // Click send
    await page.locator('button:has(svg.lucide-send)').click();
    
    // Wait for response
    await expect(page.locator('.p-4.text-sm:has-text("Neon Tetra")')).toBeVisible({ timeout: 30000 });
  });
});
