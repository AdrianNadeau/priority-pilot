import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");
  });

  test("should login with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.click("text=Login");
    await expect(page).toHaveURL(/.*login/);

    // Fill login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator("text=Welcome")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.click("text=Login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.click("text=Login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.click("text=Logout");

    // Verify logout
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Login")).toBeVisible();
  });

  test("should redirect unauthenticated users", async ({ page }) => {
    // Try to access protected route directly
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
