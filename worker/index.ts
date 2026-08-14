/**
 * Cloudflare Worker in front of the static assets.
 *
 * Its only job beyond serving files is canonicalising the hostname:
 * hyparhuts.com, and any `www.` variant, redirect to bare hyparhuts.org.
 * Doing it here rather than in a dashboard redirect rule keeps it in the repo
 * and reviewable.
 *
 * NOT YET DEPLOYED. Wiring this up happens in the `ops` repo.
 */

const CANONICAL_HOST = "hyparhuts.org";

/** Preview deploys and local dev serve themselves — don't bounce those. */
function isCanonical(hostname: string): boolean {
  return (
    hostname === CANONICAL_HOST ||
    hostname === "localhost" ||
    hostname.endsWith(".workers.dev")
  );
}

type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

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

    return env.ASSETS.fetch(request);
  },
};
