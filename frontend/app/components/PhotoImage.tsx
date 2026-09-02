import { Image } from "./Image";
import { getPhotoURL } from "../photos/util";
import { formatMonthYear } from "../utils";

interface PhotoImageProps {
  image: {
    _type?: string;
    asset: {
      _id: string;
      url: string;
      title?: string;
      altText?: string;
      date?: string;
      metadata?: {
        dimensions?: { width: number; height: number };
        exif?: { DateTimeOriginal?: string };
      };
    };
    crop?: { top: number; bottom: number; left: number; right: number } | null;
    hotspot?: { x: number; y: number; width: number; height: number } | null;
    alt?: string;
  };
  altText?: string;
  width?: number;
  height?: number;
  className?: string;
  photoDate?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
}

export function PhotoImage({
  image,
  altText,
  width,
  height,
  className,
  photoDate,
  loading,
  priority,
}: PhotoImageProps) {
  const resolvedLoading = priority ? "eager" : loading;
  const dims = image.asset.metadata?.dimensions;
  const crop = image.crop;
  const aspectWidth = dims
    ? dims.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0))
    : undefined;
  const aspectHeight = dims
    ? dims.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0))
    : undefined;
  const effectiveDate = photoDate ?? image.asset.date ?? image.asset.metadata?.exif?.DateTimeOriginal;
  const monthYear = formatMonthYear(effectiveDate);

  return (
    <a href={getPhotoURL(image.asset)} className={className}>
      <div
        style={
          !width && !height && aspectWidth && aspectHeight
            ? { aspectRatio: `${aspectWidth} / ${aspectHeight}`, maxWidth: aspectWidth, }
            : {maxWidth: aspectWidth}
        }
      >
        <Image
          src={image}
          alt={altText || image.asset.altText || image.alt || ""}
          width={width}
          height={height}
          style={{ margin: '0 auto'}}
          loading={resolvedLoading}
        />
      </div>
      {(image.asset.title || monthYear) && (
        <figcaption>
          {image.asset.title}
          {monthYear && <span>, {monthYear}</span>}
        </figcaption>
      )}
    </a>
  );
}
