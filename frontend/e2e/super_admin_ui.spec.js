// @ts-check
import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers.js';

test.describe('Super Admin UI workflows', () => {
  // ── Test 1: Login as Super Admin and verify redirection to Super Admin Dashboard ──
  test('Super Admin logs in and lands on the Super Admin Dashboard', async ({ page }) => {
    // Land on the super admin dashboard path
    await loginViaUI(page, 'superadmin', 'Password123!', '**/dashboard/dashboard**');
    await expect(page).toHaveURL(/\/dashboard\/dashboard/);
    
    // Check main branding header for Admin Portal
    await expect(page.locator('.sd-brand-sub')).toContainText('Admin Portal');
    
    // Check navigation item to be active
    const dashboardTab = page.locator('.sd-nav-item.active');
    await expect(dashboardTab).toContainText('Dashboard');
  });

  // ── Test 2: Verify School Management UI ──
  test('Verify School Management UI (Opening School creation modal, filling school metadata, and submitting)', async ({ page }) => {
    await loginViaUI(page, 'superadmin', 'Password123!', '**/dashboard/dashboard**');
    
    // Navigate to Manage Schools tab
    await page.locator('.sd-nav-item', { hasText: 'Manage Schools' }).click();
    await page.waitForURL('**/dashboard/schools**');

    // Click Add School to open form
    await page.locator('button', { hasText: 'Add School' }).click();
    await expect(page.locator('h3', { hasText: 'School Information' })).toBeVisible();

    // Fill school metadata
    const schoolName = `E2E Test School ${Date.now()}`;
    await page.locator('input[placeholder="Enter school name"]').fill(schoolName);
    await page.locator('textarea[placeholder="Enter full address"]').fill('123 Test Academy Boulevard');
    
    // Select state and city
    await page.locator('select').first().selectOption('Karnataka');
    await page.locator('select').nth(1).selectOption('Bangalore (Bengaluru)');
    
    await page.locator('input[placeholder="Enter pincode"]').fill('560001');
    await page.locator('input[placeholder="Enter phone number"]').fill('9876543210');

    // School admin details (must be a valid username without spaces, e.g. e2eadmin)
    const adminUser = `e2eadmin${Date.now()}`;
    await page.locator('input[placeholder="Enter admin name"]').fill(adminUser);
    const adminEmail = `e2e_admin_${Date.now()}@example.com`;
    await page.locator('input[placeholder="Enter email address"]').fill(adminEmail);

    // Submit and save school
    await page.locator('button', { hasText: 'Save School' }).click();
    
    // Wait for the modal/form to go away, returning to lists page
    await expect(page.locator('button', { hasText: 'Add School' })).toBeVisible({ timeout: 15000 });
    
    // Search for the new school to ensure it's displayed (bypassing pagination limits)
    await page.locator('input[placeholder="Search schools..."]').fill(schoolName);
    
    // Check that the new school name is visible in the list of schools
    await expect(page.locator('.sd-table')).toContainText(schoolName);
  });

  // ── Test 3: Verify System Analytics & Subscription Plans management views load correctly ──
  test('Verify System Analytics & Subscription Plans management views load correctly', async ({ page }) => {
    await loginViaUI(page, 'superadmin', 'Password123!', '**/dashboard/dashboard**');

    // Verify Dashboard Overview components
    await expect(page.locator('.sd-brand-sub')).toContainText('Admin Portal');
    await expect(page.locator('.sd-stat-card')).toHaveCount(3); // 3 main metrics on super admin dashboard
    
    // Navigate to Subscriptions tab
    await page.locator('.sd-nav-item', { hasText: 'Subscriptions' }).click();
    await page.waitForURL('**/dashboard/subscriptions**');
    // Verify Subscriptions plans view loads
    await expect(page.locator('.sd-card-title', { hasText: 'Subscription Plan Distribution' })).toBeVisible();
  });
});
