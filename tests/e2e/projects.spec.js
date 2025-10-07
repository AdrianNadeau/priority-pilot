import { test, expect } from "@playwright/test";

test.describe("Project Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/");
    await page.click("text=Login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should create a new project", async ({ page }) => {
    // Navigate to projects
    await page.click("text=Projects");
    await expect(page).toHaveURL(/.*projects/);

    // Click create new project
    await page.click("text=New Project");
    await expect(page.locator("form")).toBeVisible();

    // Fill project form
    await page.fill('input[name="project_name"]', "Test Project E2E");
    await page.fill(
      'textarea[name="project_description"]',
      "This is a test project created by E2E tests",
    );
    await page.fill('input[name="start_date"]', "2024-01-01");
    await page.fill('input[name="end_date"]', "2024-12-31");

    // Select dropdown options
    await page.selectOption('select[name="phase_id_fk"]', "1");
    await page.selectOption('select[name="priority_id_fk"]', "1");
    await page.selectOption('select[name="person_id_fk"]', "1");
    await page.selectOption('select[name="status_id_fk"]', "1");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify project was created
    await expect(
      page.locator("text=Project created successfully"),
    ).toBeVisible();
    await expect(page.locator("text=Test Project E2E")).toBeVisible();
  });

  test("should view project details", async ({ page }) => {
    await page.click("text=Projects");

    // Click on first project in the list
    await page.click(".project-list .project-item:first-child");

    // Verify project details page
    await expect(page).toHaveURL(/.*projects\/\d+/);
    await expect(page.locator(".project-details")).toBeVisible();
    await expect(page.locator(".project-name")).toBeVisible();
    await expect(page.locator(".project-description")).toBeVisible();
  });

  test("should edit project", async ({ page }) => {
    await page.click("text=Projects");

    // Click edit on first project
    await page.click(".project-list .project-item:first-child .edit-button");

    // Update project name
    await page.fill('input[name="project_name"]', "Updated Project Name E2E");
    await page.fill(
      'textarea[name="project_description"]',
      "Updated description",
    );

    // Submit changes
    await page.click('button[type="submit"]');

    // Verify update
    await expect(
      page.locator("text=Project updated successfully"),
    ).toBeVisible();
    await expect(page.locator("text=Updated Project Name E2E")).toBeVisible();
  });

  test("should delete project", async ({ page }) => {
    await page.click("text=Projects");

    // Click delete on first project
    await page.click(".project-list .project-item:first-child .delete-button");

    // Confirm deletion in modal
    await expect(page.locator(".confirmation-modal")).toBeVisible();
    await page.click(".confirmation-modal .confirm-delete");

    // Verify deletion
    await expect(
      page.locator("text=Project deleted successfully"),
    ).toBeVisible();
  });

  test("should filter projects by status", async ({ page }) => {
    await page.click("text=Projects");

    // Use status filter
    await page.selectOption('select[name="status_filter"]', "1");
    await page.click('button[type="submit"]');

    // Verify filtered results
    await expect(page.locator(".project-list .project-item")).toHaveCount(1);
  });

  test("should search projects", async ({ page }) => {
    await page.click("text=Projects");

    // Use search functionality
    await page.fill('input[name="search"]', "test");
    await page.press('input[name="search"]', "Enter");

    // Verify search results
    await expect(page.locator(".project-list .project-item")).toHaveCount(1);
    await expect(page.locator("text=test")).toBeVisible();
  });

  test("should export projects", async ({ page }) => {
    await page.click("text=Projects");

    // Start download
    const downloadPromise = page.waitForEvent("download");
    await page.click("text=Export");
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/projects.*\.csv$/);
  });

  test("should handle project validation errors", async ({ page }) => {
    await page.click("text=Projects");
    await page.click("text=New Project");

    // Submit form without required fields
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator("text=Project name is required")).toBeVisible();
  });

  test("should navigate between project pages", async ({ page }) => {
    await page.click("text=Projects");

    // Check pagination if exists
    const paginationExists = await page.locator(".pagination").isVisible();

    if (paginationExists) {
      // Click next page
      await page.click(".pagination .next-page");
      await expect(page).toHaveURL(/.*page=2/);

      // Click previous page
      await page.click(".pagination .prev-page");
      await expect(page).toHaveURL(/.*page=1/);
    }
  });
});
