// @ts-check
import { expect } from '@playwright/test';

/**
 * Shared helpers for the CMS Playwright suite.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000';

const E2E_USERNAME = process.env.E2E_CONTENT_CREATOR_USERNAME || 'content_creator';
const E2E_PASSWORD = process.env.E2E_CONTENT_CREATOR_PASSWORD || 'Password123!';

/** 
 * Logs in as the seeded Content Creator via the real login API. 
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<{ access: string, refresh: string, user: any }>}
 */
async function apiLogin(request) {
  const res = await request.post(`${API_BASE_URL}/api/auth/login/`, {
    data: { username: E2E_USERNAME, password: E2E_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(
      `E2E setup: content-creator API login failed (${res.status()}). ` +
        `Response: ${await res.text()}`
    );
  }
  return res.json();
}

/** 
 * Creates a throwaway Experience + Activity via the API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ titleSuffix?: string }} [options]
 * @returns {Promise<{ accessToken: string, experienceId: number, experienceTitle: string, activityId: number, activityTitle: string, placeholderScreenId: number }>}
 */
async function seedExperienceAndActivity(request, { titleSuffix = String(Date.now()) } = {}) {
  const { access } = await apiLogin(request);
  const headers = { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' };

  const gradesRes = await request.get(`${API_BASE_URL}/api/cms/v1/grades/`, { headers });
  if (!gradesRes.ok()) throw new Error(`Failed to fetch grades for seeding: ${gradesRes.status()}`);
  const gradesBody = await gradesRes.json();
  const grades = gradesBody.value || gradesBody.results || gradesBody;
  if (!grades || grades.length === 0) throw new Error('No Grade records exist — cannot seed an Experience.');
  const gradeId = grades[0].id;

  const experienceTitle = `Playwright CMS Screen ${titleSuffix}`;
  const experienceRes = await request.post(`${API_BASE_URL}/api/v1/content/experiences/`, {
    headers,
    data: {
      title: experienceTitle,
      description: 'Seeded by the Playwright CMS UI suite.',
      grade: gradeId,
      subject: 'English',
      language: 'English',
      difficulty: 'BEGINNER',
      estimated_duration: 15,
      tags: [],
    },
  });
  if (!experienceRes.ok()) throw new Error(`Failed to seed Experience: ${experienceRes.status()} ${await experienceRes.text()}`);
  const experience = await experienceRes.json();

  const activityTitle = `Playwright CMS Activity ${titleSuffix}`;
  const activityRes = await request.post(`${API_BASE_URL}/api/v1/content/activities/`, {
    headers,
    data: {
      experience: experience.id,
      title: activityTitle,
      description: '',
      learning_objective: '',
      estimated_duration: 10,
      mastery_threshold: 80,
    },
  });
  if (!activityRes.ok()) throw new Error(`Failed to seed Activity: ${activityRes.status()} ${await activityRes.text()}`);
  const activity = await activityRes.json();

  const placeholderScreen = await seedScreen(request, access, activity.id, {
    title: `Placeholder Screen ${titleSuffix}`,
  });

  return {
    accessToken: access,
    experienceId: experience.id,
    experienceTitle,
    activityId: activity.id,
    activityTitle,
    placeholderScreenId: placeholderScreen.id,
  };
}

/** 
 * Seeds a single valid Screen.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} accessToken
 * @param {number} activityId
 * @param {{ title?: string }} [options]
 * @returns {Promise<any>}
 */
async function seedScreen(request, accessToken, activityId, { title = 'Seeded Screen' } = {}) {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const res = await request.post(`${API_BASE_URL}/api/v1/content/screens/`, {
    headers,
    data: {
      activity: activityId,
      title,
      screen_type: 'INFORMATION',
      estimated_duration: 60,
      content: {
        steps: [
          { step: 1, name: 'Ben', text: 'Hi! What would you like to order?' },
          { step: 2, name: 'Anna', text: "I'd like a cup of coffee, please." },
        ],
      },
    },
  });
  if (!res.ok()) throw new Error(`Failed to seed Screen: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** 
 * Deletes the seeded Experience.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} accessToken
 * @param {number} experienceId
 */
async function cleanupExperience(request, accessToken, experienceId) {
  if (!experienceId) return;
  await request.delete(`${API_BASE_URL}/api/v1/content/experiences/${experienceId}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** 
 * Logs in through the real CMS login UI.
 * @param {import('@playwright/test').Page} page
 * @param {string} [username]
 * @param {string} [password]
 * @param {string} [expectedPath]
 */
async function loginViaUI(page, username = E2E_USERNAME, password = E2E_PASSWORD, expectedPath = '**/content-studio**') {
  await page.goto('/login');
  await page.locator('#username-input').fill(username);
  await page.locator('#password-input').fill(password);
  await page.locator('.signin-submit-btn').click();
  await page.waitForURL(expectedPath);
}

/** 
 * Opens an Experience from the Experience Library list.
 * @param {import('@playwright/test').Page} page
 * @param {string} experienceTitle
 */
async function selectExperience(page, experienceTitle) {
  await page.locator('[data-testid="cs-nav-experiences"]').click();
  await page.locator('tr', { hasText: experienceTitle.toUpperCase() }).first().click();
  await page.waitForSelector('text=Lessons Builder', { timeout: 10000 });
}

/** 
 * Navigates into the Screen Builder for a seeded Experience/Activity.
 * @param {import('@playwright/test').Page} page
 * @param {{ experienceTitle: string, activityTitle: string }} seed
 */
async function navigateToScreenBuilder(page, { experienceTitle, activityTitle }) {
  await selectExperience(page, experienceTitle);

  await page.locator('[data-testid="cs-nav-activity-builder"]').click();
  await page.locator('[data-testid="activity-card"]').first().locator('button', { hasText: 'Edit Activity' }).click();

  await expect(page.locator('[data-testid="activity-title-input"]')).toHaveValue(activityTitle);

  await page.locator('[data-testid="cs-nav-screen-builder"]').click();
}

export {
  API_BASE_URL,
  E2E_USERNAME,
  E2E_PASSWORD,
  apiLogin,
  seedExperienceAndActivity,
  seedScreen,
  cleanupExperience,
  loginViaUI,
  selectExperience,
  navigateToScreenBuilder,
};
