import type { Anchor } from "./anchor";

export type Entry = {
  type: "comment";
  id: string;
  ts: string;
  route: string;
  anchor: Anchor;
  comment: string;
  viewport: { w: number; h: number };
};

export type Resolution = {
  type: "resolve";
  id: string;
  ts: string;
  note?: string;
};

export type Record_ = Entry | Resolution;

const ENDPOINT = "/__feedback";

/**
 * The in-progress comment lives in sessionStorage, not React state.
 *
 * The whole point of this layer is that Claude edits the page while Cameron is
 * mid-sentence. Fast Refresh resets component state and a route-file edit can
 * force a full reload — either would eat the draft. sessionStorage survives
 * both.
 */
const DRAFT_KEY = "hyparhuts:feedback:draft";

export type Draft = { anchor: Anchor; comment: string };

export function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode or a full storage quota. Losing a draft is survivable;
    // breaking the overlay is not.
  }
}

export async function fetchAll(): Promise<Record_[]> {
  const res = await fetch(ENDPOINT);
  if (!res.ok) throw new Error(`feedback: ${res.status}`);
  return (await res.json()) as Record_[];
}

export async function post(record: Record_): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`feedback: ${res.status}`);
}

/** Live tail of the log, so Claude's resolutions land without a reload. */
export function subscribe(onRecords: (records: Record_[]) => void): () => void {
  const source = new EventSource(`${ENDPOINT}/stream`);
  source.onmessage = (ev) => {
    try {
      onRecords(JSON.parse(ev.data) as Record_[]);
    } catch {
      // Ignore a malformed frame rather than tearing down the stream.
    }
  };
  return () => source.close();
}

export function newId(): string {
  return `fb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
