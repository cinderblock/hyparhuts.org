/**
 * Prerendering writes the not-found page to `404/index.html`, but Cloudflare's
 * `not_found_handling: "404-page"` looks for `404.html`. Copy it across after
 * the build so a miss gets the real page instead of the empty SPA shell.
 */

import { copyFile } from "node:fs/promises";

const from = "build/client/404/index.html";
const to = "build/client/404.html";

await copyFile(from, to);
console.log(`Emitted ${to}`);
