import type { Media } from "../content/chapters";

const KIND_LABEL: Record<Media["kind"], string> = {
  photo: "Photo",
  clip: "Short clip",
  diagram: "Diagram",
};

/**
 * A media placeholder that says what belongs in it.
 *
 * Real assets aren't wired up yet, and an empty grey box tells you nothing
 * during layout review. This renders the slot name so it stays obvious which
 * shots still need finding, shooting, or transcoding.
 */
export function MediaSlot({ media }: { media: Media }) {
  return (
    <figure className="media" data-fb={`media-${media.slot}`}>
      <div className="media-frame">
        <span className="media-kind">{KIND_LABEL[media.kind]}</span>
        <code className="media-slot">{media.slot}</code>
      </div>
      <figcaption>{media.caption}</figcaption>
    </figure>
  );
}
