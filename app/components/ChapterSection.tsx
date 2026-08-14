import type { Chapter } from "../content/chapters";
import { MediaSlot } from "./MediaSlot";

/**
 * One of the seven ideas.
 *
 * Media sticks to the viewport while the prose scrolls past it on wide
 * screens; on narrow screens the two just stack in reading order.
 */
export function ChapterSection({ chapter }: { chapter: Chapter }) {
  return (
    <section
      className="chapter"
      id={chapter.id}
      data-fb={`chapter-${chapter.id}`}
      // Which side the media sits on. Driven by the chapter's own number
      // rather than `:nth-of-type`, which would also count the premise, tarp
      // and build sections and invert the whole alternation.
      data-media-side={chapter.n % 2 === 1 ? "right" : "left"}
    >
      <div className="chapter-media">
        <MediaSlot media={chapter.media} />
      </div>

      <div className="chapter-text">
        <p className="chapter-number">{String(chapter.n).padStart(2, "0")}</p>
        <h2>{chapter.title}</h2>
        <p className="chapter-hook">{chapter.hook}</p>
        {chapter.body.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
        <p className="chapter-standalone">
          <span className="chapter-standalone-label">On its own</span>
          {chapter.standalone}
        </p>
      </div>
    </section>
  );
}
