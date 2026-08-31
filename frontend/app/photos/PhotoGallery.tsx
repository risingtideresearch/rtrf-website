import Gallery from "../components/Gallery";
import { Image } from "../components/Image";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { formatMonthYear } from "../utils";
import { getVideoURL } from "../video/util";

interface Photo {
  _id: string;
  _type?: string;
  url: string;
  mimeType?: string;
  title?: string;
  originalFilename?: string;
  photoDate?: string;
  startTime?: number | null;
  metadata?: { dimensions?: { width: number; height: number } };
  [key: string]: unknown;
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  return (
    <Gallery emptyMessage="No photos">
      {photos.map((photo) => {
        const isVideo = photo._type === "sanity.fileAsset";
        const url = photo._id.split("-");
        const monthYear = formatMonthYear(photo.photoDate);
        const basename = photo.originalFilename?.replace(/\.[^/.]+$/, '') ?? '';
        const displayTitle = photo.title && photo.title !== basename ? photo.title : null;
        return (
          <div key={photo._id}>
            <a href={isVideo ? getVideoURL(photo) : `/photos/image/${url[1]}`}>
              {isVideo ? (
                <VideoThumbnail
                  url={photo.url}
                  mimeType={photo.mimeType}
                  title={photo.title}
                  startTime={photo.startTime}
                />
              ) : (
                <Image src={{ asset: photo }} square={true} alt={photo.title} />
              )}
              <p
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.2,
                }}
              >
                {displayTitle}
                {monthYear && <span>{displayTitle ? ', ' : ''}{monthYear}</span>}
              </p>
            </a>
          </div>
        );
      })}
    </Gallery>
  );
}
