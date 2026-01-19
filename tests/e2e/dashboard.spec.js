import { test, expect } from "@playwright/test";

test.describe("Dashboard Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/");
    await page.click("text=Login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should display dashboard overview", async ({ page }) => {
    // Verify dashboard elements
    await expect(page.locator(".dashboard-header")).toBeVisible();
    await expect(page.locator(".project-count")).toBeVisible();
    await expect(page.locator(".task-summary")).toBeVisible();
    await expect(page.locator(".recent-activities")).toBeVisible();
  });

  test("should show project statistics", async ({ page }) => {
    // Verify statistics widgets
    await expect(page.locator(".stats-widget.total-projects")).toBeVisible();
    await expect(page.locator(".stats-widget.active-projects")).toBeVisible();
    await expect(
      page.locator(".stats-widget.completed-projects"),
    ).toBeVisible();
    await expect(page.locator(".stats-widget.overdue-projects")).toBeVisible();

    // Verify numbers are displayed
    await expect(page.locator(".total-projects .number")).toContainText(/\d+/);
  });

  test("should display charts and graphs", async ({ page }) => {
    // Wait for charts to load
    await page.waitForSelector(".chart-container", { timeout: 5000 });

    // Verify chart containers are visible
    await expect(page.locator(".project-status-chart")).toBeVisible();
    await expect(page.locator(".timeline-chart")).toBeVisible();
    await expect(page.locator(".priority-distribution")).toBeVisible();
  });

  test("should show recent activities", async ({ page }) => {
    await expect(page.locator(".recent-activities")).toBeVisible();
    await expect(page.locator(".activity-item")).toHaveCount.greaterThan(0);

    // Verify activity items have required elements
    await expect(
      page.locator(".activity-item:first-child .activity-title"),
    ).toBeVisible();
    await expect(
      page.locator(".activity-item:first-child .activity-date"),
    ).toBeVisible();
  });

  test("should navigate to different sections from dashboard", async ({
    page,
  }) => {
    // Test navigation to projects
    await page.click("text=View All Projects");
    await expect(page).toHaveURL(/.*projects/);

    // Navigate back to dashboard
    await page.click("text=Dashboard");
    await expect(page).toHaveURL(/.*dashboard/);

    // Test navigation to reports
    await page.click("text=Reports");
    await expect(page).toHaveURL(/.*reports/);
  });

  test("should refresh data on dashboard", async ({ page }) => {
    // Click refresh button if available
    const refreshButton = page.locator(".refresh-button");
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Verify loading state
      await expect(page.locator(".loading-indicator")).toBeVisible();
      await expect(page.locator(".loading-indicator")).toBeHidden();
    }
  });

  test("should handle responsive layout", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator(".mobile-menu-toggle")).toBeVisible();
    await expect(page.locator(".sidebar")).toBeHidden();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify tablet layout adjustments
    await expect(page.locator(".dashboard-grid")).toHaveCSS(
      "grid-template-columns",
      /.*auto.*/,
    );

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should filter dashboard data by date range", async ({ page }) => {
    // Open date filter if available
    const dateFilter = page.locator(".date-filter");
    if (await dateFilter.isVisible()) {
      await dateFilter.click();

      // Set date range
      await page.fill('input[name="start_date"]', "2024-01-01");
      await page.fill('input[name="end_date"]', "2024-12-31");
      await page.click('button[text="Apply Filter"]');

      // Verify data updates
      await expect(page.locator(".loading-indicator")).toBeVisible();
      await expect(page.locator(".loading-indicator")).toBeHidden();
    }
  });
});
