// tests/logout.spec.js
import { test, expect } from '@playwright/test';

test.describe('React Application Logout Feature', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Go to your frontend login page on port 5173 (Vite default)
    await page.goto('http://localhost:5173/login');

    // 2. Fill in login credentials (update selectors to match your input fields)
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'securePassword123');
    await page.click('button[type="submit"]');

    // 3. Ensure successful navigation to the dashboard/home page
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
  });

  test('should clear local storage, redirect to login, and block back-button access', async ({ page }) => {
    // 1. Verify token exists in browser storage while logged in
    const tokenBeforeLogout = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    expect(tokenBeforeLogout).not.toBeNull();

    // 2. Click the Logout button in your React UI (update selector to match your button ID/class)
    await page.click('#logout-btn');

    // 3. Verify the user is redirected back to the login page
    await expect(page).toHaveURL('http://localhost:5173/login');

    // 4. Verify client storage has been wiped clean
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    expect(tokenAfterLogout).toBeNull();

    // 5. Try pressing the browser's Back button to return to the dashboard
    await page.goBack();

    // 6. Verify security protection blocks access and keeps the user on the login page
    await expect(page).toHaveURL('http://localhost:5173/login');
  });

});