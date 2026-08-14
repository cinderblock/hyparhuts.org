import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  type Anchor,
  describe,
  isFeedbackUi,
  meaningfulTarget,
} from "./anchor";
import { type Rect, rectOf, useAnchorRect, useFloating } from "./placement";
import {
  type Draft,
  type Entry,
  type Record_,
  fetchAll,
  loadDraft,
  newId,
  post,
  saveDraft,
  subscribe,
} from "./store";
import "./feedback.css";

export default function FeedbackLayer() {
  const location = useLocation();
  const [armed, setArmed] = useState(false);
  const [hover, setHover] = useState<Rect | null>(null);
  const [draft, setDraft] = useState<Draft | null>(() => loadDraft());
  const [records, setRecords] = useState<Record_[]>([]);
  const [openPin, setOpenPin] = useState<string | null>(null);
  const [selection, setSelection] = useState<{
    rect: Rect;
    anchor: Anchor;
  } | null>(null);

  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const draftAnchorRect = useAnchorRect(draft?.anchor ?? null);
  const composerAt = useFloating(composerRef, draftAnchorRect, !!draft);

  // ---- log -----------------------------------------------------------------

  useEffect(() => {
    let live = true;
    fetchAll()
      .then((all) => live && setRecords(all))
      .catch(() => {});
    const unsubscribe = subscribe((incoming) =>
      setRecords((prev) => {
        const known = new Set(prev.map((r) => `${r.type}:${r.id}`));
        return [
          ...prev,
          ...incoming.filter((r) => !known.has(`${r.type}:${r.id}`)),
        ];
      }),
    );
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);

  const resolvedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of records) if (r.type === "resolve") ids.add(r.id);
    return ids;
  }, [records]);

  const openComments = useMemo(
    () =>
      records.filter(
        (r): r is Entry =>
          r.type === "comment" &&
          r.route === location.pathname &&
          !resolvedIds.has(r.id),
      ),
    [records, resolvedIds, location.pathname],
  );

  // ---- draft ---------------------------------------------------------------

  const updateDraft = useCallback((next: Draft | null) => {
    setDraft(next);
    saveDraft(next);
  }, []);

  const draftKey = draft?.anchor.selector;
  useEffect(() => {
    if (draftKey) textareaRef.current?.focus();
  }, [draftKey]);

  const submit = useCallback(async () => {
    if (!draft?.comment.trim()) return;
    const entry: Entry = {
      type: "comment",
      id: newId(),
      ts: new Date().toISOString(),
      route: location.pathname,
      anchor: draft.anchor,
      comment: draft.comment.trim(),
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
    updateDraft(null);
    setArmed(false);
    setSelection(null);
    setRecords((prev) => [...prev, entry]);
    try {
      await post(entry);
    } catch (err) {
      console.error("[feedback] save failed", err);
    }
  }, [draft, location.pathname, updateDraft]);

  // ---- targeting -----------------------------------------------------------

  useEffect(() => {
    if (!armed) {
      setHover(null);
      return;
    }
    const at = (ev: MouseEvent): Element | null => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      return el && !isFeedbackUi(el) ? meaningfulTarget(el) : null;
    };
    const onMove = (ev: MouseEvent) => {
      const el = at(ev);
      setHover(el ? rectOf(el) : null);
    };
    const onClick = (ev: MouseEvent) => {
      const el = at(ev);
      if (!el) return;
      ev.preventDefault();
      ev.stopPropagation();
      updateDraft({ anchor: describe(el), comment: "" });
      setArmed(false);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [armed, updateDraft]);

  // Selecting text offers a comment bubble without arming anything.
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (!sel || !text || sel.rangeCount === 0) return setSelection(null);
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const container =
        node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : node.parentElement;
      if (!container || isFeedbackUi(container)) return setSelection(null);
      const r = range.getBoundingClientRect();
      setSelection({
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        anchor: describe(container, text),
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  // ---- keyboard ------------------------------------------------------------

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        updateDraft(null);
        setArmed(false);
        setOpenPin(null);
        return;
      }
      if (
        (ev.ctrlKey || ev.metaKey) &&
        ev.key.toLowerCase() === "i" &&
        !ev.shiftKey
      ) {
        ev.preventDefault();
        setArmed((a) => !a);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [updateDraft]);

  // ---- render --------------------------------------------------------------

  const highlight = armed ? hover : draft ? draftAnchorRect : null;

  return (
    <div data-feedback-ui="" className="fb-root">
      {highlight && (
        <div
          className={`fb-highlight${draft && !armed ? " fb-highlight-locked" : ""}`}
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      )}

      {armed && (
        <div className="fb-armed-hint">
          Click anything to comment · Esc to cancel
        </div>
      )}

      {selection && !draft && !armed && (
        <button
          type="button"
          className="fb-selection-bubble"
          style={{
            top: Math.min(
              selection.rect.top + selection.rect.height + 8,
              window.innerHeight - 48,
            ),
            left: Math.min(selection.rect.left, window.innerWidth - 200),
          }}
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => {
            updateDraft({ anchor: selection.anchor, comment: "" });
            setSelection(null);
          }}
        >
          Comment on selection
        </button>
      )}

      {openComments.map((entry, i) => (
        <Pin
          key={entry.id}
          entry={entry}
          index={i + 1}
          open={openPin === entry.id}
          onToggle={() => setOpenPin((p) => (p === entry.id ? null : entry.id))}
        />
      ))}

      {draft && (
        <div
          ref={composerRef}
          className="fb-composer"
          style={{
            top: composerAt?.top ?? -9999,
            left: composerAt?.left ?? -9999,
            visibility: composerAt ? "visible" : "hidden",
          }}
        >
          <div className="fb-composer-anchor">
            <span className="fb-quote">
              {draft.anchor.selectedText
                ? `“${draft.anchor.selectedText.slice(0, 140)}”`
                : draft.anchor.text.slice(0, 140) || "(no text)"}
            </span>
            {!draftAnchorRect && (
              <span className="fb-detached">
                anchor moved — the comment still saves
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className="fb-textarea"
            placeholder="What should change here?"
            value={draft.comment}
            rows={3}
            onChange={(ev) =>
              updateDraft({ ...draft, comment: ev.target.value })
            }
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
                ev.preventDefault();
                void submit();
              }
            }}
          />
          <div className="fb-composer-actions">
            <span className="fb-hint">⌘/Ctrl+Enter to save</span>
            <button
              type="button"
              className="fb-btn-ghost"
              onClick={() => updateDraft(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="fb-btn"
              disabled={!draft.comment.trim()}
              onClick={() => void submit()}
            >
              Save
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`fb-toggle${armed ? " fb-toggle-armed" : ""}`}
        onClick={() => setArmed((a) => !a)}
      >
        <span>{armed ? "Pick a spot…" : "Feedback"}</span>
        {openComments.length > 0 && (
          <span className="fb-count">{openComments.length}</span>
        )}
      </button>
    </div>
  );
}

function Pin({
  entry,
  index,
  open,
  onToggle,
}: {
  entry: Entry;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const anchorRect = useAnchorRect(entry.anchor);
  const cardAt = useFloating(cardRef, anchorRect, open);

  if (!anchorRect) return null;

  const offscreen =
    anchorRect.top > window.innerHeight ||
    anchorRect.top + anchorRect.height < 0;

  return (
    <>
      {!offscreen && (
        <button
          type="button"
          className="fb-pin"
          style={{
            top: Math.min(
              Math.max(anchorRect.top - 8, 4),
              window.innerHeight - 26,
            ),
            left: Math.min(
              anchorRect.left + anchorRect.width - 8,
              window.innerWidth - 26,
            ),
          }}
          onClick={onToggle}
        >
          {index}
        </button>
      )}
      {open && (
        <div
          ref={cardRef}
          className="fb-pin-card"
          style={{
            top: cardAt?.top ?? -9999,
            left: cardAt?.left ?? -9999,
            visibility: cardAt ? "visible" : "hidden",
          }}
        >
          <div className="fb-pin-meta">
            <span>{new Date(entry.ts).toLocaleTimeString()}</span>
            {entry.anchor.source && <code>{entry.anchor.source}</code>}
          </div>
          <p>{entry.comment}</p>
        </div>
      )}
    </>
  );
}
