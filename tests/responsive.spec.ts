import { expect, test } from "@playwright/test";

/**
 * Narrow-viewport checks.
 *
 * These exist because the layout was shipped without anyone ever seeing it
 * below 60rem — the browser tooling used during development silently failed
 * to resize, so "it stacks, it'll be fine" was an assumption, not an
 * observation. Horizontal overflow on a phone is the specific failure worth
 * guarding: it is easy to introduce and invisible on a desktop.
 */

const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 15", width: 393, height: 852 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "just under the layout breakpoint", width: 959, height: 900 },
  { name: "just over the layout breakpoint", width: 961, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
    });

    test("does not scroll horizontally", async ({ page }) => {
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scrollWidth,
        `page is ${overflow.scrollWidth - overflow.clientWidth}px wider than the viewport`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
    });

    test("has no element wider than the viewport", async ({ page }) => {
      const wide = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > vw + 1 || r.left < -1);
          })
          .map((el) =>
            `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80),
          );
      });
      expect(wide).toEqual([]);
    });

    test("keeps body text at a readable size", async ({ page }) => {
      const size = await page.evaluate(() => {
        const p = document.querySelector(".chapter-text p:not([class])");
        return p ? parseFloat(getComputedStyle(p).fontSize) : 0;
      });
      expect(size).toBeGreaterThanOrEqual(15);
    });

    test("stacks chapter media and text below the breakpoint", async ({
      page,
    }) => {
      const stacked = await page.evaluate(() => {
        const ch = document.querySelector(".chapter");
        if (!ch) return null;
        const m = ch.querySelector(".chapter-media")?.getBoundingClientRect();
        const t = ch.querySelector(".chapter-text")?.getBoundingClientRect();
        if (!m || !t) return null;
        // Stacked means they don't share horizontal space.
        return m.bottom <= t.top + 1 || t.bottom <= m.top + 1;
      });
      // 60rem = 960px at the default root size.
      expect(stacked).toBe(vp.width < 960);
    });
  });
}
