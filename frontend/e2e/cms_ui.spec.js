// @ts-check
import { test, expect } from '@playwright/test';
import {
  seedExperienceAndActivity,
  seedScreen,
  cleanupExperience,
  loginViaUI,
  selectExperience,
  navigateToScreenBuilder,
} from './helpers.js';

test.describe('CMS Content Creator UI workflows', () => {
  // ── Test 1: Content Creator Login & RBAC Guard ──────────────────────────
  test('Content Creator logs in and lands on the CMS Dashboard with full nav enabled', async ({ page }) => {
    await loginViaUI(page);

    await expect(page).toHaveURL(/\/content-studio/);
    await expect(page.locator('.cs-nav-item.active')).toContainText('Dashboard');

    // Every core CMS feature must be visible AND enabled for a Content Creator.
    const expectedNavItems = [
      'dashboard',
      'experiences',
      'experience-builder',
      'activity-builder',
      'screen-builder',
      'media',
      'publish',
    ];
    for (const key of expectedNavItems) {
      const navItem = page.locator(`[data-testid="cs-nav-${key}"]`);
      await expect(navItem, `nav item "${key}" should be visible`).toBeVisible();
      await expect(navItem, `nav item "${key}" should be enabled`).toBeEnabled();
    }
  });

  // ── Test 2: Dynamic Screen Creation & Editor Workflow ───────────────────
  test('creates a screen, fills dialogue + quiz blocks, saves, and shows it in the list', async ({ page, request }) => {
    const seed = await seedExperienceAndActivity(request, { titleSuffix: `t2-${Date.now()}` });

    try {
      await loginViaUI(page);
      await navigateToScreenBuilder(page, seed);

      // Fill out the "Create New Screen" form (Title + Sequence is auto-assigned server-side).
      const screenTitle = `Greetings Intro ${Date.now()}`;
      await page.locator('[data-testid="add-new-screen-btn"]').click();
      await page.locator('[data-testid="prompt-modal-input"]').fill(screenTitle);
      await page.locator('[data-testid="prompt-modal-confirm"]').click();

      // The newly created screen card renders in the Screen Library list.
      const screenCard = page.locator('[data-testid="screen-card"]', { hasText: screenTitle });
      await expect(screenCard).toBeVisible();

      // Open it to edit its content blocks.
      await screenCard.click();
      await expect(page.locator('.fss-overlay')).toBeVisible();

      // The screen was created with a default Dialogue block already containing steps —
      // confirm the Dialogue Steps text is present and editable.
      const dialogueStepInput = page.locator('[data-testid="dialogue-step-text-0"]');
      await expect(dialogueStepInput).toBeVisible();
      await dialogueStepInput.fill('Hi! What would you like to order today?');

      // The Elements panel starts collapsed (icon-only) — expand it to reach the block palette.
      await page.locator('[data-testid="expand-elements-panel-btn"]').click();

      // Add a Quiz block and fill its Question + Options.
      await page.locator('[data-testid="add-block-quiz"]').click();
      await page.locator('[data-testid="quiz-question-input"]').fill('Which greeting means "hello" in French?');
      await page.locator('[data-testid="quiz-option-input-0"]').fill('Bonjour');
      await page.locator('[data-testid="quiz-option-input-1"]').fill('Au revoir');

      // Save the screen (Save Draft keeps us in the Screen Library context, so we can
      // confirm the card right away; "Publish" instead returns all the way to the
      // Experience Library, which is exercised separately in Test 4's export flow).
      await page.locator('[data-testid="save-draft-btn"]').click();

      // A success toast notification must appear.
      const toast = page.locator('[data-testid="cs-toast"]');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText(/saved|published|success/i);

      // Back on the Screen Library, the screen card is still rendered.
      await expect(page.locator('[data-testid="screen-card"]', { hasText: screenTitle })).toBeVisible();
    } finally {
      await cleanupExperience(request, seed.accessToken, seed.experienceId);
    }
  });

  // ── Test 3: Form Validation & Error Handling UI ─────────────────────────
  test('submitting an empty Screen title shows an inline validation error without crashing', async ({ page, request }) => {
    const seed = await seedExperienceAndActivity(request, { titleSuffix: `t3-${Date.now()}` });

    try {
      await loginViaUI(page);
      await navigateToScreenBuilder(page, seed);

      // Attempt to submit the "Create New Screen" form completely empty.
      await page.locator('[data-testid="add-new-screen-btn"]').click();
      await page.locator('[data-testid="prompt-modal-confirm"]').click();

      // A descriptive validation error must appear...
      const errorMessage = page.locator('[data-testid="prompt-modal-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/required/i);

      // ...and the input must carry a red/error highlight border.
      await expect(page.locator('[data-testid="prompt-modal-input"]')).toHaveCSS('border-color', 'rgb(239, 68, 68)');

      // The page must remain fully functional — no crash, and no NEW screen was created
      // (only the placeholder screen seeded via the API for navigation should exist).
      await expect(page.locator('[data-testid="add-new-screen-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="screen-card"]')).toHaveCount(1);

      // Recovering with a valid title still works after the failed attempt.
      await page.locator('[data-testid="prompt-modal-input"]').fill('Recovered Screen Title');
      await page.locator('[data-testid="prompt-modal-confirm"]').click();
      await expect(page.locator('[data-testid="screen-card"]', { hasText: 'Recovered Screen Title' })).toBeVisible();
    } finally {
      await cleanupExperience(request, seed.accessToken, seed.experienceId);
    }
  });

  // ── Test 4: Package Export Trigger ──────────────────────────────────────
  test('Build & Publish, then downloading the package triggers a real .elab file download', async ({ page, request }) => {
    const seed = await seedExperienceAndActivity(request, { titleSuffix: `t4-${Date.now()}` });
    await seedScreen(request, seed.accessToken, seed.activityId, { title: 'Export Validation Screen' });

    try {
      await loginViaUI(page);
      await selectExperience(page, seed.experienceTitle);

      await page.locator('[data-testid="cs-nav-publish"]').click();
      await page.locator('[data-testid="publish-version-input"]').fill('1.0.0');
      await page.locator('[data-testid="build-publish-package-btn"]').click();

      // Wait for the build to complete and appear in the Published Build History table.
      const downloadBtn = page.locator('[data-testid="download-elab-btn"]').first();
      await expect(downloadBtn).toBeVisible({ timeout: 20000 });

      // Clicking the download button must initiate a real browser file download of the .elab package.
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadBtn.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.elab$/);
    } finally {
      await cleanupExperience(request, seed.accessToken, seed.experienceId);
    }
  });
});
