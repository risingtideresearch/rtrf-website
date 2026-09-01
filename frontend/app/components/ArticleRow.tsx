import styles from "./article-row.module.scss";

interface ArticleRowProps {
  articleId?: string;
  href: string;
  title: string;
  date?: React.ReactNode;
  isLive?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  compact?: boolean;
}

export function ArticleRow({
  articleId,
  href,
  title,
  date,
  isLive = true,
  subtitle,
  showSubtitle,
  compact,
}: ArticleRowProps) {
  return (
    <>
      <div
        className={`${styles["article-header"]}${compact ? ` ${styles["article-header--compact"]}` : ""}`}
      >
        <h6>{articleId || null}</h6>
        <a className={styles["article-title"]}  href={href}>
          <p>
            <span>{title}</span>
          </p>
          <div></div>
          <h6>
            {isLive ? (
              date
            ) : (
              <span className={styles["in-progress"]}>in progress</span>
            )}
          </h6>
        </a>
      </div>
      {showSubtitle && isLive && (
        <div className={styles["article-subtitle"]}>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      )}
    </>
  );
}
