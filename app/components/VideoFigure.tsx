export type VideoFigureProps = {
  /** Basename under /media — expects .av1.mp4, .h264.mp4 and -poster.jpg. */
  name: string;
  caption: string;
  /** Shown after the caption, e.g. "0:46 · silent". */
  meta?: string;
};

/**
 * A click-to-play video.
 *
 * `preload="none"` with a poster, deliberately: these clips run a few MB and
 * nobody should pay for one on a phone before choosing to watch it. That also
 * means no autoplay, which sidesteps having to special-case
 * `prefers-reduced-motion` — a timelapse is nothing but motion.
 *
 * The footage is silent, so there is no audio track to caption.
 *
 * In development these come from `public/media/`; in production the Worker
 * serves the same paths out of R2. Nothing here needs to know which.
 */
export function VideoFigure({ name, caption, meta }: VideoFigureProps) {
  return (
    <figure className="video" data-fb={`video-${name}`}>
      <video
        className="video-player"
        controls
        preload="none"
        playsInline
        poster={`/media/${name}-poster.jpg`}
      >
        {/* AV1 carries a precise codecs string so a browser that can't decode
            it skips to the next source. The H.264 fallback deliberately does
            not, so it is always considered playable. */}
        <source
          src={`/media/${name}.av1.mp4`}
          type='video/mp4; codecs="av01.0.05M.08"'
        />
        <source src={`/media/${name}.h264.mp4`} type="video/mp4" />
        Your browser can't play this video.{" "}
        <a href={`/media/${name}.h264.mp4`}>Download it instead</a>.
      </video>
      <figcaption>
        {caption}
        {meta && <span className="video-meta">{meta}</span>}
      </figcaption>
    </figure>
  );
}
