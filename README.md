# hyparhuts.org

The website for [HyparHuts](https://hyparhuts.org) — temporary panel shelters
descended from the hexayurt, with the tape taken out.

Design files and the original writeup live in
[cinderblock/HyparHut](https://github.com/cinderblock/HyparHut).

## Stack

Built from [cinderblock/ssg-base](https://github.com/cinderblock/ssg-base):
React 19 + React Router 8, Vite, TypeScript, Bun, Playwright, oxfmt + lefthook.
Fully prerendered — there is no server at runtime.

## Getting started

```sh
bun install
bun run dev
```

| Script              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `bun run dev`       | Dev server on :5173, with the feedback layer           |
| `bun run build`     | Prerender to `build/client`                            |
| `bun run preview`   | Serve the built site on :4173                          |
| `bun run test`      | Playwright, against a fresh build (not the dev server) |
| `bun run typecheck` | `react-router typegen && tsc`                          |
| `bun run fmt`       | Format with oxfmt                                      |

## Structure

```
app/
  root.tsx                  HTML shell; mounts the dev feedback layer
  routes.ts                 Route table
  routes/home.tsx           The single scroll narrative
  routes/404.tsx            Not found
  content/chapters.ts       The seven ideas — prose lives here, not in JSX
  components/               ChapterSection, MediaSlot
  dev/feedback/             Dev-only feedback overlay (never shipped)
  styles/global.css         Everything visual
dev/feedback-plugin.ts      Dev-only server side of the feedback layer
worker/index.ts             Cloudflare Worker: host canonicalisation + assets
scripts/emit-404.ts         Copies the prerendered 404 to `404.html`
plans/                      Working notes; start with hyparhuts-site.md
```

Site copy is data in `app/content/chapters.ts` rather than markup, so the
prose can be edited without touching layout.

## The dev feedback layer

`bun run dev` mounts an overlay that only exists in development. It exists so
review comments can be left on the page itself and picked up directly:

- **Click the Feedback button** (or `Ctrl`/`Cmd`+`I`), then click any element.
- **Or select text** — a "Comment on selection" bubble appears.
- Type, then `Ctrl`/`Cmd`+`Enter`. `Esc` cancels.

Comments append to `feedback/feedback.jsonl` (gitignored), one JSON object per
line. Each records the route, a CSS selector, the anchored element's text, and
the viewport size.

To mark one handled, append a resolve record:

```jsonc
{ "type": "resolve", "id": "fb_…", "ts": "…", "note": "shortened the hook" }
```

The page is tailing that file, so the pin clears in the browser immediately —
no reload.

Two deliberate properties, because the point is to edit the site while someone
is still typing into it:

- **Append-only, both directions.** Neither side ever rewrites the file, so
  concurrent writes can't clobber each other.
- **Drafts live in `sessionStorage`.** An in-progress comment survives Fast
  Refresh and a full page reload, so an edit landing mid-sentence doesn't eat
  it. Pins re-anchor by selector, falling back to matching the element's text.

None of it reaches production: the overlay is behind `import.meta.env.DEV`
inside a dynamic import, which folds to `null` at build time. A Playwright test
asserts the built output contains no `[data-feedback-ui]`.

## Media

The 2014 build timelapse is in, as a click-to-play section. Everything else is
still a placeholder: `MediaSlot` renders a labelled box naming the asset each
position wants, so it stays obvious what is missing.

Web-ready files in `public/media/` are **committed**. Their sources are 12–29 GB
ProRes files on local drives that CI can't see, so ignoring them would ship a
site with missing video. Never commit the sources. See `plans/media.md` for the
inventory and the ffmpeg recipes.

## Deployment

Not deployed yet. The target is **Cloudflare Workers static assets** —
`wrangler.jsonc` and `worker/index.ts` describe the shape, including
canonicalising `hyparhuts.com` and any `www.` host to bare `hyparhuts.org`. The
deploy itself gets wired up in [`cinderblock/ops`](https://github.com/cinderblock/ops)
once the site content settles.

CI (`.github/workflows/ci.yml`) runs format, typecheck, build, and tests on
push and PR. It does not deploy.
