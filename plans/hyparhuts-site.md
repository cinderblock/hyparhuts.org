# HyparHuts.org — Static Site

## Goal

Replace the current hyparhuts.org redirect-to-Facebook with a dedicated static site
documenting the HyparHut project: a set of design techniques for temporary shelters,
descended from Hexayurts but solving the durability and setup-time problems that
tape-hinged hexayurts have.

The site should read as a scrolling narrative with media (photos, short "live photo"
clips) alongside the text, not as a wall of prose.

## Environment / context

- Repo working dir: `C:\Users\camer\git\Personal Projects\hyparhuts.org`
- Started from `github.com/cinderblock/ssg-base` (React Router 8 + Vite 8 + Bun,
  `ssr: false`, `prerender: true`). First commit is the pristine template.
- Primary branch: `master`.
- Publish target: **Cloudflare Workers static assets** (not Pages). Deploy wiring
  goes in the `ops` repo (`~/git/Personal Projects/ops`) **later**, once the site
  content is settled.
- Domains owned: `hyparhuts.org`, `hyparhuts.com`. (`hyparhut.com/.org` were let go.)
  All traffic → apex `hyparhuts.org`, no `www`.

### Source material found

| What                                                                       | Where                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Original design writeup (excellent, reusable prose)                        | `github.com/cinderblock/HyparHut`, branch `V3`, `README.md`                                                               |
| V3 CAD sketches                                                            | same repo: `Layout.sldprt`, `Edge.sldprt`, `Layout.JPG`                                                                   |
| V1 branch                                                                  | `github.com/cinderblock/HyparHut` branch `V1`                                                                             |
| Shade structure (separate project)                                         | `github.com/cinderblock/HyparShade`                                                                                       |
| 2014 build/timelapse raw footage, ~115 GB, Blackmagic Pocket Cinema Camera | `S:\Cam's Crap\HyparHut Build Recordings` and `P:\Projects\HyparHut Timelapse` (3 of the 5 files duplicated between them) |
| More CAD + `Hypar Hut roof plan.jpg`                                       | `T:\Tom Sawyer Labs\Open Source Projects\hyparhut`                                                                        |
| Old checkouts                                                              | `C:\Users\camer\Desktop\Nook-git2\Brix Git\HyparHut`, `...\HyparShade`                                                    |

**Not yet located:** the iOS "live photo" hinge-assembly clips and the short video
Cameron assembled from them. These are the highest-value assets for the hinge
section. See Open Questions.

## Decisions already made (don't re-ask)

- Start from `ssg-base`, don't hand-roll a stack.
- Public GitHub repo under `cinderblock`.
- Cloudflare Workers deploy, wired up in `ops` **later**.
- Dev server first, deploy last — layout/design iteration matters more than shipping.
- Dev-only feedback layer is a required feature, not a nice-to-have (see below).
- Do **not** touch Cloudflare/DNS. Infra changes need explicit per-change approval.

## The seven ideas

HyparHuts is a small set of design ideas that combine into a complete solution but
each stand alone. Site structure should reflect that — each is independently
adoptable by someone already building hexayurts.

1. **Hinge technique** — Jacob's-ladder-style crossed strapping makes hinges that
   load the glue in shear, never peel. Effectively permanent.
2. **Edge reinforcement** — wood trim around each panel's perimeter under the wrap:
   impact protection, a solid base for hinges, removes joint slop. Thicker on the
   bottom edge, with screwed-on rubber feet for sliding.
3. **House wrap** — Tyvek or generic, contact-cemented tightly to each panel.
   Hinge substrate, liquid barrier, puncture resistance, debris containment, and it
   hides everything under it.
4. **Folding geometry** — accordion fold, so seams don't get remade every deployment.
   Side-wall fold is deliberately _off_ center so edges meet when flat.
5. **Twisted roof (the hypar)** — approximates a hyperbolic paraboloid; tensions the
   roof panels and kills wind flutter. This is the namesake.
6. **Ground anchoring frame** — staked down _first_, before the hut goes up. Level
   base, notches that engage the panel feet, no guy wires, no tripping hazards.
7. **Built-in solar / lights** — LED strips under the wrap (white house wrap
   diffuses them), battery pocket in the foam, solar on the outer layer.

## Plan / steps

1. ~~Scaffold from ssg-base, git init on `master`~~ ✅
2. ~~Dev feedback layer + dev server running~~ ✅
3. ~~First pass at content and scroll-narrative layout~~ ✅
4. ~~Public GitHub repo~~ ✅ — `github.com/cinderblock/hyparhuts.org`
5. ~~Cloudflare Workers config + host canonicalisation~~ ✅ (written, **not
   deployed and not verified against a real Worker**)
6. **← current** Iterate on layout/content from feedback
7. Locate and process media; build a real media pipeline
8. Wire deploy in `ops`

## Feedback layer (dev only)

Requirement, in Cameron's words: click any line / part of the page / text selection,
leave a quick comment, have it land in a simple text database that Claude reads and
acts on immediately — with HMR, so fixes land under him while he's writing the next
comment **without disturbing the comment he's currently writing**.

Design:

