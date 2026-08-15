import { existsSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { chapters } from "../app/content/chapters";

/**
 * `public/media/` is gitignored — the files live in R2 and the Worker serves
 * them in production. A CI checkout legitimately has none, so anything that
 * needs the bytes present has to skip rather than fail. Assertions about
 * *markup* still run everywhere; only assertions about *bytes* are gated.
 */
const HAVE_LOCAL_MEDIA =
  existsSync("public/media") && readdirSync("public/media").length > 0;

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

  test("declares a social card image that exists", async ({
    page,
    request,
  }) => {
    // A summary_large_image card with no image renders blank. That shipped.
    const card = page.locator('meta[name="twitter:card"]');
    await expect(card).toHaveAttribute("content", "summary_large_image");

    for (const sel of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]) {
      const url = await page.locator(sel).getAttribute("content");
      // Scrapers don't resolve relative URLs.
      expect(url, `${sel} must be absolute`).toMatch(/^https:\/\//);

      // Fetch by path against the test server — the absolute URL points at
      // production, which isn't deployed yet.
      const res = await request.get(new URL(url!).pathname);
      expect(res.status(), `${url} should be served`).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/");
    }

    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      /.{10,}/,
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

  test("offers the build timelapse without preloading it", async ({ page }) => {
    const video = page.locator(".video-player");
    await expect(video).toBeVisible();
    // Several MB — it must not download until someone asks for it.
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute(
      "poster",
      "/media/build-d09-poster.jpg",
    );
    await expect(video).not.toHaveAttribute("autoplay", /.*/);
  });

  test("offers an AV1 source with a plain H.264 fallback", async ({ page }) => {
    const sources = await page.locator("video source").evaluateAll((els) =>
      els.map((el) => ({
        src: el.getAttribute("src") ?? "",
        type: el.getAttribute("type") ?? "",
      })),
    );
    expect(sources.length).toBe(2);

    // AV1 first, with a precise codecs string so a browser that can't decode
    // it falls through instead of failing.
    expect(sources[0]?.src).toMatch(/\.av1\.mp4$/);
    expect(sources[0]?.type).toContain("av01.");

    // The fallback must NOT carry a codecs string, or it stops being a
    // universal fallback.
    expect(sources[1]?.src).toMatch(/\.h264\.mp4$/);
    expect(sources[1]?.type).toBe("video/mp4");
  });

  test("serves every media file the page references", async ({
    page,
    request,
  }) => {
    test.skip(
      !HAVE_LOCAL_MEDIA,
      "no local public/media — production serves these from R2",
    );

    const srcs = await page
      .locator("video source")
      .evaluateAll((els) => els.map((el) => el.getAttribute("src") ?? ""));
    const posters = await page
      .locator("video")
      .evaluateAll((els) => els.map((el) => el.getAttribute("poster") ?? ""));

    expect(srcs.length).toBeGreaterThan(0);
    for (const path of [...srcs, ...posters]) {
      const res = await request.get(path);
      expect(res.status(), `${path} should be served`).toBe(200);
    }
  });

  test("every image declares intrinsic dimensions and alt text", async ({
    page,
  }) => {
    // Without width/height an <img> collapses to a line box, which shifts the
    // layout on load AND stops loading="lazy" from ever firing — there is no
    // box for the observer to intersect, so the image silently never appears.
    // That happened. This is a markup check, so it runs without the bytes.
    const imgs = page.locator("picture img");
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      const src = await img.getAttribute("src");
      expect(
        await img.getAttribute("width"),
        `${src} needs width`,
      ).toBeTruthy();
      expect(
        await img.getAttribute("height"),
        `${src} needs height`,
      ).toBeTruthy();
      expect(
        await img.getAttribute("alt"),
        `${src} needs alt text`,
      ).toBeTruthy();
    }
  });

  test("every image actually decodes", async ({ page }) => {
    test.skip(
      !HAVE_LOCAL_MEDIA,
      "no local public/media — production serves these from R2",
    );

    const imgs = page.locator("picture img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      const src = await img.getAttribute("src");
      await img.scrollIntoViewIfNeeded();
      await expect(async () => {
        const loaded = await img.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        );
        expect(loaded, `${src} never loaded`).toBe(true);
      }).toPass({ timeout: 10_000 });
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
