import Link from "next/link";
import styles from "./page.module.scss";

export default async function Articles({ data }) {
  return (
    <main className={styles.page}>
      {data.map((section, i) => (
        <section key={section._key} className={styles.page__toc}>
          <h6>
            <span>{i + 1}.</span>
            <span>{section.name}</span>
          </h6>
          <ol>
            {(section.articles || []).map((article) => (
              <div key={article._id}>
                <Link href={`/article/${article.slug}`}>
                  <h2>{article.title}</h2>
                </Link>
              </div>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
