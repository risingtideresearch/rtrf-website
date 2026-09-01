import type { Metadata } from "next";
import {
  fetchArticleIdMap,
  fetchPeople,
  fetchPeoplePage,
} from "@/sanity/lib/utils";
import { sortPeople, formatDate } from "../utils";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://cdn.sanity.io/images/qjczz6gi/production/5d507d27f9b7a0f0cd351429c559057b92b7c23e-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Solander 38",
      },
    ],
  },
};
import { ArticleRow } from "../components/ArticleRow";
import styles from "./people.module.scss";
import { getDrawingsManifest } from "../manifest-util";
import { getSlugFromDrawingGroup } from "../drawings/util";
import { URLS } from "../components/Navigation/Navigation";
import { Image } from "../components/Image";
import { LiaArrowUpSolid } from "react-icons/lia";

export default async function Page() {
  const [people, peoplePage, articleIdMap] = await Promise.all([
    fetchPeople(),
    fetchPeoplePage(),
    fetchArticleIdMap(),
  ]);
  const drawings = getDrawingsManifest();

  const getDrawings = (slug: string) =>
    drawings.files.filter((file) => file.author?.slug === slug);

  const getDrawingsHref = (files: typeof drawings.files) => {
    const group = files[0]?.group?.toLowerCase();
    return group
      ? `${URLS.DRAWINGS}/${getSlugFromDrawingGroup(group)}`
      : URLS.DRAWINGS;
  };

  const sorted = sortPeople(people.data);

  return (
    <>
      <div className={styles.header}>
        <h1>People</h1>
        <h2>{peoplePage.data?.description}</h2>
      </div>
      <div className={styles.list}>
        {sorted.map((person: any, index: number) => {
          const authored: any[] = person.articlesAsAuthor;
          const mentioned: any[] = person.articlesMentioned;
          const personDrawings = getDrawings(person.slug?.current);

          const sortedArticles = (list: any[]) =>
            [...list].sort((a, b) =>
              articleIdMap[a._id]?.localeCompare(articleIdMap[b._id]),
            );

          const articles = [
            ...sortedArticles(authored),
            ...sortedArticles(mentioned),
          ];

          return (
            <section
              key={person._id}
              id={person.slug?.current}
              className={styles.person}
            >
              <div
                className={`${styles.photo} ${person.image ? "" : styles.no_photo}`}
              >
                {person.image ? (
                  <Image
                    src={person.image}
                    alt={person.name}
                    square={true}
                    width={240}
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                ) : (
                  <div></div>
                )}
              </div>
              <div className={styles.info}>
                <p>
                  <strong>{person.name}</strong>
                </p>
                {person.role && <p>{person.role}</p>}
                {person.affiliations?.length > 0 && (
                  <div className={styles.affiliations}>
                    {person.affiliations.map((item: any) =>
                      item.url ? (
                        <p key={item.url}>
                          <a href={item.url} target="_blank" className="icon-link external-link">
                            {item.label ||
                              item.url
                                .replace("https://", "")
                                .replace(/\/$/, "")}
                            <LiaArrowUpSolid
                              size={16}
                            />
                          </a>
                        </p>
                      ) : (
                        <p key={item.label}>{item.label}</p>
                      ),
                    )}
                  </div>
                )}
              </div>
              <div className={styles.contributions}>
                {articles.map((article: any) => (
                  <ArticleRow
                    key={article._id}
                    articleId={articleIdMap[article._id]}
                    href={`/stories/${article.slug}`}
                    title={article.title}
                    date={formatDate(
                      article.effectiveDate ?? article._updatedAt,
                    )}
                    compact
                  />
                ))}
                {personDrawings.length > 0 && (
                  <ArticleRow
                    articleId={" "}
                    href={getDrawingsHref(personDrawings)}
                    title="Drawings"
                    date={String(personDrawings.length)}
                    compact
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
