import { test, expect } from "@playwright/test";

test.describe("i18n locale switching", () => {
  test("homepage defaults to English without locale param", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Podcasts Database");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("homepage renders Spanish with ?locale=es", async ({ page }) => {
    await page.goto("/?locale=es");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1")).toContainText("Base de datos de podcasts");
    // Check translated "View all" links
    await expect(page.locator('a:has-text("Ver todo")').first()).toBeVisible();
  });

  test("homepage renders French with ?locale=fr", async ({ page }) => {
    await page.goto("/?locale=fr");

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1")).toContainText(
      "Base de données de podcasts"
    );
    await expect(
      page.locator('a:has-text("Voir tout")').first()
    ).toBeVisible();
  });

  test("locale switcher navigates to Spanish", async ({ page }) => {
    await page.goto("/");

    // Select Spanish from the locale switcher dropdown
    const select = page.locator("select");
    await select.selectOption("es");

    // Should navigate to ?locale=es
    await page.waitForURL(/locale=es/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1")).toContainText("Base de datos de podcasts");
  });

  test("locale switcher navigates back to English from Spanish", async ({
    page,
  }) => {
    await page.goto("/?locale=es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    // Switch back to English
    const select = page.locator("select");
    await select.selectOption("en");

    await page.waitForURL(/locale=en/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText("Podcasts Database");
  });

  test("/podcasts page renders Spanish with ?locale=es", async ({ page }) => {
    await page.goto("/podcasts?locale=es");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    // Check the search placeholder is translated
    const searchInput = page.locator('input[placeholder]');
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).not.toBe("Search podcasts…");
  });

  test("/people page renders Spanish with ?locale=es", async ({ page }) => {
    await page.goto("/people?locale=es");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    const searchInput = page.locator('input[placeholder]');
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).not.toBe("Search people…");
  });
});
