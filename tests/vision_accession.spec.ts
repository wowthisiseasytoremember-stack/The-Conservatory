
import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

async function setupTestEnvironment(page: Page) {
  // Mock removed to use REAL API/DB
  // await page.route('/api/proxy', ...);

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    // @ts-ignore
    // Pass 'true' to enable REAL backend writes
    window.setTestUser({ uid: 'visionary-id', email: 'vision@test.com' }, true);
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

test.describe('Vision Accession Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await setupTestEnvironment(page);
  });

  test('identify and add entity via photo flow', async ({ page }) => {
    // 1. Create habitat first
    await sendVoiceCommand(page, 'Create a tank called Studio Room.');
    await confirmAction(page);

    // 2. Open Photo Flow
    await page.locator('button[title="Identify species via photo"]').click();
    
    // 3. Mock file upload/capture trigger
    // In our app, PhotoIdentify uses an <input type="file">
    // We can use Playwright's setInputFiles or bypass if identifying via mock
    await page.evaluate(() => {
      // @ts-ignore
      if (window.handlePhotoCapture) {
         // Mock a file object
         const file = new File([''], 'peacelily.jpg', { type: 'image/jpeg' });
         // @ts-ignore
         window.handlePhotoCapture(file);
      }
    });

    // 4. Verify identification results appear in confirmation card
    await expect(page.locator('text=Peace Lily')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Spathiphyllum wallisii')).toBeVisible();
    await expect(page.locator('text=94%')).toBeVisible();

    // 5. Confirm accession
    await confirmAction(page);

    // 6. Verify in collection under active habitat
    await goToCollection(page);
    await page.locator('button:has-text("Studio Room")').click();
    await expect(page.locator('text=Peace Lily')).toBeVisible();
  });
});
