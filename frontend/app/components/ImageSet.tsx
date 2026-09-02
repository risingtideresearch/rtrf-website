import galleryStyles from "./../components/gallery.module.scss";
import { DrawingCard } from "../drawings/DrawingCard";
import { Image } from "../components/Image";
import { Drawing } from "../drawings/types";
import styles from "./image-set.module.scss";
import { getPhotoURL } from "../photos/util";

interface SanityImageAsset {
  _type: "image";
  _key: string;
  altText?: string;
  title?: string;
  asset: {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: { width: number; height: number };
    };
  };
}

type ImageSetAsset = SanityImageAsset | Drawing;

function isSanityImage(asset: ImageSetAsset): asset is SanityImageAsset {
  return (asset as SanityImageAsset)._type === "image";
}

interface ImageSetProps {
  assets: ImageSetAsset[];
  title?: string;
}

export default function ImageSet({ assets, title }: ImageSetProps) {
  const aspectRatio = (asset: SanityImageAsset) =>
    (asset.asset.metadata?.dimensions?.height ?? 1) /
    (asset.asset.metadata?.dimensions?.width ?? 1);

  return (
    <div className={`${styles["image-set"]}`}>
      {title && <h4>{title}</h4>}
      <div
        className={`${galleryStyles.gallery} ${galleryStyles.gallery__page} ${assets.length == 1 ? styles.single : ""}`}
      >
        {assets.map((asset, index) =>
          isSanityImage(asset) ? (
            <div
              key={asset._key}
              style={
                index == assets.length - 1 &&
                assets.length % 2 == 1 &&
                aspectRatio(asset) < 0.8
                  ? { gridColumn: "span 2" }
                  : {}
              }
              className={`${styles.photo} ${
                aspectRatio(asset) > 1.1 ? " image-set--portrait" : ""
              }`}
            >
              <a href={getPhotoURL(asset.asset)}>
                <Image
                  src={asset}
                  alt={asset.altText || asset.title}
                  style={{ maxWidth: asset.asset.metadata?.dimensions?.width }}
                />
              </a>
            </div>
          ) : (
            <div
              key={asset.id}
              className={
                asset.height / asset.width > 1.1 ? " image-set--portrait" : ""
              }
            >
              <DrawingCard drawing={asset} autoScale={true} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
