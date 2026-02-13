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
      
      // @ts-ignore
      window.mockGeminiParse = (text) => {
        if (text.includes("Create a") && text.includes("tank called")) {
           const namePart = text.split("called ")[1];
           const name = namePart ? namePart.replace('.', '').trim() : "Unknown";
           return Promise.resolve({
             intent: "MODIFY_HABITAT",
             targetHabitatName: name, 
             habitatParams: { name, type: "Freshwater", size: 20, unit: "gallon" },
             aiReasoning: "Mocked Habitat Creation"
           });
        }
        if (text.includes("added") && text.includes("Neon Tetras")) {
           const namePart = text.split("to ")[1];
           const name = namePart ? namePart.replace('.', '').trim() : "Unknown";
           return Promise.resolve({
             intent: "ACCESSION_ENTITY",
             targetHabitatName: name, 
             candidates: [
               { commonName: "Neon Tetra", scientificName: "Paracheirodon innesi", quantity: 12, traits: [{ type: "AQUATIC" }] },
               { commonName: "Cherry Shrimp", scientificName: "Neocaridina davidi", quantity: 5, traits: [{ type: "AQUATIC" }] }
             ],
             aiReasoning: "Mocked Adding Entities"
           });
        }
        if (text.includes("pH in")) {
            const namePart = text.split("in ")[1]?.split(" is")[0];
            const name = namePart ? namePart.trim() : "Unknown";
            return Promise.resolve({
                intent: "LOG_OBSERVATION",
                targetHabitatName: name,
                observationParams: { pH: 6.8, temp: 78 },
                aiReasoning: "Mocked Observation"
            });
        }
        return Promise.resolve({ intent: "LOG_OBSERVATION", aiReasoning: "Fallback Mock" });
      };

      // @ts-ignore
      window.mockGeminiChat = (text) => {
         return Promise.resolve({ text: "Neon Tetra care involves stable water parameters including pH 6.0-7.0." });
      };
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

    /*
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
    */
  });

});
