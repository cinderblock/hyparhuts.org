import { appendFile, mkdir, readFile, watch } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import type { Connect, Plugin, ViteDevServer } from "vite";

/**
 * Dev-only feedback capture.
 *
 * Cameron clicks a bit of the page, types a note, and it lands in
 * `feedback/feedback.jsonl` where Claude can read it. Claude appends a
 * `resolve` record when it acts, which streams back to the browser so the
 * note visibly checks itself off without a reload.
 *
 * Append-only JSONL on purpose: both sides only ever append, so neither can
 * clobber the other's write, and a half-written line at the tail is
 * recoverable by dropping it.
 */

const LOG = "feedback/feedback.jsonl";
const ENDPOINT = "/__feedback";

type Record_ = { type?: string; id?: string; [k: string]: unknown };

function parseLines(raw: string): Record_[] {
  const out: Record_[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as Record_);
    } catch {
      // A partially-flushed tail line. Skip it; the writer will finish it.
    }
  }
  return out;
}

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((res, rej) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      // A comment is a sentence, not an upload.
      if (data.length > 1_000_000) rej(new Error("body too large"));
    });
    req.on("end", () => res(data));
    req.on("error", rej);
  });
}

export function feedbackPlugin(): Plugin {
  let logPath: string;
  const clients = new Set<ServerResponse>();

  async function readAll(): Promise<Record_[]> {
    try {
      return parseLines(await readFile(logPath, "utf8"));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async function append(record: Record_) {
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  }

  function broadcast(records: Record_[]) {
    const frame = `data: ${JSON.stringify(records)}\n\n`;
    for (const res of clients) res.write(frame);
  }

  /** Tail the log so records Claude appends show up in the browser live. */
  async function watchLog(server: ViteDevServer) {
    await mkdir(dirname(logPath), { recursive: true });
    let last = (await readAll()).length;
    try {
      for await (const _ of watch(dirname(logPath), { signal: undefined })) {
        const all = await readAll();
        if (all.length > last) {
          broadcast(all.slice(last));
          last = all.length;
        } else if (all.length < last) {
          // Log was truncated or replaced; resync everyone from scratch.
          last = all.length;
          broadcast(all);
        }
      }
    } catch (err) {
      server.config.logger.warn(`[feedback] watch stopped: ${String(err)}`);
    }
  }

  return {
    name: "hyparhuts:feedback",
    apply: "serve",

    configResolved(config) {
      logPath = resolve(config.root, LOG);
    },

    configureServer(server) {
      void watchLog(server);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url?.startsWith(ENDPOINT)) return next();

        try {
          if (url === `${ENDPOINT}/stream`) {
            res.writeHead(200, {
              "content-type": "text/event-stream",
              "cache-control": "no-store",
              connection: "keep-alive",
            });
            res.write(": connected\n\n");
            clients.add(res);
            req.on("close", () => clients.delete(res));
            return;
          }

          if (req.method === "GET" && url === ENDPOINT) {
            return json(res, 200, await readAll());
          }

          if (req.method === "POST" && url === ENDPOINT) {
            const record = JSON.parse(await readBody(req)) as Record_;
            await append(record);
            server.config.logger.info(
              `[feedback] ${record.type === "resolve" ? "resolved" : "new"} ${record.id ?? "?"}`,
            );
            return json(res, 200, { ok: true });
          }

          return json(res, 405, { error: "method not allowed" });
        } catch (err) {
          server.config.logger.error(`[feedback] ${String(err)}`);
          return json(res, 500, { error: String(err) });
        }
      });
    },
  };
}
