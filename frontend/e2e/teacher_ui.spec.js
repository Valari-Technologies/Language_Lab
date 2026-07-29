// @ts-check
import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers.js';

test.describe('Teacher E2E workflows', () => {
  // ── Test 1: Login as Teacher and verify Teacher Dashboard, Student Roster, and Class Performance views ──
  test('Login as Teacher and verify Teacher Dashboard, Student Roster, and Class Performance views', async ({ page }) => {
    await loginViaUI(page, 'arsath@gmail.com', 'arsath@07', '**/teacher-dashboard**');
    await expect(page).toHaveURL(/\/teacher-dashboard/);

    // Verify main Dashboard tabs/metrics
    await expect(page.locator('.sd-brand-sub')).toContainText('Teacher Portal');
    await expect(page.locator('.sd-user-role')).toContainText('Teacher');
    await expect(page.locator('.sd-stat-card')).toHaveCount(5); // 5 metric cards on Teacher dashboard

    // Go to Students tab (Student Roster)
    await page.locator('.sd-nav-item', { hasText: 'Students' }).click();
    await expect(page.locator('.sd-table-wrap')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Add Student' })).toBeVisible();

    // Go to Classes tab (Class Performance)
    await page.locator('.sd-nav-item', { hasText: 'Classes' }).click();
    await expect(page.locator('.sd-table-wrap')).toBeVisible();
    // (Note: Teachers cannot create new classes; class assignment is handled by School Admins)
  });

  // ── Test 2: RBAC UI Guard ──
  test('RBAC UI Guard: Confirm that CMS Authoring/Publishing buttons and admin settings links are hidden/disabled', async ({ page }) => {
    await loginViaUI(page, 'arsath@gmail.com', 'arsath@07', '**/teacher-dashboard**');

    // Content studio is completely restricted. Nav items for Content Studio or Super Admin dashboard should not be in sidebar
    const studioNavItem = page.locator('[data-testid^="cs-nav-"]');
    await expect(studioNavItem).toHaveCount(0);

    const superAdminSidebarItems = page.locator('.sd-nav-item', { hasText: 'Manage Schools' });
    await expect(superAdminSidebarItems).toHaveCount(0);

    // Assert attempting to force route direct to content studio pushes user back
    await page.goto('/content-studio');
    await page.waitForURL('**/teacher-dashboard');
    await expect(page).toHaveURL(/\/teacher-dashboard/);
  });
});
