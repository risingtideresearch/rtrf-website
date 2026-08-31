"use client";

import { useRef, useState } from "react";
import { LiaPauseSolid, LiaPlaySolid } from "react-icons/lia";
import styles from "./video-thumbnail.module.scss";

interface VideoThumbnailProps {
  url: string;
  mimeType?: string;
  title?: string;
  startTime?: number | null;
}

export function VideoThumbnail({ url, mimeType, title, startTime }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const start = startTime && startTime > 0 ? startTime : 0.1;

  const togglePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  return (
    <span className={styles.thumbnail} title={title}>
      <video
        ref={videoRef}
        src={`${url}#t=${start}`}
        preload="metadata"
        muted
        playsInline
        tabIndex={-1}
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          const video = videoRef.current;
          if (video) video.currentTime = start;
        }}
      >
        <source src={url} type={mimeType || undefined} />
      </video>
      <button
        type="button"
        className={styles.badge}
        onClick={togglePlay}
        aria-label={`${playing ? "Pause" : "Play"}${title ? ` ${title}` : " video"}`}
      >
        {playing ? <LiaPauseSolid size={14} /> : <LiaPlaySolid size={14} />}
      </button>
    </span>
  );
}
