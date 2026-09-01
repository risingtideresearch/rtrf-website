import { LiaArrowLeftSolid, LiaArrowRightSolid } from "react-icons/lia";
import styles from "./subnav.module.scss";

export default function SubNav({ next, prev, urlPrefix, idKey = "uuid", noBorderBottom = false, showTitles = true }) {
  // Neighbours that already know their own route (photo/video gallery, which
  // mixes both types) pass an href; everything else is prefix + id.
  const hrefFor = (item) => item.href ?? `${urlPrefix}/${item[idKey]}`;
  const labelFor = (item, fallback) => (showTitles && item.title) || fallback;

  return (
    <div className={`${styles["sub-nav"]} ${!noBorderBottom && styles["border-bottom"]}`}>
      <div className={styles["sub-nav__container"]}>
        {prev && (
          <div>
            <a href={hrefFor(prev)}>
              <LiaArrowLeftSolid size={18} />
              <span className={styles.label}>
                <span>{labelFor(prev, "prev")}</span>
                <span>{labelFor(prev, "prev")}</span>
              </span>
            </a>
          </div>
        )}
        {next && (
          <div>
            <a href={hrefFor(next)}>
              <span className={styles.label}>
                <span>{labelFor(next, "next")}</span>
                <span>{labelFor(next, "next")}</span>
              </span>
              <LiaArrowRightSolid size={18} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
