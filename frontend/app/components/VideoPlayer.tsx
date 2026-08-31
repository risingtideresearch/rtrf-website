"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiaCompressSolid,
  LiaExpandSolid,
  LiaPauseSolid,
  LiaPlaySolid,
  LiaVolumeOffSolid,
  LiaVolumeUpSolid,
} from "react-icons/lia";
import styles from "./video-player.module.scss";

export interface VideoAsset {
  _id: string;
  url: string;
  mimeType?: string;
  title?: string;
  altText?: string;
  description?: string;
  originalFilename?: string;
  startTime?: number | null;
  endTime?: number | null;
}

interface VideoPlayerProps {
  asset: VideoAsset;
  className?: string;
  autoPlay?: boolean;
  preload?: "none" | "metadata" | "auto";
}

const IDLE_MS = 2500;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  asset,
  className,
  autoPlay = false,
  preload = "metadata",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [aspectRatio, setAspectRatio] = useState("16 / 9");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(autoPlay);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);

  const start = asset.startTime ?? 0;
  const end = asset.endTime ?? null;
  const hasTrim = start > 0 || end != null;

  // Media fragment lets the browser seek to the trim range before any script runs.
  const src = hasTrim
    ? `${asset.url}#t=${start}${end != null ? `,${end}` : ""}`
    : asset.url;

  // Scrubber works in trimmed-clip time, so 0 is always the visible start.
  const clipEnd = end != null ? end : duration;
  const clipDuration = Math.max(0, clipEnd - start);
  const clipTime = Math.min(Math.max(currentTime - start, 0), clipDuration);
  const progress = clipDuration > 0 ? (clipTime / clipDuration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
      }
      if (Number.isFinite(video.duration)) setDuration(video.duration);
      if (start > 0 && video.currentTime < start) {
        video.currentTime = start;
      }
      setCurrentTime(video.currentTime);
    };

    const onTimeUpdate = () => {
      if (end != null && video.currentTime >= end) {
        video.pause();
        video.currentTime = start;
      }
      setCurrentTime(video.currentTime);
    };

    const onSeeking = () => {
      if (video.currentTime < start) video.currentTime = start;
      if (end != null && video.currentTime > end) video.currentTime = end;
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolumeChange = () => setMuted(video.muted);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("durationchange", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    if (video.readyState >= 1) onLoadedMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("durationchange", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [start, end, src]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Controls fade out once playback has run undisturbed for a moment.
  useEffect(() => {
    if (!playing) {
      setIdle(false);
      return;
    }
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(idleTimer.current);
  }, [playing, idle]);

  const wake = useCallback(() => setIdle(false), []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (container?.requestFullscreen) {
      container.requestFullscreen();
    } else if (video?.webkitEnterFullscreen) {
      // iPhone Safari only allows the video element itself to go fullscreen.
      video.webkitEnterFullscreen();
    }
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      const max = end != null ? end : video.duration || 0;
      video.currentTime = Math.min(Math.max(video.currentTime + delta, start), max);
    },
    [start, end],
  );

  const onScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start + Number(event.target.value);
    setCurrentTime(video.currentTime);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Let the scrubber and buttons handle their own keys.
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "BUTTON") return;
    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        event.preventDefault();
        seekBy(-5);
        break;
      case "ArrowRight":
        event.preventDefault();
        seekBy(5);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        toggleFullscreen();
        break;
      default:
        return;
    }
    wake();
  };

  const label =
    asset.altText || asset.description || asset.title || asset.originalFilename;

  const controlsVisible = !playing || !idle;

  return (
    <div
      ref={containerRef}
      className={[
        styles.player,
        playing && idle ? styles["player--idle"] : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={fullscreen ? undefined : { aspectRatio }}
      onPointerMove={wake}
      onPointerLeave={() => playing && setIdle(true)}
      onKeyDown={onKeyDown}
      role="group"
      aria-label={label ? `Video: ${label}` : "Video"}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        playsInline
        preload={preload}
        autoPlay={autoPlay}
        muted={true}
        aria-label={label}
        onClick={togglePlay}
      >
        <source src={src} type={asset.mimeType || undefined} />
        Your browser does not support embedded video.{" "}
        <a href={asset.url}>Download the video</a>.
      </video>

      {!playing && (
        <button
          type="button"
          className={styles["big-play"]}
          onClick={togglePlay}
          aria-label="Play"
        >
          <LiaPlaySolid size={20} />
        </button>
      )}

      <div
        className={`${styles.controls} ${controlsVisible ? styles["controls--visible"] : ""}`}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <LiaPauseSolid size={18} /> : <LiaPlaySolid size={18} />}
        </button>

        <span className={styles.time}>{formatTime(clipTime)}</span>

        <input
          type="range"
          className={styles.scrub}
          min={0}
          max={clipDuration || 0}
          step="any"
          value={clipTime}
          onChange={onScrub}
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
          aria-label="Seek"
          aria-valuetext={`${formatTime(clipTime)} of ${formatTime(clipDuration)}`}
        />

        <span className={styles.time}>{formatTime(clipDuration)}</span>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <LiaVolumeOffSolid size={18} />
          ) : (
            <LiaVolumeUpSolid size={18} />
          )}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? (
            <LiaCompressSolid size={18} />
          ) : (
            <LiaExpandSolid size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
