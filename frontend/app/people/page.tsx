import type { Metadata } from "next";
import {
  fetchArticleIdMap,
  fetchPeople,
  fetchPeoplePage,
  fetchSystems,
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
  const [people, peoplePage, articleIdMap, systems] = await Promise.all([
    fetchPeople(),
    fetchPeoplePage(),
    fetchArticleIdMap(),
    fetchSystems(),
  ]);
  const drawings = getDrawingsManifest();

  // system slug -> label and 1-based number, matching the drawings TOC
  const systemsBySlug = new Map<string, { name: string; index: number }>(
    (systems.data?.systems ?? []).map((system: any, i: number) => [
      system.slug,
      { name: system.name, index: i + 1 },
    ]),
  );

  /** A person's drawings, broken out by the system they belong to. */
  const getDrawingSystems = (slug?: string) => {
    if (!slug) return [];

    const counts = new Map<string, number>();
    drawings.files.forEach((file) => {
      if (file.author?.slug !== slug || !file.group) return;
      const systemSlug = getSlugFromDrawingGroup(file.group.toLowerCase());
      counts.set(systemSlug, (counts.get(systemSlug) ?? 0) + 1);
    });

    return [...counts]
      .map(([systemSlug, count]) => ({
        slug: systemSlug,
        count,
        // rendered in the site's small all-caps treatment, like the drawings TOC
        name: systemsBySlug.get(systemSlug)?.name ?? systemSlug.replace(/-/g, " "),
        index: systemsBySlug.get(systemSlug)?.index ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.index - b.index);
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
          const drawingSystems = getDrawingSystems(person.slug?.current);

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
                {articles.length > 0 && (
                  <div className={styles.group}>
                    <h6 className={styles.group_label}>Stories</h6>
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
                  </div>
                )}
                {drawingSystems.length > 0 && (
                  <div className={`${styles.group} ${styles.drawings}`}>
                    <h6 className={styles.group_label}>Drawings</h6>
                    {drawingSystems.map((system) => (
                      <ArticleRow
                        key={system.slug}
                        href={`${URLS.DRAWINGS}/${system.slug}`}
                        title={system.name}
                        date={String(system.count)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
