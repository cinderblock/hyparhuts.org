/**
 * Describing "the thing Cameron clicked" in a way that survives an HMR update.
 *
 * A CSS selector alone is brittle — Claude editing the page is exactly what
 * invalidates `:nth-of-type` paths. So every anchor also carries the element's
 * text, and re-resolution falls back to matching on that text when the
 * selector misses.
 */

export type Anchor = {
  /** Best-effort CSS path from the nearest stable ancestor. */
  selector: string;
  /** Trimmed text of the anchored element — the durable half of the anchor. */
  text: string;
  /** `file.tsx:line:col` when React kept the JSX source. Often null. */
  source: string | null;
  /** The user's text selection, when the comment came from one. */
  selectedText?: string;
};

const UI_ATTR = "data-feedback-ui";

export function isFeedbackUi(el: Element | null): boolean {
  return !!el?.closest(`[${UI_ATTR}]`);
}

function stableId(el: Element): string | null {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const fb = el.getAttribute("data-fb");
  if (fb) return `[data-fb="${CSS.escape(fb)}"]`;
  return null;
}

/** A CSS path, stopping early at any `id` or authored `data-fb` landmark. */
export function selectorFor(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node !== document.body) {
    const stable = stableId(node);
    if (stable) {
      parts.unshift(stable);
      return parts.join(" > ");
    }

    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const sameTag = [...parent.children].filter(
      (c) => c.tagName === node!.tagName,
    );
    parts.unshift(
      sameTag.length > 1
        ? `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})`
        : tag,
    );
    node = parent;
  }

  return ["body", ...parts].join(" > ");
}

/**
 * React keeps JSX source locations on the fiber in dev — but which field
 * depends on the React version, and React 19 dropped some of them. Probe the
 * shapes we know about and shrug if none are there; the text anchor is what
 * actually carries the weight.
 */
export function sourceFor(el: Element): string | null {
  const key = Object.keys(el).find(
    (k) =>
      k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  if (!key) return null;

  type Fiber = {
    _debugSource?: {
      fileName?: string;
      lineNumber?: number;
      columnNumber?: number;
    };
    memoizedProps?: {
      __source?: {
        fileName?: string;
        lineNumber?: number;
        columnNumber?: number;
      };
    };
    return?: Fiber;
  };

  let fiber = (el as unknown as Record<string, Fiber>)[key] as
    | Fiber
    | undefined;
  for (let depth = 0; fiber && depth < 12; depth++, fiber = fiber.return) {
    const src = fiber._debugSource ?? fiber.memoizedProps?.__source;
    if (src?.fileName) {
      const file = src.fileName.split(/[\\/]/).slice(-2).join("/");
      return `${file}:${src.lineNumber ?? 0}:${src.columnNumber ?? 0}`;
    }
  }
  return null;
}

export function textFor(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
}

export function describe(el: Element, selectedText?: string): Anchor {
  return {
    selector: selectorFor(el),
    text: textFor(el),
    source: sourceFor(el),
    ...(selectedText ? { selectedText } : {}),
  };
}

/**
 * Find the element an anchor points at, after the page may have changed under
 * it. Selector first, then text match — an edit that rewords the copy loses
 * the pin, which is correct: that comment is probably addressed.
 */
export function resolveAnchor(anchor: Anchor): Element | null {
  try {
    const bySelector = document.querySelector(anchor.selector);
    if (bySelector && !isFeedbackUi(bySelector)) return bySelector;
  } catch {
    // Selector went invalid across an edit. Fall through to text.
  }

  if (!anchor.text) return null;

  // Deepest element whose text still matches — deepest keeps the pin tight to
  // the phrase rather than snapping out to a wrapping <section>.
  let best: Element | null = null;
  let bestDepth = -1;
  for (const el of document.querySelectorAll("body *")) {
    if (isFeedbackUi(el)) continue;
    if (textFor(el) !== anchor.text) continue;
    let depth = 0;
    for (let p = el.parentElement; p; p = p.parentElement) depth++;
    if (depth > bestDepth) {
      best = el;
      bestDepth = depth;
    }
  }
  return best;
}

/** Walk up from a raw click target to something worth commenting on. */
export function meaningfulTarget(el: Element): Element {
  const SKIP = new Set([
    "SPAN",
    "EM",
    "STRONG",
    "B",
    "I",
    "CODE",
    "SMALL",
    "BR",
  ]);
  let node = el;
  while (
    node.parentElement &&
    SKIP.has(node.tagName) &&
    node.parentElement !== document.body
  ) {
    node = node.parentElement;
  }
  return node;
}
