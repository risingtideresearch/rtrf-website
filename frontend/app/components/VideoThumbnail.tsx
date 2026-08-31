import { MdPlayArrow } from "react-icons/md";
import styles from "./video-thumbnail.module.scss";

interface VideoThumbnailProps {
  url: string;
  mimeType?: string;
  title?: string;
  startTime?: number | null;
}

/**
 * Square, non-interactive first-frame preview of a video for gallery grids.
 * The `#t=` fragment makes browsers seek to (and paint) the trimmed start
 * instead of a possibly-black frame zero.
 */
export function VideoThumbnail({ url, mimeType, title, startTime }: VideoThumbnailProps) {
  const t = startTime && startTime > 0 ? startTime : 0.1;

  return (
    <span className={styles.thumbnail} title={title}>
      <video
        src={`${url}#t=${t}`}
        preload="metadata"
        muted
        playsInline
        tabIndex={-1}
        aria-hidden="true"
      >
        <source src={url} type={mimeType || undefined} />
      </video>
      <span className={styles.badge} aria-hidden="true">
        <MdPlayArrow size={22} />
      </span>
    </span>
  );
}
