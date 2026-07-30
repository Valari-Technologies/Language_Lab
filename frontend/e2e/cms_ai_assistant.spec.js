// @ts-check
import { test, expect } from '@playwright/test';
import {
  seedExperienceAndActivity,
  loginViaUI,
  navigateToScreenBuilder,
} from './helpers.js';

test.describe('CMS AI Content Assistant E2E Tests', () => {
  test('opens AI assistant, triggers generation with mock, and inserts content into editor', async ({ page, request }) => {
    // 1. Seed throwaway Experience/Activity/Screen
    const seed = await seedExperienceAndActivity(request, { titleSuffix: `ai-${Date.now()}` });

    try {
      // 2. Intercept the AI generation API endpoint to return a mock response
      await page.route('**/api/v1/cms/ai-generate/', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            title: "AI Quiz Screen",
            question: "What is the capital of France?",
            options: ["London", "Paris", "Berlin", "Rome"],
            correct_option_index: 1,
            explanation: "Paris is the capital of France."
          })
        });
      });

      // 3. Login and navigate to the screen builder
      await loginViaUI(page);
      await navigateToScreenBuilder(page, seed);

      // 4. Create new screen and open it
      const screenTitle = `AI Screen ${Date.now()}`;
      await page.locator('[data-testid="add-new-screen-btn"]').click();
      await page.locator('[data-testid="prompt-modal-input"]').fill(screenTitle);
      await page.locator('[data-testid="prompt-modal-confirm"]').click();

      const screenCard = page.locator('[data-testid="screen-card"]', { hasText: screenTitle });
      await expect(screenCard).toBeVisible();
      await screenCard.click();

      // 5. Verify Screen Editor overlay is visible
      await expect(page.locator('.fss-overlay')).toBeVisible();

      // 6. Click the AI Assistant button
      const aiBtn = page.locator('[data-testid="ai-assistant-btn"]');
      await expect(aiBtn).toBeVisible();
      await aiBtn.click();

      // 7. Verify AI Assistant Modal is open
      await expect(page.locator('h3', { hasText: 'AI Assistant' })).toBeVisible();

      // 8. Fill in prompt/topic and select content type
      await page.locator('[data-testid="ai-topic-input"]').fill('Capital of France');
      await page.locator('[data-testid="ai-type-select"]').selectOption('quiz');
      await page.locator('[data-testid="ai-level-select"]').selectOption('Beginner / Grade 5');

      // 9. Click generate and wait for preview
      await page.locator('[data-testid="ai-submit-btn"]').click();
      await expect(page.locator('text=AI Preview Results')).toBeVisible();

      // 10. Accept & Insert
      await page.locator('[data-testid="ai-accept-btn"]').click();

      // 11. Modal should close, and screen title should update
      await expect(page.locator('h3', { hasText: 'AI Assistant' })).not.toBeVisible();
      
      // Let's verify that the screen title inside fss-screen-name-btn matches the accepted content
      const nameBtn = page.locator('.fss-screen-name-btn');
      await expect(nameBtn).toContainText('AI Quiz Screen');

    } finally {
      // Cleanup seed
      const headers = { Authorization: `Bearer ${seed.accessToken}` };
      await request.delete(`http://127.0.0.1:8000/api/v1/content/experiences/${seed.experienceId}/`, { headers });
    }
  });
});
