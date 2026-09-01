import styles from "./articles.module.scss";
import { fetchSystems } from "@/sanity/lib/utils";
import { formatDate, toISODate } from "../utils";
import { ArticleRow } from "../components/ArticleRow";
import RangeChart from "../components/RangeChart/RangeChart";
import Image from "next/image";
import { getStoryStill } from "../manifest-util";

export default async function Articles({ subtitles, description }) {
  const { data } = await fetchSystems();

  return (
    <div className={styles.articles}>
      <div className={styles.header}>
        <h1>Stories</h1>
        <h2>{description}</h2>
      </div>
      <main>
        {(data.systems || []).map((system, i) => (
          <section className="section--two-col" key={system._key}>
            <div></div>
            <div>
              <h6 className={styles["section-title"]}>
                <span>{i + 1}</span>
                <span>{system.name}</span>
              </h6>
              <ol>
                {(system.articles || []).map((article) => (
                  <li key={article._id}>
                    <div className={styles["article-preview"]}>
                      {article.slug == "range" ? (
                        <RangeChart title={""} />
                      ) : (
                        <Image
                          {...getStoryStill(article.slug, "thumbs")}
                          alt={`Preview of ${article.title}`}
                        />
                      )}
                    </div>
                    <ArticleRow
                      articleId={article.articleId}
                      href={`/stories/${article.slug}`}
                      title={article.title}
                      date={<time dateTime={toISODate(article.effectiveDate ?? article._updatedAt)}>{formatDate(article.effectiveDate ?? article._updatedAt)}</time>}
                      isLive={article.isLive}
                      subtitle={article.subtitle}
                      showSubtitle={subtitles}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
