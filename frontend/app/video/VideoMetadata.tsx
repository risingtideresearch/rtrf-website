import { formatDate } from "../utils";
import styles from "./../stories/article.module.scss";
import RelatedStories from "../drawings/RelatedStories";

export default function VideoMetadata({ asset, stories }) {
  const tags: string[] = asset.tags ?? [];
  const isNoGallery = tags.includes("no-gallery");
  const system = asset.usedInArticles?.[0]?.system || asset.taggedSystem || {};
  const otherTags = tags.filter((t) => t !== "no-gallery" && t !== system.slug);

  return (
    <div className={`${styles.metadata}`}>
      <dl className={styles.metadata__table}>
        <dt>Name</dt>
        <dd>{asset.title || asset.originalFilename}</dd>

        {asset.date ? (
          <>
            <dt>Date</dt>
            <dd>{formatDate(asset.date)}</dd>
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
        {otherTags.length > 0 && (
          <>
            <dt>Tags</dt>
            <dd>{otherTags.join(", ")}</dd>
          </>
        )}
        <RelatedStories stories={stories} />
      </dl>
    </div>
  );
}
