import { test, expect } from '@playwright/test';

test.describe('Chat Messaging', () => {
  test('should send and display a chat message', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard|home/);

    // Navigate to chat page (update selector/path as needed)
    await page.click('text=Chat');
    await expect(page).toHaveURL(/chat/);

    // Select a chat room (update selector as needed)
    await page.click('.chat-room-list .cursor-pointer');
    await expect(page.locator('.chat-header')).toBeVisible();

    // Send a message
    await page.fill('textarea[placeholder="Type your message..."]', 'Hello from E2E!');
    await page.click('button:has-text("Send")');

    // Verify message appears in chat
    await expect(page.locator('text=Hello from E2E!')).toBeVisible();
  });
});
