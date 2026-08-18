// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('End-to-End SuperAdmin, School Admin, and Student flow', () => {
  test('Complete flow with school registration, credential retrieval via MailHog, class creation, and student addition', async ({ browser, request }) => {
    const context = await browser.newContext({
      recordVideo: {
        dir: 'videos/',
        size: { width: 1280, height: 720 }
      }
    });
    const page = await context.newPage();

    const pause = async () => {
      await page.waitForTimeout(1500);
    };

    try {
      console.log('=== Step A: Log in as Super Admin ===');
      await page.goto('/login');
      await pause();
      await page.locator('#username-input').fill('superadmin');
      await page.locator('#password-input').fill('Password123!');
      await pause();
      await page.locator('.signin-submit-btn').click();
      
      console.log('Waiting for Super Admin Dashboard URL...');
      await page.waitForURL('**/dashboard/dashboard**');
      await expect(page.locator('.sd-brand-sub')).toContainText('Admin Portal');
      await pause();

      console.log('=== Step B: Navigate to School Management & Create Greenfield Academy ===');
      await page.locator('.sd-nav-item', { hasText: 'Manage Schools' }).click();
      console.log('Waiting for schools page URL...');
      await page.waitForURL('**/dashboard/schools**');
      await pause();

      console.log('Clicking Add School button...');
      await page.locator('button', { hasText: 'Add School' }).click();
      await pause();

      const uniqueId = Date.now();
      const schoolName = `Greenfield Academy ${uniqueId}`;
      const adminUsername = `greenfieldadmin${uniqueId}`;
      const adminEmail = `schooladmin@greenfield.com`;

      console.log(`Filling school metadata for: ${schoolName}`);
      await page.locator('input[placeholder="Enter school name"]').fill(schoolName);
      await page.locator('textarea[placeholder="Enter full address"]').fill('123 Greenfield Blvd');
      
      await page.locator('select').first().selectOption('Karnataka');
      await page.locator('select').nth(1).selectOption('Bangalore (Bengaluru)');
      
      await page.locator('input[placeholder="Enter pincode"]').fill('560001');
      await page.locator('input[placeholder="Enter 10 digit phone number"]').fill('9876543210');
      await page.locator('input[placeholder="Enter admin name"]').fill(adminUsername);
      await page.locator('input[placeholder="Enter email address"]').fill(adminEmail);
      await pause();

      console.log('Setting up request listener to intercept credentials...');
      const requestPromise = page.waitForRequest(req =>
        req.url().includes('/api/cms/v1/schools/') && req.method() === 'POST'
      );

      console.log('Clicking Save School...');
      await page.locator('button', { hasText: 'Save School' }).click();

      console.log('Waiting for save school API request...');
      const saveRequest = await requestPromise;
      const postData = JSON.parse(saveRequest.postData() || '{}');
      const adminPassword = postData.admin_password;
      const mailUsername = postData.admin_username || adminUsername;
      console.log(`Extracted credentials successfully! User: ${mailUsername}, Pwd: ${adminPassword}`);

      console.log('Waiting for Save School modal to disappear...');
      await expect(page.locator('button', { hasText: 'Add School' })).toBeVisible({ timeout: 15000 });
      await pause();

      console.log('=== Step D: Log out and Log in as School Admin ===');
      await page.evaluate(() => localStorage.clear());
      await page.goto('/login');
      await pause();
      await page.locator('#username-input').fill(mailUsername);
      await page.locator('#password-input').fill(adminPassword);
      await pause();
      await page.locator('.signin-submit-btn').click();

      console.log('Waiting for School Dashboard URL...');
      await page.waitForURL('**/school-dashboard**');
      await expect(page.locator('.sd-brand-sub')).toContainText('School Admin Portal');
      await pause();

      console.log('=== Step E: Create Grade 3 - Section A class by adding a teacher ===');
      await page.locator('.sd-nav-item', { hasText: 'Teachers' }).click();
      await pause();
      await page.locator('button', { hasText: 'Add Teacher' }).click();
      await pause();

      const teacherUser = `teacher_${uniqueId}`;
      await page.locator('input[placeholder="e.g. John Doe"]').fill(`Teacher ${uniqueId}`);
      await page.locator('input[placeholder="e.g. johndoe@example.com"]').fill(`${teacherUser}@example.com`);
      await page.locator('input[placeholder="e.g. B.Ed, M.A. English"]').fill('B.Ed');
      await page.locator('input[placeholder="e.g. +91 9876543210"]').fill('9876543210');
      await page.locator('input[placeholder="e.g. 2025 - 2026"]').fill('2025 - 2026');
      
      await page.locator('select').first().selectOption('3');
      await page.locator('select').nth(1).selectOption('A');
      
      await page.locator('input[placeholder="e.g. johndoe"]').fill(teacherUser);
      await page.locator('input[placeholder="Minimum 8 characters"]').fill('Password123!');
      await pause();

      console.log('Saving new teacher...');
      await page.locator('button', { hasText: 'Save Changes' }).click();
      await pause();

      await expect(page.locator('button', { hasText: 'Add Teacher' })).toBeVisible({ timeout: 15000 });
      await pause();

      console.log('Checking if Class 3-A exists in Classes tab...');
      await page.locator('.sd-nav-item', { hasText: 'Classes' }).click();
      await pause();
      await expect(page.locator('.sd-table')).toContainText('Class 3-A');
      await pause();

      console.log('=== Step F: Add Student "Arjun" with Roll No "101" ===');
      await page.locator('.sd-nav-item', { hasText: 'Students' }).click();
      await pause();
      await page.locator('button', { hasText: 'Add Student' }).click();
      await pause();

      await page.locator('input[placeholder="e.g. Arjun Sharma"]').fill('Arjun');
      await page.locator('input[placeholder="e.g. 12"]').fill('101');
      await page.locator('select').first().selectOption('Class 3');
      await page.locator('select').nth(1).selectOption('A');
      await page.locator('input[placeholder="e.g. 2025 - 2026"]').fill('2025 - 2026');
      await pause();

      console.log('Saving student...');
      await page.locator('button', { hasText: 'Save Changes' }).click();
      await pause();

      console.log('Asserting generated LMS login code...');
      await expect(page.locator('.sd-table')).toContainText('Arjun');
      await expect(page.locator('.sd-table')).toContainText('ARJ001');
      await pause();
      console.log('Test completed successfully!');

    } finally {
      const video = page.video();
      await context.close();

      if (video) {
        const videoPath = await video.path();
        const destDir = path.join(process.cwd(), 'videos');
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const destPath = path.join(destDir, 'admin_school_teacher_flow.webm');
        fs.copyFileSync(videoPath, destPath);
        console.log(`Video saved successfully to: ${destPath}`);
      }
    }
  });
});
