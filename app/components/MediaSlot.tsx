import type { Media } from "../content/chapters";

const KIND_LABEL: Record<Media["kind"], string> = {
  photo: "Photo",
  clip: "Short clip",
  diagram: "Diagram",
};

/**
 * A media position in a chapter.
 *
 * With a real asset it renders the image; without one it renders a
 * placeholder naming the slot, so it stays obvious during review which shots
 * still need finding, shooting or rendering. An empty grey box tells you
 * nothing.
 */
export function MediaSlot({ media }: { media: Media }) {
  return (
    <figure className="media" data-fb={`media-${media.slot}`}>
      {media.asset ? (
        <picture>
          <source
            srcSet={`/media/${media.asset.name}.webp`}
            type="image/webp"
          />
          <img
            className={`media-image media-image-${media.kind}`}
            src={`/media/${media.asset.name}.png`}
            alt={media.caption}
            width={media.asset.width}
            height={media.asset.height}
            loading="lazy"
            decoding="async"
          />
        </picture>
      ) : (
        <div className="media-frame">
          <span className="media-kind">{KIND_LABEL[media.kind]}</span>
          <code className="media-slot">{media.slot}</code>
        </div>
      )}
      <figcaption>{media.caption}</figcaption>
    </figure>
  );
}
