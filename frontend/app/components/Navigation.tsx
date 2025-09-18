import Link from "next/link";

import styles from "./navigation.module.scss";

export default async function Navigation() {
  return (
    <nav className={styles.nav}>
      <Link href={"/"}>Home</Link>
      <Link href={"/anatomy"}>Anatomy</Link>
      <Link href={"/parts"}>Parts</Link>
      <Link href={"/articles"}>Articles</Link>
    </nav>
  );
}
