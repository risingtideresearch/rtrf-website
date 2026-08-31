import MobileNavigation from "./MobileNavigation";
import styles from "./navigation.module.scss";

export enum URLS {
  HOME = "/",
  STORIES = "/stories",
  ANATOMY = "/anatomy",
  DRAWINGS = "/drawings",
  PHOTOS = "/photos",
  VIDEO = "/videos",
  PEOPLE = "/people",
}
export const nav = [
  {
    url: URLS.HOME,
    label: "Solander 38",
  },
  {
    url: URLS.STORIES,
    label: "Stories",
  },
  {
    url: URLS.ANATOMY,
    label: "Anatomy",
  },
  {
    url: URLS.DRAWINGS,
    label: "Drawings",
    nav2d: true,
  },
  {
    url: URLS.PHOTOS,
    label: "Photography",
    nav2d: true,
  },
  {
    url: URLS.PEOPLE,
    label: "People",
  },
];

interface NavigationProps {
  type?: "top-bar";
  active?: URLS;
  system?: string | null;
  story?: string | null;
}

export default function Navigation({
  type,
  active,
  system,
  story,
}: NavigationProps) {
  const getURL = (link) => {
    const url = link.url;

    if (link.nav2dStory && story && active != url) {
      return url + `/${story}`;
    }
    if (link.nav2d && system) {
      return url + `/${system}`;
    }
    return url;
  };

  const links = (
    <>
      {nav.map((link, i) => (
        <a key={link.label} href={getURL(link)} aria-current={active === link.url ? "page" : undefined} style={i == 0 ? {display: 'grid', gap: '0.625rem', gridTemplateColumns: '0.5rem 1fr'} : {}}>
          {i == 0 ? (
            <svg
              className={styles.logo}
              width="59"
              height="78"
              viewBox="0 0 59 78"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
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
          ) : (
            <></>
          )}
          <span aria-hidden="true" style={{ fontWeight: 600 }}>
            {link.label}
          </span>
          <span
            style={{
              fontWeight: active == link.url ? 600 : undefined,
            }}
          >
            {link.label}
          </span>
        </a>
      ))}
    </>
  );
  return (
    <>
      <nav className={`${styles.nav} pane ${type ? styles[type] : ""}`}>
        <span>{links}</span>
      </nav>

      <MobileNavigation active={nav.find((link) => link.url == active)?.label}>
        {links}
      </MobileNavigation>
    </>
  );
}