- Vite plugin, dev-only, so nothing ships to production.
- Comments append to `feedback/feedback.jsonl` (one JSON object per line — append-only,
  no read-modify-write, so concurrent writes can't clobber).
- Each entry records: id, timestamp, page path, a CSS-ish selector + text snippet of
  the anchor, viewport size, and the comment text. Status field for triage.
- The overlay must survive HMR without losing an in-progress draft.

## How to act on feedback (for a future session)

1. Read `feedback/feedback.jsonl`. Each `type: "comment"` record has an `id`,
   the `route`, and an `anchor` with a CSS `selector` plus the anchored
   element's `text`. The text is usually enough to grep straight to the source
   — most prose lives in `app/content/chapters.ts`.
2. Make the edit. HMR pushes it to the browser; Cameron's in-progress comment
   is in `sessionStorage` and survives.
3. Append a resolve record to the same file, which clears the pin live:
   `{"type":"resolve","id":"fb_…","ts":"…","note":"what changed"}`
   Append only — never rewrite the file, he may be writing to it.

## Findings / gotchas

- `ssg-base`'s `vite.config.ts` has `allowedHosts: ["noook","noook.tsl"]` — machine
  specific, kept.
- `HyparHut` repo default branch is `V3`, not `master`. `V2`'s design files are lost
  (noted in that README).
- Timelapse footage is 15–29 GB **per file**, 2014 vintage, ProRes-ish `.mov` from a
  BMPCC. Nothing web-usable without a transcode step. Don't naively copy into the repo.
- **`prerender: true` emits no 404 document.** A splat route has no concrete path,
  so unknown paths got only the empty SPA shell — no `<h1>`, nothing without JS.
  Fixed by adding a concrete `/404` route and copying the prerendered
  `404/index.html` to `404.html` in `scripts/emit-404.ts`, which is the filename
  Cloudflare's `not_found_handling: "404-page"` looks for.
- **`:nth-of-type` counts by tag, not by class.** `.chapter:nth-of-type(even)`
  was also counting the premise/tarp/build sections, which inverted the media
  alternation. Chapters now carry `data-media-side` from their own number.
- React 19 does not expose JSX source locations on the fiber, so feedback
  anchors always have `source: null`. The selector + element text is what does
  the work. Not worth adding a Babel pass to recover it.
- Playwright now runs against `bun run build && bun run preview` on :4173, not
  the dev server. That is what makes the "no feedback overlay in production"
  assertion meaningful, and it leaves :5173 free for a running dev server.
- `resize_window` via the Chrome MCP silently did not resize the tab
  (`innerWidth` stayed 1429). **Don't trust it.** Use Playwright's
  `setViewportSize` instead — that works, and `tests/responsive.spec.ts` now
  covers 375/393/768/959/961 px for horizontal overflow, text size and
  stacking. Verified visually at 393 px too: hero, premise, watch, a chapter
  and the build section all read correctly.
- Playwright's browser **cannot be launched from a `bun` script on Windows**
  (`launch: Timeout 180000ms exceeded` on the remote-debugging pipe). It works
  fine under the Playwright test runner, which uses node. For one-off browser
  work, add a temporary spec rather than a standalone script.
- On a phone, chapter media stacks _above_ its heading, because the DOM order
  is media-then-text to make the desktop sticky column work. With real photos
  that is a normal editorial pattern (image, headline, prose); it only looks
  odd right now because the placeholders are empty. Revisit once real images
  land — don't "fix" it before then.

## Progress log

- [x] Survey environment, find source material
- [x] Scaffold from ssg-base, `git init`, pristine first commit
- [x] Feedback layer — click/select → JSONL → live pin clearing, verified
      end-to-end in a real browser
- [x] Dev server up on :5173
- [x] Content + layout, first pass. Seven chapters, premise, index, tarp,
      materials, versions, footer
- [x] Real static 404
- [x] Tests (10 passing, chromium) + typecheck + format
- [x] GitHub repo, pushed
- [x] Cloudflare Workers config written (unverified)
- [x] Narrow-viewport check — `tests/responsive.spec.ts`, 20 assertions across
      5 widths, plus a visual pass at 393 px
- [x] Media pipeline — `bun run media`, AV1 + H.264, output to R2
- [ ] **Blocked on Cameron:** force-push the history rewrite (staged and
      verified locally; backup bundle at `~/hyparhuts-prerewrite-backup.bundle`)
- [ ] **Blocked on Cameron:** create the `hyparhuts-media` R2 bucket via ops
- [ ] Remaining media slots (4 more clips, roof diagram, hinge close-ups)
- [ ] ops deploy wiring

## Open questions for the user

1. Where are the iOS hinge-assembly live photos / the short video made from them?
   They're not on any drive I searched by folder name — likely still in the Photos
   library or on the phone. **Recommendation:** export the originals (live photos
   export as HEIC + MOV pairs) into a folder and point me at it.
2. ~~Is the 2014 footage worth including?~~ **Answered 2026-08-14: yes.** See
   `plans/media.md` for what's in it and the open questions that follow from that.
3. Tone: build-manual (someone should be able to make one) vs. showcase (look what
   this is)? **Recommendation:** showcase-first scroll narrative with a real
   "Build one" section, since the V3 README already has manual-grade content.

## Things not to do

- Don't touch Cloudflare, DNS, or the `ops` repo without per-change approval.
- Don't copy raw `.mov` files into the repo — transcode to web formats into a
  separate assets path.
- Don't rename `master`.
- Don't use `title=` attributes for tooltips anywhere in this site.
