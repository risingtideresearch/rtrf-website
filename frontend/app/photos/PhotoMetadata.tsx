import { formatDate } from "../utils";
import styles from "./../stories/article.module.scss";
import RelatedStories from "../drawings/RelatedStories";

export default function PhotoMetadata({ asset, stories }) {
  const isNoGallery = asset.tags?.includes("no-gallery");
  const systemTag = asset.tags?.find((t) => t !== "no-gallery") ?? null;
  const system = asset.usedInArticles[0]?.system || asset.taggedSystem || {};
  return (
    <div className={`${styles.metadata}`}>
      <dl className={styles.metadata__table}>
        <dt>Title</dt>
        <dd>{asset.title || asset.originalFilename}</dd>

        {asset.metadata.date ? (
          <>
            <dt>Date</dt>
            <dd>{formatDate(asset.metadata.date)}</dd>
          </>
        ) : (
          <></>
        )}
        {!isNoGallery && system.name && (
          <>
            <dt>System</dt>
            <dd style={{ textTransform: "uppercase" }}>
              <a href={`/photos/${system.slug}`}>{system.name}</a>
            </dd>
          </>
        )}
        {asset.description ? (
          <>
            <dt>Desc</dt>
            <dd>{asset.description}</dd>
          </>
        ) : (
          <></>
        )}
        <RelatedStories stories={stories} />
      </dl>
    </div>
  );
}
