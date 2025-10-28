import Link from "next/link";
import styles from "./page.module.scss";
import { fetchSections } from "@/sanity/lib/utils";

export default async function Articles({ }) {
  const { data } = await fetchSections();

  return (
    <main className={styles.page}>
      {(data.sections || []).map((section, i) => (
        <section key={section._key} className={styles.page__toc}>
          <h6>
            <span>{i + 1}.</span>
            <span>{section.name}</span>
          </h6>
          <ol>
            {(section.articles || []).map((article) => (
              <div key={article._id}>
                <a href={`/article/${article.slug}`}>
                  <h2 style={{margin: '0.5rem 0'}}>{article.title}</h2>
                </a>
              </div>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
