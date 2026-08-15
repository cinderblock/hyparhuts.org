/**
 * Cloudflare Worker in front of the static assets.
 *
 * Two jobs:
 *
 * 1. Canonicalise the hostname — hyparhuts.com, and any `www.` variant,
 *    redirect to bare hyparhuts.org. Done here rather than in a dashboard
 *    redirect rule so it stays in the repo and reviewable.
 *
 * 2. Serve `/media/*` out of R2. Video lives in a bucket rather than in git,
 *    so the repo doesn't accumulate a permanent copy of every re-encode. The
 *    path stays `/media/...` in both dev and production — Vite serves the same
 *    URLs from `public/media/` locally — so nothing in the app needs to know
 *    where the bytes actually come from.
 *
 * NOT YET DEPLOYED. Wiring this up happens in the `ops` repo.
 */

const CANONICAL_HOST = "hyparhuts.org";
const MEDIA_PREFIX = "/media/";

/** Preview deploys and local dev serve themselves — don't bounce those. */
function isCanonical(hostname: string): boolean {
  return (
    hostname === CANONICAL_HOST ||
    hostname === "localhost" ||
    hostname.endsWith(".workers.dev")
  );
}

// Minimal shapes for the bits of the R2 API used here, so this compiles
// without pulling in @cloudflare/workers-types.
type R2Range = { offset?: number; length?: number; suffix?: number };
type R2Object = {
  body?: ReadableStream;
  size: number;
  etag: string;
  httpEtag: string;
  range?: R2Range;
  writeHttpMetadata(headers: Headers): void;
};
type R2Bucket = {
  get(
    key: string,
    options?: { range?: Headers; onlyIf?: Headers },
  ): Promise<R2Object | null>;
  head(key: string): Promise<R2Object | null>;
};

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  MEDIA: R2Bucket;
};

/**
 * Range support is not optional here: without a 206 the browser cannot seek a
 * video, and Safari refuses to start playback at all.
 */
async function serveMedia(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }
  if (!key || key.includes(".."))
    return new Response("Not found", { status: 404 });

  const object = await env.MEDIA.get(key, {
    range: request.headers,
    onlyIf: request.headers,
  });

  if (object === null) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  // Content is immutable per filename; re-encodes get a new name.
  headers.set("cache-control", "public, max-age=31536000, immutable");

  // No body means the conditional request matched — 304, nothing to send.
  if (!object.body) return new Response(null, { status: 304, headers });

  if (object.range && "offset" in object.range) {
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - offset;
    const end = offset + length - 1;
    headers.set("content-range", `bytes ${offset}-${end}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(request.method === "HEAD" ? null : object.body, {
      status: 206,
      headers,
    });
  }

  headers.set("content-length", String(object.size));
  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!isCanonical(url.hostname)) {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      url.port = "";
      // 308 rather than 301: preserves the method, and browsers cache it the
      // same way. Nothing here is a POST today, but a permanent 301 on a
      // wrong-host guess is expensive to walk back.
      return Response.redirect(url.toString(), 308);
    }

    if (url.pathname.startsWith(MEDIA_PREFIX)) {
      return serveMedia(
        request,
        env,
        decodeURIComponent(url.pathname.slice(MEDIA_PREFIX.length)),
      );
    }

    return env.ASSETS.fetch(request);
  },
};
