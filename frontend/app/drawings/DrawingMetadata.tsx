import styles from "./../stories/article.module.scss";
import { formatDate } from "../utils";
import { LiaDownloadSolid } from "react-icons/lia";
import { getSlugFromDrawingGroup, getDrawingName } from "./util";
import { Drawing } from "./types";
import RelatedStories from "./RelatedStories";
import { Article } from "@/sanity/sanity.types";

export default function DrawingMetadata({
  drawing,
  stories,
}: {
  drawing: Drawing;
  stories?: Array<Article>;
}) {
  return (
    <div className={`${styles.metadata}`}>
      <dl className={styles.metadata__table}>
        <dt>Name</dt>
        <dd className={styles.metadata__filename}>{getDrawingName(drawing)}</dd>
        <dt>ID</dt>
        <dd>{drawing.id}</dd>
        {drawing.date_info ? (
          <>
            <dt>Date</dt>
            <dd>{formatDate(drawing.date_info.date)}</dd>
          </>
        ) : (
          <></>
        )}
        {drawing.author ? (
          <>
            <dt>Author</dt>
            <dd>
              <a href={`/people#${drawing.author.slug}`}>
                {drawing.author?.name}
              </a>
            </dd>
          </>
        ) : (
          <></>
        )}
        <dt>System</dt>
        <dd style={{ textTransform: "uppercase" }}>
          <a
            href={`/drawings/${getSlugFromDrawingGroup(drawing.group).toLowerCase()}`}
          >
            {drawing.group}
          </a>
        </dd>
        <dt>Download</dt>
        <dd>
          <a
            className={styles.metadata__download}
            download
            href={
              "/drawings/" +
              encodeURIComponent(
                drawing.source_pdf_full_path.replace(
                  "../frontend/public/drawings",
                  "",
                ),
              )
            }
          >
            <span>PDF</span>
            <LiaDownloadSolid size={16} />
          </a>
        </dd>
        <RelatedStories stories={stories} />
      </dl>
    </div>
  );
}
