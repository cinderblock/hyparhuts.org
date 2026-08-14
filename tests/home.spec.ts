import { expect, test } from "@playwright/test";
import { chapters } from "../app/content/chapters";

test.describe("Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the site title", async ({ page }) => {
    await expect(page).toHaveTitle(/^HyparHuts —/);
  });

  test("leads with the name", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "HyparHuts",
    );
  });

  test("has a meta description and Open Graph tags", async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /fabric hinges/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /^HyparHuts —/,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
  });

  test("renders every idea, with a heading and an index entry that reaches it", async ({
    page,
  }) => {
    for (const chapter of chapters) {
      await expect(page.locator(`#${chapter.id}`)).toBeAttached();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: chapter.title,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "The seven ideas" })
          .getByRole("link", {
            name: new RegExp(
              chapter.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            ),
          }),
      ).toHaveAttribute("href", `#${chapter.id}`);
    }
  });

  test("links out to the design files", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Design files on GitHub" }),
    ).toHaveAttribute("href", "https://github.com/cinderblock/HyparHut");
  });

  test("uses no title attributes for tooltips", async ({ page }) => {
    // House rule: tooltips are invisible on touch. Guard it in CI.
    await expect(page.locator("body [title]")).toHaveCount(0);
  });
});

test.describe("404", () => {
  test("is prerendered as a real static document", async ({ page }) => {
    // The deployed host serves this file directly on a miss, so it has to
    // stand up before any JavaScript runs.
    const response = await page.goto("/404");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Folded flat" }),
    ).toBeVisible();
  });

  test("renders for an unknown path", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(
      page.getByRole("heading", { level: 1, name: "Folded flat" }),
    ).toBeVisible();
  });

  test("links back home", async ({ page }) => {
    await page.goto("/404");
    await expect(
      page.getByRole("link", { name: "Back to HyparHuts" }),
    ).toHaveAttribute("href", "/");
  });
});

test.describe("production build", () => {
  test("ships no dev feedback overlay", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-feedback-ui]")).toHaveCount(0);
  });
});
