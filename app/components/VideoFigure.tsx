export type VideoFigureProps = {
  /** Basename under /media, without extension — expects .webm, .mp4 and -poster.jpg. */
  name: string;
  caption: string;
  /** Shown over the poster before playback, e.g. "0:46 · silent". */
  meta?: string;
};

/**
 * A click-to-play video.
 *
 * Deliberately `preload="none"` with a poster: these clips run several MB and
 * nobody should pay for one on a phone before choosing to watch it. That also
 * means no autoplay, which sidesteps having to special-case
 * `prefers-reduced-motion` — a timelapse is nothing but motion.
 *
 * The footage is silent, so there is no audio track to caption.
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
        <source src={`/media/${name}.webm`} type="video/webm" />
        <source src={`/media/${name}.mp4`} type="video/mp4" />
        Your browser can't play this video.{" "}
        <a href={`/media/${name}.mp4`}>Download it instead</a>.
      </video>
      <figcaption>
        {caption}
        {meta && <span className="video-meta">{meta}</span>}
      </figcaption>
    </figure>
  );
}
