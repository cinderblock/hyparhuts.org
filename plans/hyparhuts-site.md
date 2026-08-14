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
2. **← current** Dev feedback layer + dev server running
3. Site content and scroll-narrative layout
4. Locate and process media; build a real media pipeline
5. Create public GitHub repo, push
6. Cloudflare Workers config (`wrangler.jsonc`) + redirect logic for
   `.com` → `.org` and `www` → apex
7. Wire deploy in `ops`

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

## Findings / gotchas

- `ssg-base`'s `vite.config.ts` has `allowedHosts: ["noook","noook.tsl"]` — machine
  specific, kept.
- `HyparHut` repo default branch is `V3`, not `master`. `V2`'s design files are lost
  (noted in that README).
- Timelapse footage is 15–29 GB **per file**, 2014 vintage, ProRes-ish `.mov` from a
  BMPCC. Nothing web-usable without a transcode step. Don't naively copy into the repo.

## Progress log

- [x] Survey environment, find source material
- [x] Scaffold from ssg-base, `git init`, pristine first commit
- [ ] Feedback layer
- [ ] Dev server up
- [ ] Content + layout
- [ ] Media pipeline
- [ ] GitHub repo
- [ ] Cloudflare Workers config
- [ ] ops deploy wiring

## Open questions for the user

1. Where are the iOS hinge-assembly live photos / the short video made from them?
   They're not on any drive I searched by folder name — likely still in the Photos
   library or on the phone. **Recommendation:** export the originals (live photos
   export as HEIC + MOV pairs) into a folder and point me at it.
2. Is the 2014 timelapse footage worth a transcode pass for the site, or is it
   superseded by newer builds?
3. Tone: build-manual (someone should be able to make one) vs. showcase (look what
   this is)? **Recommendation:** showcase-first scroll narrative with a real
   "Build one" section, since the V3 README already has manual-grade content.

## Things not to do

- Don't touch Cloudflare, DNS, or the `ops` repo without per-change approval.
- Don't copy raw `.mov` files into the repo — transcode to web formats into a
  separate assets path.
- Don't rename `master`.
- Don't use `title=` attributes for tooltips anywhere in this site.
