# Media

What footage and stills exist, what they can and can't carry on the site, and
how to get them web-ready. Companion to `plans/hyparhuts-site.md`.

## Sources

Sources live off-repo. **Derived web files live in Cloudflare R2, not in git.**

Decided 2026-08-14 after costing the alternatives. R2 is $0/month at any
plausible traffic for this site — 10 GB storage free, and R2 charges no egress
at all — and keeping video out of git matters because we expect to iterate on
encodes, and every attempt would otherwise be a permanent blob.

The Worker proxies `/media/*` to the bucket, so paths are identical in dev and
production: Vite serves `public/media/` locally, R2 serves it deployed.
Nothing in the app knows the difference. `public/media/` is gitignored;
`bun run media` regenerates it from the originals.

Rejected, with reasons:

| Option                 | Why not                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Commit to git          | Permanent history for every re-encode. Tried it; reverted.                                              |
| Git LFS                | 1 GB/month bandwidth quota is account-wide and CI checkouts consume it. Worst option for a public repo. |
| Vimeo                  | ~$12–25/mo for what R2 does free.                                                                       |
| YouTube                | Branded player, ads, ~1 MB iframe, end-screen recommendations, sets cookies → consent banner.           |
| Cloudflare Stream      | ~$0.15–3/mo. Real ABR, but overkill for short silent clips. Revisit if a long piece appears.            |
| Self-host on steamboat | Equally free and you already run Caddy there, but adds an uptime dependency for static files.           |

### Archive — resolved

`P:`, `S:`, `T:` and `W:` are all SMB shares on **one server**, `uberfall.tsl`,
same pool — identical used/free on all four. The copies of `d10b`, `d11a` and
`d11b` that exist "in both P: and S:" are the same bytes on the same disks,
not redundancy.

That pool is **two drives in RAID 0**. Striping is negative redundancy: either
drive failing loses the whole array, so the odds of total loss are roughly
double a single disk's.

**Cameron is setting up offsite backups (as of 2026-08-14), which covers this.**
No separate archive bucket. If the seed is prioritisable, the hut originals are
worth going early — 100.9 GB against ~17.1 TB used, about 0.6% of the array,
so hours rather than the weeks a full seed takes. They are also the only files
here that cannot be recreated.

Do not re-propose paid archive storage for these; it is handled.

### 2014 build timelapse — the main asset

Five clips, **1080p24 ProRes 422 (10-bit), ~168 Mbps, no useful audio**,
totalling **1 h 22 m** and about 115 GB. Shot on a Blackmagic Pocket Cinema
Camera over three days, 9–11 September 2014.

**Already time-compressed in camera** — a bare warehouse floor becomes
assembled walls inside ~15 minutes of playback. That matters: it is usable
material, not hours of raw sitting-around that has to be culled first.

| Key    | Date / time      | Runtime | Path                                                                 |
| ------ | ---------------- | ------- | -------------------------------------------------------------------- |
| `d09`  | 2014-09-09 13:40 | 23:33   | `S:\Cam's Crap\HyparHut Build Recordings\…2014-09-09_1340_C0000.mov` |
| `d10a` | 2014-09-10 12:23 | 17:12   | `S:\Cam's Crap\HyparHut Build Recordings\…2014-09-10_1223_C0000.mov` |
| `d10b` | 2014-09-10 19:16 | 15:38   | `P:\Projects\HyparHut Timelapse\…2014-09-10_1916_C0000.mov`          |
| `d11a` | 2014-09-11 19:22 | 13:21   | `P:\Projects\HyparHut Timelapse\…2014-09-11_1922_C0000.mov`          |
| `d11b` | 2014-09-11 19:39 | 12:06   | `P:\Projects\HyparHut Timelapse\…2014-09-11_1939_C0000.mov`          |

`d10b`, `d11a` and `d11b` exist in **both** locations, byte-identical sizes.
`S:` has `d09` and `d10a` that `P:` does not. Treat `S:` + `P:` as one set of
five; there is no sixth clip hiding.

What each one actually shows, from contact sheets at 12 evenly-spaced points:

- **`d09`** — the best single arc. Empty floor → foam delivered and stacked →
  sheets laid out on benches → cutting and wrapping → first panels stood up →
  walls assembled. This is the clip to cut an overview from.
- **`d10a`** — the wrapped structure standing in the middle of the shop,
  crisply white, people working around and inside it.
