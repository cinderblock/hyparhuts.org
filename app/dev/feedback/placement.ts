import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { type Anchor, resolveAnchor } from "./anchor";

export type Rect = { top: number; left: number; width: number; height: number };

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Where to put a floating card so it is always fully on screen.
 *
 * Below the anchor by preference, above it if that doesn't fit, and clamped
 * into the viewport otherwise — which is the case that matters, because
 * anchoring to a full-height `<section>` puts "below" thousands of pixels
 * down the page.
 */
export function place(
  anchor: Rect | null,
  card: { width: number; height: number },
): Rect {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (v: number, max: number) =>
    Math.min(Math.max(v, pad), Math.max(pad, max));

  if (!anchor) {
    return {
      top: vh - card.height - 72,
      left: vw - card.width - pad,
      width: card.width,
      height: card.height,
    };
  }

  const left = clamp(anchor.left, vw - card.width - pad);
  const below = anchor.top + anchor.height + 10;
  const above = anchor.top - card.height - 10;

  let top: number;
  if (below + card.height <= vh - pad) top = below;
  else if (above >= pad) top = above;
  else top = clamp(anchor.top, vh - card.height - pad);

  return {
    top: clamp(top, vh - card.height - pad),
    left,
    width: card.width,
    height: card.height,
  };
}

/**
 * Track an anchor's on-screen rect, re-resolving it every frame.
 *
 * Polls rather than listening for events on purpose: HMR rewrites the DOM
 * without firing scroll, resize, or anything else we could subscribe to, and
 * the whole point is that the overlay survives Claude editing the page.
 */
export function useAnchorRect(anchor: Anchor | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const current = useRef<Rect | null>(null);

  useLayoutEffect(() => {
    if (!anchor) {
      current.current = null;
      setRect(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      const el = resolveAnchor(anchor);
      const next = el ? rectOf(el) : null;
      if (!sameRect(current.current, next)) {
        current.current = next;
        setRect(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  return rect;
}

/** Keep a floating card placed against an anchor as both move. */
export function useFloating(
  ref: RefObject<HTMLElement | null>,
  anchor: Rect | null,
  active: boolean,
): Rect | null {
  const [placed, setPlaced] = useState<Rect | null>(null);
  const current = useRef<Rect | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      current.current = null;
      setPlaced(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const next = place(anchor, {
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
        if (!sameRect(current.current, next)) {
          current.current = next;
          setPlaced(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref, anchor, active]);

  return placed;
}
