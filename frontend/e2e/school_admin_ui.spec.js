// @ts-check
import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers.js';

test.describe('School Admin E2E workflows', () => {
  // ── Test 1: Login as School Admin and verify redirection to School Dashboard ──
  test('School Admin logs in and lands on the School Dashboard', async ({ page }) => {
    await loginViaUI(page, 'nirmalaadmin', 'nirmala@123', '**/school-dashboard**');
    await expect(page).toHaveURL(/\/school-dashboard/);
    
    // Check School Admin specific branding/role tag
    await expect(page.locator('.sd-brand-sub')).toContainText('School Admin Portal');
    await expect(page.locator('.sd-user-role')).toContainText('School Admin');
  });

  // ── Test 2: Verify Teacher Management UI (Adding a new teacher with credentials) ──
  test('Verify Teacher Management UI (Adding a new teacher with credentials)', async ({ page }) => {
    await loginViaUI(page, 'nirmalaadmin', 'nirmala@123', '**/school-dashboard**');

    // Go to Teachers tab
    await page.locator('.sd-nav-item', { hasText: 'Teachers' }).click();
    
    // Wait for Add Teacher button
    const addTeacherBtn = page.locator('button', { hasText: 'Add Teacher' });
    await expect(addTeacherBtn).toBeVisible();
    await addTeacherBtn.click();
    
    // Fill Teacher Form
    const teacherName = `E2E Teacher ${Date.now()}`;
    const username = `e2e_teacher_${Date.now()}`;
    const email = `${username}@example.com`;
    
    await page.locator('input[placeholder="e.g. John Doe"]').fill(teacherName);
    await page.locator('input[placeholder="e.g. johndoe"]').fill(username);
    await page.locator('input[placeholder="Minimum 6 characters"]').fill('password123');
    await page.locator('form input[type="email"]').fill(email);
    await page.locator('input[placeholder="e.g. John Doe"]').press('Tab'); // navigate active status checkbox
    
    // Save Teacher
    await page.locator('button', { hasText: 'Save Changes' }).click();
    
    // Check modal disappears and teacher is created
    await expect(addTeacherBtn).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.sd-table')).toContainText(teacherName);
  });

  // ── Test 3: RBAC UI Guard ──
  test('RBAC UI Guard: Navigate to CMS Content Creator routes and assert redirection/guard away', async ({ page }) => {
    await loginViaUI(page, 'nirmalaadmin', 'nirmala@123', '**/school-dashboard**');
    
    // Try to visit Content Creator `/content-studio` page
    await page.goto('/content-studio');
    
    // Main router in main.jsx should check role permissions and push back to `/school-dashboard`
    await page.waitForURL('**/school-dashboard');
    await expect(page).toHaveURL(/\/school-dashboard/);
  });
});
