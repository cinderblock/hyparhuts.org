/**
 * Regenerate web-ready media from the ProRes originals.
 *
 * `public/media/` is gitignored — the files live in R2 — so this is how a
 * fresh checkout (or a re-encode experiment) gets them back. Sources are on
 * SMB shares that only exist on Cameron's LAN, so this cannot run in CI; use
 * `scripts/media-upload.ts` to push the results to R2.
 *
 *   bun run media           # encode anything missing
 *   bun run media --force   # re-encode everything
 *
 * Encoder notes, from measuring rather than guessing (see plans/media.md):
 *  - AV1 at 720p/CRF 40 lands ~3.1 MB for 46 s. Pushing to CRF 52 halves that
 *    but visibly smears anyone moving, and since R2 storage and egress are
 *    both free there is nothing to buy with the quality.
 *  - At equal size, 720p at a higher CRF beats 960p at a lower one.
 *  - x265 compresses better than both and is useless — no HEVC-in-MP4 in
 *    Chrome or Firefox.
 */

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

type Clip = {
  /** Output basename under public/media. */
  name: string;
  source: string;
  /** Keep 1 frame in N. Trades length against choppiness; ~31 reads well. */
  framestep: number;
  poster: { atSeconds: number };
};

type Still = {
  name: string;
  /** Local path, or a GitHub repo path fetched via the raw endpoint. */
  source:
    | { kind: "file"; path: string }
    | { kind: "gh"; repo: string; path: string; ref: string };
  /** ffmpeg filter chain applied before export. */
  filter: string;
};

const OUT_DIR = "public/media";

const SHARE_CAM = "S:/Cam's Crap/HyparHut Build Recordings";

export const CLIPS: Clip[] = [
  {
    name: "build-d09",
    source: `${SHARE_CAM}/Blackmagic Pocket Cinema Camera_1_2014-09-09_1340_C0000.mov`,
    framestep: 31,
    // Late enough that the poster shows walls standing, not a bare floor.
    poster: { atSeconds: 41 },
  },
];

export const STILLS: Still[] = [
  {
    name: "hypar-geometry",
    // The V3 layout drawing: the twisted roof surface picked out in blue.
    source: {
      kind: "gh",
      repo: "cinderblock/HyparHut",
      path: "Layout.JPG",
      ref: "V3",
    },
    // Bounds measured off the 1446x886 original, then padded so nothing
    // touches the frame edge.
    filter: "crop=1190:856:248:26,pad=iw+80:ih+60:40:30:white,scale=1200:-2",
  },
];

const force = process.argv.includes("--force");

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
}

async function encode(clip: Clip): Promise<void> {
  const av1 = join(OUT_DIR, `${clip.name}.av1.mp4`);
  const h264 = join(OUT_DIR, `${clip.name}.h264.mp4`);
  const poster = join(OUT_DIR, `${clip.name}-poster.jpg`);

  if (
    !force &&
    (await exists(av1)) &&
    (await exists(h264)) &&
    (await exists(poster))
  ) {
    console.log(`${clip.name}: up to date`);
    return;
  }

  if (!(await exists(clip.source))) {
    console.error(`${clip.name}: SOURCE MISSING — ${clip.source}`);
    console.error("  These live on the uberfall.tsl shares. Skipping.");
    return;
  }

  console.log(`${clip.name}: encoding…`);
  const chain = `[0:v]framestep=${clip.framestep},scale=1280:-2,setpts=N/24/TB,split=2[a][b]`;

  // One decode pass of a ~20 GB ProRes file, split to both encoders.
  // -threads 4 deliberately: six physical cores, shared with a human.
  await run([
    "-v",
    "warning",
    "-stats",
    "-threads",
    "4",
    "-i",
    clip.source,
    "-filter_complex",
    chain,
    "-map",
    "[a]",
    "-r",
    "24",
    "-an",
    "-c:v",
    "libsvtav1",
    "-crf",
    "40",
    "-preset",
    "6",
    "-g",
    "48",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    av1,
    "-map",
    "[b]",
    "-r",
    "24",
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "26",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    h264,
    "-y",
  ]);

  // Output-seek: input-seeking an AV1 stream drops the frame entirely.
  await run([
    "-v",
    "error",
    "-i",
    h264,
    "-ss",
    String(clip.poster.atSeconds),
    "-frames:v",
    "1",
    "-q:v",
    "4",
    poster,
    "-y",
  ]);

  console.log(`${clip.name}: done`);
}

/**
 * `gh api` with the raw Accept header. The `contents` endpoint's base64 body
 * silently produced a zero-byte file for this JPEG, so don't go back to it.
 */
function ghRaw(
  repo: string,
  path: string,
  ref: string,
  dest: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(dest);
    const proc = spawn(
      "gh",
      [
        "api",
        "-H",
        "Accept: application/vnd.github.raw",
        `repos/${repo}/contents/${path}?ref=${ref}`,
      ],
      { stdio: ["ignore", "pipe", "inherit"] },
    );
    // Both the process and the write stream have to finish, and either can
    // finish first. Registering the stream listener inside the process
    // callback loses the race and hangs forever when the stream closes first.
    let procDone = false;
    let streamDone = false;
    const settle = () => {
      if (procDone && streamDone) resolve();
    };

    proc.stdout.pipe(out);
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`gh exited ${code}`));
      procDone = true;
      settle();
    });
    out.on("error", reject);
    out.on("close", () => {
      streamDone = true;
      settle();
    });
  });
}

async function exportStill(still: Still): Promise<void> {
  const png = join(OUT_DIR, `${still.name}.png`);
  const webp = join(OUT_DIR, `${still.name}.webp`);

  if (!force && (await exists(png)) && (await exists(webp))) {
    console.log(`${still.name}: up to date`);
    return;
  }

  let src: string;
  if (still.source.kind === "file") {
    src = still.source.path;
    if (!(await exists(src))) {
      console.error(`${still.name}: SOURCE MISSING — ${src}. Skipping.`);
      return;
    }
  } else {
    src = join(OUT_DIR, `.${still.name}.src`);
    console.log(
      `${still.name}: fetching ${still.source.path} from ${still.source.repo}…`,
    );
    await ghRaw(still.source.repo, still.source.path, still.source.ref, src);
  }

  console.log(`${still.name}: exporting…`);
  await run(["-v", "error", "-i", src, "-vf", still.filter, "-y", png]);
  await run([
    "-v",
    "error",
    "-i",
    src,
    "-vf",
    still.filter,
    "-q:v",
    "82",
    "-y",
    webp,
  ]);

  if (still.source.kind === "gh") await rm(src, { force: true });
  console.log(`${still.name}: done`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const clip of CLIPS) await encode(clip);
for (const still of STILLS) await exportStill(still);
