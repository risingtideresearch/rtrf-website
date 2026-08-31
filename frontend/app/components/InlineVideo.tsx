import { VideoAsset, VideoPlayer } from "./VideoPlayer";
import { getVideoURL } from "../video/util";
import { formatMonthYear } from "../utils";

interface InlineVideoProps {
  video: {
    asset: VideoAsset & { date?: string | null };
  };
  caption?: string;
  className?: string;
}

/**
 * A video embedded in a story. The caption links through to the video's own
 * page, mirroring how inline photos link to /photos/image/[id].
 */
export function InlineVideo({ video, caption, className }: InlineVideoProps) {
  const asset = video?.asset;
  if (!asset?.url) return null;

  const monthYear = formatMonthYear(asset.date);
  const showDefaultCaption = !caption && (asset.title || monthYear);

  return (
    <figure className={className}>
      <VideoPlayer asset={asset} defaultMuted />
      {(caption || showDefaultCaption) && (
        <figcaption>
          <a href={getVideoURL(asset)}>
            {caption ? (
              caption
            ) : (
              <>
                {asset.title}
                {monthYear && <span>, {monthYear}</span>}
              </>
            )}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