- **`d10b`** — continues `d10a`, into the evening.
- **`d11a`, `d11b`** — a wider setup with a truck in frame; bare R-Max panels
  and finished white ones side by side, panel wrapping in progress.

**Limitation, and it's the important one:** every clip is a locked-off wide
shot of the shop. It documents _process and scale_ well and shows nothing in
detail. It cannot fill the `hinge-assembly` or `edge-trim` slots, which need
close-ups. Do not let the timelapse existing be mistaken for those slots
being covered.

### Stills and CAD

- **`Layout.JPG`** in `github.com/cinderblock/HyparHut` (branch `V3`), 1446×886
  — a line drawing of the V3 hut with the hypar roof surface picked out in
  blue. **In use** for the `hypar-roof` slot, cropped and padded to 1200×866.
  Fetched and processed by `bun run media`.
- `T:\…\hyparhut\Hypar Hut roof plan.jpg`, 1307×1144 — the dimensioned roof
  cut plan out of SolidWorks. Dozens of dimensions on a gradient background;
  far too dense to explain anything at web size. Better as evidence in the
  Build section that real parameterized geometry exists, probably as a
  thumbnail that links to the full file. **Not used yet.**
- `Layout.sldprt` / `Edge.sldprt` in the same repo — parameterized sketches.
  Rendering these is the best route to further geometry diagrams.
- `github.com/cinderblock/HyparShade` — separate shade-structure project.

Fetching from GitHub: use `gh api -H "Accept: application/vnd.github.raw"`.
The `contents` endpoint's base64 body silently produced a **zero-byte file**
for this JPEG; the raw endpoint gets it intact.

Line drawings sit on a light card (`.media-image-diagram`) in both colour
schemes. Inverting them for dark mode would wreck the blue, and technical
drawings live on paper anyway. Verified in both schemes.

### The social card

`public/og.png`, 1200×630, **committed** — it lives at the site root rather
than under `/media` because scrapers must reach it without depending on the R2
bucket, and it is a one-off brand asset, not derived footage.

Built from the same `Layout.JPG`, inverted. The happy accident: negating turns
the drawing's blue curves almost exactly our orange accent, and the black
construction lines white. Regenerate with:

```sh
# fonts copied to the work dir first — ffmpeg's filter parser and Windows
# drive-letter colons do not get along
ffmpeg -f lavfi -i "color=c=0x221f1a:s=1200x630" -i hypar-geometry.png \
  -filter_complex "\
[1:v]negate,scale=500:-1,format=rgba,colorkey=0x000000:0.32:0.12[art];\
[0:v][art]overlay=x=655:y=(H-h)/2[c1];\
[c1]drawtext=fontfile=semi.ttf:text='T E M P O R A R Y   S T R U C T U R E S':fontcolor=0xe2803f:fontsize=20:x=74:y=204[c2];\
[c2]drawtext=fontfile=bold.ttf:text='HyparHuts':fontcolor=0xf2ede3:fontsize=82:x=70:y=248[c3];\
[c3]drawtext=fontfile=semi.ttf:text='Up in five minutes. Folds flat.':fontcolor=0xa89e8e:fontsize=27:x=74:y=360[out]" \
  -map "[out]" -frames:v 1 -y public/og.png
```

`colorkey` drops the black field the negate leaves behind, so the drawing
floats on the card colour instead of sitting in a visible box. Without it
there is an obvious rectangle, because pure black reads against the warm
`#221f1a`.

### Still missing

The iOS live-photo hinge sequence and the short video Cameron assembled from
it. Not on C:, P:, S:, T: or W: under any hut-related folder name. Almost
certainly still in the Photos library. **This is the highest-value gap** — it
is the only known footage of the hinge technique, which is idea #1.

## Encoding

`bun run media` does all of this; `scripts/media.ts` is the source of truth.
Add clips to the `CLIPS` array there.

`framestep=31` over `d09`'s 33,912 frames gives ~1,094 frames, ~46 s at 24 fps
— roughly 31× on top of the in-camera compression. Lower it for a longer,
smoother clip; raise it for shorter and choppier. Below about 20× motion stays
readable; above it starts to strobe.

One decode pass of the ProRes feeds both encoders via a `split` filter, capped
at 4 threads — six physical cores, shared with a human.

### What the measurements actually said

Same 46 s clip, all at 720p unless noted:

