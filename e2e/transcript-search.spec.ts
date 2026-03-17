import { test, expect } from "@playwright/test";

// Use a known episode with transcript segments
const EPISODE_URL = "/podcasts/code-to-market/episodes/triangle-man-and-the-merchants-of-complexity";

test.describe("Transcript search Enter key", () => {
  test("pressing Enter scrolls to matching segment and highlights it", async ({
    page,
  }) => {
    await page.goto(EPISODE_URL);

    // The transcript details should be open
    const details = page.locator("details");
    await expect(details).toHaveAttribute("open", "");

    // Find the search input
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Pick a word that appears in a segment not at the top of the page
    // First, grab a word from a later segment to ensure scrolling is needed
    const segments = page.locator("ol > li");
    const segmentCount = await segments.count();
    expect(segmentCount).toBeGreaterThan(5);

    // Type a search query that should match some segments
    await searchInput.fill("complexity");
    await page.waitForTimeout(200);

    // Check that filtered results are shown
    const filterInfo = page.locator("text=/\\d+ of \\d+ segments/");
    await expect(filterInfo).toBeVisible();

    // Press Enter
    await searchInput.press("Enter");

    // After pressing Enter:
    // 1. The search should be cleared
    await expect(searchInput).toHaveValue("");

    // 2. The URL hash should be updated to the matched segment
    const url = page.url();
    expect(url).toMatch(/#seg-\d+/);

    // 3. The matched segment should be scrolled into view
    const hash = new URL(url).hash.slice(1);
    const targetSegment = page.locator(`#${hash}`);
    await expect(targetSegment).toBeInViewport();

    // 4. The segment text should contain our search term
    await expect(targetSegment).toContainText(/complexity/i);
  });

  test("typing search and pressing Enter navigates to segment", async ({
    page,
  }) => {
    await page.goto(EPISODE_URL);

    const searchInput = page.locator('input[type="search"]');

    // Type character by character (closer to real user behavior)
    await searchInput.click();
    await page.keyboard.type("complexity", { delay: 50 });
    await page.waitForTimeout(100);

    // Press Enter
    await page.keyboard.press("Enter");

    // Search should be cleared
    await expect(searchInput).toHaveValue("");

    // URL should have hash
    const url = page.url();
    expect(url).toMatch(/#seg-\d+/);

    // Segment should be visible
    const hash = new URL(url).hash.slice(1);
    const targetSegment = page.locator(`#${hash}`);
    await expect(targetSegment).toBeInViewport();
  });

  test("Enter scrolls to a segment that was initially off-screen", async ({
    page,
  }) => {
    // Episode 33 has 87 segments - last segments will be off-screen
    await page.goto("/podcasts/code-to-market/episodes/browserbase-s-growth-engines");

    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Search for something that appears late in the transcript
    await searchInput.fill("Browserbase");
    await page.waitForTimeout(200);

    // Get the last match's segment index
    const filterInfo = page.locator("text=/\\d+ of \\d+ segments/");
    await expect(filterInfo).toBeVisible();

    await searchInput.press("Enter");

    // Should have scrolled - the search input may no longer be in viewport
    await expect(searchInput).toHaveValue("");

    const url = page.url();
    expect(url).toMatch(/#seg-\d+/);

    const hash = new URL(url).hash.slice(1);
    const targetSegment = page.locator(`#${hash}`);
    await expect(targetSegment).toBeInViewport();
  });

  test("pressing Enter with no matches does nothing", async ({ page }) => {
    await page.goto(EPISODE_URL);

    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill("xyznonexistentterm123");
    await page.waitForTimeout(200);

    // Should show 0 matches
    const filterInfo = page.locator("text=0 of");
    await expect(filterInfo).toBeVisible();

    // Press Enter - nothing should break
    await searchInput.press("Enter");

    // Search should NOT be cleared (no match found)
    await expect(searchInput).toHaveValue("xyznonexistentterm123");
  });
});
