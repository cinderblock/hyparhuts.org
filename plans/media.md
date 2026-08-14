# Media

What footage and stills exist, what they can and can't carry on the site, and
how to get them web-ready. Companion to `plans/hyparhuts-site.md`.

## Sources

Sources live off-repo on local drives. **Derived web files in `public/media/`
are committed.**

That reverses an earlier call to gitignore them, and the reason is simple: the
sources are 12–29 GB ProRes files on `S:` and `P:` that CI can never see, so an
ignored `public/media/` means every deploy ships a site with missing video.
Commit the derived files; never the sources. If the directory grows past about
100 MB, move it to R2 rather than reaching for Git LFS.

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

- `T:\Tom Sawyer Labs\Open Source Projects\hyparhut\Hypar Hut roof plan.jpg` —
  candidate for the `hypar-roof` diagram slot.
- `github.com/cinderblock/HyparHut` (branch `V3`) — `Layout.JPG`, plus
  `Layout.sldprt` / `Edge.sldprt` parameterized sketches. Rendering these is
  probably the best route to real geometry diagrams.
- `github.com/cinderblock/HyparShade` — separate shade-structure project.

### Still missing

The iOS live-photo hinge sequence and the short video Cameron assembled from
it. Not on C:, P:, S:, T: or W: under any hut-related folder name. Almost
certainly still in the Photos library. **This is the highest-value gap** — it
is the only known footage of the hinge technique, which is idea #1.

## Recipe

ProRes decodes fast but there is 115 GB of it, so cap threads — this is a
6-core workstation that other things run on.

Overview cut used for the first proof of concept:

```sh
ffmpeg -threads 4 -i "<clip>.mov" \
  -vf "framestep=31,scale=1280:-2,setpts=N/24/TB" -r 24 -an \
  -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart \
  -y public/media/build-d09-720.mp4
```

`framestep=31` over `d09`'s 33,912 frames gives ~1,094 frames, ~46 s at 24 fps
— roughly 31× on top of the in-camera compression. Adjust `framestep` to trade
length against choppiness; below about 20× the motion stays readable, above it
starts to strobe.

Add a VP9/WebM sibling and a poster frame before anything ships:

```sh
ffmpeg -threads 4 -i public/media/build-d09-720.mp4 \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -an -y public/media/build-d09-720.webm
ffmpeg -i public/media/build-d09-720.mp4 -ss 0 -frames:v 1 -y public/media/build-d09-poster.jpg
```

## Plan

1. ~~Characterise the footage~~ ✅
2. ~~One proof-of-concept overview clip from `d09`~~ ✅ — 46 s, 720p, 5.1 MB
   H.264 + 2.9 MB VP9 + a poster frame.
3. ~~Place it~~ ✅ — a "Watch one get built" section between the premise and
   the index of ideas, click-to-play. **Provisional**; see open question 1.
4. **← current** Judge length, speed and framing in context, then adjust.
5. Cut the remaining slots that the timelapse _can_ serve.
6. Find the hinge live photos; shoot new close-ups for `edge-trim` and
   `hinge-assembly` if they can't be found.
7. Render geometry diagrams from the SolidWorks sketches.
8. Build a `bun run media` script so the whole set regenerates from sources.

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
- Don't re-add `public/media/` to `.gitignore` — see the reasoning above.
- Don't autoplay the timelapse. It is several MB and nothing but motion.
- Don't autoplay with sound, and don't autoplay at all without
  `prefers-reduced-motion` being respected.