| Encode           | Size        | Verdict                                       |
| ---------------- | ----------- | --------------------------------------------- |
| x264 CRF 23      | 5.06 MB     | The first attempt. Wasteful.                  |
| **AV1 CRF 40**   | **3.13 MB** | **Shipped.** Quality tier.                    |
| **x264 CRF 26**  | **3.24 MB** | **Shipped.** Universal fallback.              |
| AV1 CRF 46       | 2.20 MB     |                                               |
| AV1 CRF 52       | 1.59 MB     | Visibly smears anyone moving                  |
| AV1 960p CRF 46  | 1.53 MB     | Softer than 720p CRF 52 at the same size      |
| x264 960p CRF 28 | 1.57 MB     |                                               |
| x265 CRF 30      | 1.68 MB     | Useless — no HEVC-in-MP4 in Chrome or Firefox |

Three things worth keeping:

- **At equal size, 720p at a high CRF beats 960p at a low one.** Compression
  artifacts on a locked-off wide shot are less objectionable than softness.
- **Don't compress harder than this.** The reason to squeeze was git history.
  On R2, storage and egress are both free, so sub-2 MB buys nothing and costs
  visible quality on anyone moving.
- **AV1 needs a precise `codecs` string** in `<source type>` so browsers that
  can't decode it fall through. The H.264 fallback must _not_ have one, or it
  stops being universal. Also: input-seeking (`-ss` before `-i`) an AV1 stream
  drops the frame — seek on output when grabbing posters.

## The montage

`build-full` — all five clips concatenated chronologically, `framestep=40`.
**2:02.8, 2,947 frames, 8.8 MB AV1 / 11.2 MB H.264.** One decode pass over all
115 GB via a `concat` filter; roughly 40 minutes to encode.

`setsar=1` on each input is required — `concat` refuses inputs whose sample
aspect ratios differ, and the BMPCC files declare 96:96 rather than 1:1.

Chosen over five separate clips because "Watch one get built" implies a
complete build and five clips is a chore to sit through.

**It ends weak.** The peak is the wrapped structure standing, around the
one-third mark. The last third is the `d11a`/`d11b` setup — a different camera
position, a truck in frame, and a lot of empty floor. Two options if that
bothers anyone:

- Cut to `d09` + `d10a` + `d10b` only, ending with the hut standing. Shorter,
  stronger, and arguably more honest since `d11` looks like a separate session
  rather than the completion of this one.
- Leave it as a full three-day record.

Poster frames are worth checking rather than guessing. The first pick landed
on a lunch break; 42 s has the wrapped structure prominent with someone beside
it for scale.

## Plan

1. ~~Characterise the footage~~ ✅
2. ~~Proof-of-concept clip from `d09`~~ ✅ — 46 s, kept as the short alternative.
3. ~~Place it~~ ✅ — "Watch one get built", between the premise and the index.
4. ~~Full three-day montage~~ ✅ — `build-full`, 2:03, now the one on the page.
5. **← current** Judge length, speed and the weak ending in context.
6. Cut the remaining slots that the timelapse _can_ serve.
7. Find the hinge live photos; shoot new close-ups for `edge-trim` and
   `hinge-assembly` if they can't be found.
8. Render geometry diagrams from the SolidWorks sketches.
9. Build a `bun run media` script so the whole set regenerates from sources.

## Open questions

1. **Is the placement right?** Built as a dedicated section rather than a hero
   loop, because a hero video fights the wordmark and costs mobile users
   several MB before they have read anything. Easy to move if that's wrong.
2. **Is 46 s right, and is the speed right?** `framestep=31`. Lower it for a
   longer, smoother clip; raise it for shorter and choppier.
3. Should the other four clips become their own cuts, or should all five be
   edited into one continuous three-day piece?
4. Is there newer build footage that supersedes 2014?

## Things not to do

- Don't copy source `.mov` files into the repo. They are 12–29 GB each.
- Don't commit anything to `public/media/`. It is gitignored on purpose;
  media belongs in R2. This was tried and reverted — see above.
- Don't autoplay the timelapse. It is several MB and nothing but motion.
- Don't compress below ~3 MB chasing a number. See the measurements.
- Don't add a `codecs` string to the H.264 `<source>`.
- Don't ship an `<img>` without `width`/`height`. Without them it collapses to
  a line box, which shifts the layout on load **and** stops `loading="lazy"`
  from ever firing — there is no box for the observer to intersect, so the
  image silently never appears. This happened; `tests/home.spec.ts` guards it.
- Don't use the `contents` API for binaries — it returned a zero-byte JPEG.
