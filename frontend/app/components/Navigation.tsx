import Link from "next/link";

import styles from "./navigation.module.scss";

export default async function Navigation({ forceNav = false }) {
  return (
    <nav className={`${styles.nav} pane`}>
      <svg
        width="59"
        height="78"
        viewBox="0 0 59 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.9 77.6C20 68.8 24.8 54.9 26.7 49.5H0L7.7 40.7C18.5 37.7 23.4 39.9 28.3 42C32.8 44 37.2 45.9 44.5 45.3L16.9 77.6Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M42.4 0C39.3 8.8 34.5 22.7 32.6 28.1H58.9L51.7 36.8C40.8 39.9 36 37.8 31.1 35.7C26.7 33.8 22.2 31.8 15 32.4L42.4 0Z"
          fill="black"
        />
      </svg>

      {forceNav ? (
        <>
          <a href={"/"}>Solander 38</a>
          <a href={"/articles"}>Articles</a>
          <a href={"/anatomy"}>Anatomy</a>
          <a href={"/drawings"}>Drawings</a>
          <a href={"/photos"}>Photos</a>
          <a href={"/materials"}>Materials</a>
          <a href={"/people"}>People</a>
        </>
      ) : (
        <>
          <Link href={"/"}>Solander 38</Link>
          <Link href={"/articles"}>Articles</Link>
          <Link href={"/anatomy"}>Anatomy</Link>
          <Link href={"/drawings"}>Drawings</Link>
          <Link href={"/photos"}>Photos</Link>
          <Link href={"/materials"}>Materials</Link>
          <Link href={"/people"}>People</Link>
        </>
      )}
    </nav>
  );
}
