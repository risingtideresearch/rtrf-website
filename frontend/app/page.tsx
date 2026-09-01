import type { Metadata } from "next";
import Footer from "./components/Footer";
import Navigation, { URLS } from "./components/Navigation/Navigation";
import styles from "./home.module.scss";
import { ArticleRow } from "./components/ArticleRow";
import {
  fetchArticleIdMap,
  fetchFirstArticle,
  fetchHomepage,
  fetchLatestArticles,
  fetchPeople,
  fetchSystemNames,
} from "@/sanity/lib/utils";
import Search from "./components/Search/Search";
import { formatDate } from "./utils";
import { DrawingCard } from "./drawings/DrawingCard";
import { PhotoImage } from "./components/PhotoImage";
import Image from "next/image";
import { Drawing } from "./drawings/types";
import { getDrawingsManifest, getHomepageStills } from "./manifest-util";
import Link from "next/link";
import NewsletterForm from "./components/NewsletterForm";
import { LiaArrowRightSolid, LiaArrowUpSolid } from "react-icons/lia";

const OG_IMAGE = {
  url: "https://cdn.sanity.io/images/qjczz6gi/production/5d507d27f9b7a0f0cd351429c559057b92b7c23e-1200x630.png",
  width: 1200,
  height: 630,
  alt: "Solander 38",
};

export const metadata: Metadata = {
  title: "Solander 38 | Rising Tide Research Foundation",
  openGraph: {
    title: "Solander 38 | Rising Tide Research Foundation",
    description:
      "A self-sufficient, solar-electric, coastal cruising power catamaran.",
    images: [OG_IMAGE],
  },
};

function renderText(text: string | undefined) {
  if (!text) return null;
  return text.split("\n").map((line, i) => <p key={i}>{line}</p>);
}

function renderDescription(blocks: any[]) {
  if (!blocks?.length) return null;
  return blocks.map((block) => {
    const linkMap = Object.fromEntries(
      (block.markDefs ?? []).map((m: any) => [m._key, m]),
    );
    return (
      <p key={block._key}>
        {block.children.map((child: any) => {
          const link = child.marks
            ?.map((k: string) => linkMap[k])
            .find(Boolean);
          return link ? (
            <a
              key={child._key}
              href={link.href}
              target="_blank"
              className="icon-link external-link"
            >
              {child.text}
              <span style={{ whiteSpace: "nowrap" }}>
                {"\u2060"}
                <LiaArrowUpSolid
                  size={14}
                  style={{ marginRight: "-0.125em" }}
                />
              </span>
            </a>
          ) : (
            child.text
          );
        })}
      </p>
    );
  });
}

export default async function Page() {
  const [
    people,
    latestArticles,
    homepage,
    systems,
    articleIdMap,
    firstArticle,
  ] = await Promise.all([
    fetchPeople(),
    fetchLatestArticles(),
    fetchHomepage(),
    fetchSystemNames(),
    fetchArticleIdMap(),
    fetchFirstArticle(),
  ]);

  const anatomyStills = getHomepageStills();

  const HOLD = 4;
  const FADE = 1;
  const crossfade = anatomyStills.length * HOLD;
  const at = (seconds: number) => `${((seconds / crossfade) * 100).toFixed(3)}%`;
  const crossfadeKeyframes = `@keyframes anatomy-crossfade {
    0% { opacity: 0 }
    ${at(FADE)} { opacity: 1 }
    ${at(HOLD)} { opacity: 1 }
    ${at(HOLD + FADE)} { opacity: 0 }
    100% { opacity: 0 }
  }`;

  const featuredDrawing = getDrawingsManifest().files.find(
    (f) => f.uuid === homepage.data.drawing,
  );

  return (
    <>
      <div className={styles.home}>
        <Search />

        <Navigation active={URLS.HOME} type="top-bar" />

        <div>
          <div className={styles["home__hero"]}>
            <div className={styles["home__title"]}>
              <h1>
                <svg
                  viewBox="0 0 326 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-labelledby="solander-title"
                >
                  <title id="solander-title">Solander 38</title>
                  <path
                    d="M0 25.8545H3.71094C4.73633 30.5257 7.86947 32.8613 13.1104 32.8613C15.9098 32.8613 17.985 32.2591 19.3359 31.0547C20.6868 29.8503 21.3623 28.2796 21.3623 26.3428C21.3623 24.3734 20.7275 22.8109 19.458 21.6553C18.1885 20.4834 15.7878 19.4661 12.2559 18.6035C8.34961 17.6432 5.57454 16.4388 3.93066 14.9902C2.28678 13.5254 1.46484 11.5641 1.46484 9.10645C1.46484 6.50228 2.41699 4.33757 4.32129 2.6123C6.24186 0.870768 9.01693 0 12.6465 0C16.3086 0 19.1162 0.90332 21.0693 2.70996C23.0225 4.50033 24.1374 6.64876 24.4141 9.15527H20.752C19.8568 5.08626 17.1061 3.05176 12.5 3.05176C10.1725 3.05176 8.37402 3.56445 7.10449 4.58984C5.83496 5.59896 5.2002 7.02311 5.2002 8.8623C5.2002 10.5876 5.80241 11.9059 7.00684 12.8174C8.21126 13.7126 10.4248 14.5589 13.6475 15.3564C16.04 15.9587 18.0176 16.6504 19.5801 17.4316C21.1589 18.2129 22.3389 19.0837 23.1201 20.0439C23.9014 20.988 24.4303 21.9238 24.707 22.8516C25 23.7793 25.1465 24.8454 25.1465 26.0498C25.1465 28.8818 24.0967 31.2174 21.9971 33.0566C19.8975 34.8796 16.862 35.791 12.8906 35.791C8.85417 35.791 5.79427 34.847 3.71094 32.959C1.64388 31.0547 0.406901 28.6865 0 25.8545ZM46.6797 0C51.4486 0 55.2653 1.65202 58.1299 4.95605C60.9945 8.26009 62.4268 12.5081 62.4268 17.7002C62.4268 21.0042 61.8571 23.999 60.7178 26.6846C59.5947 29.3538 57.7799 31.5592 55.2734 33.3008C52.7832 35.026 49.8047 35.8887 46.3379 35.8887C41.4714 35.8887 37.6302 34.196 34.8145 30.8105C31.9987 27.4089 30.5908 23.1201 30.5908 17.9443C30.5908 12.7523 32.015 8.46354 34.8633 5.07812C37.7116 1.69271 41.6504 0 46.6797 0ZM46.5332 3.14941C42.5293 3.14941 39.4938 4.54915 37.4268 7.34863C35.3597 10.1481 34.3262 13.6312 34.3262 17.7979C34.3262 21.932 35.4004 25.4557 37.5488 28.3691C39.6973 31.2826 42.6758 32.7393 46.4844 32.7393C48.5514 32.7393 50.3825 32.3405 51.9775 31.543C53.5726 30.7454 54.8421 29.6387 55.7861 28.2227C56.7464 26.8066 57.4626 25.2279 57.9346 23.4863C58.4066 21.7285 58.6426 19.8324 58.6426 17.7979C58.6426 13.6312 57.5928 10.1481 55.4932 7.34863C53.3936 4.54915 50.4069 3.14941 46.5332 3.14941ZM69.8975 35.4004V0.488281H73.4375V32.251H91.9434L91.3818 35.4004H69.8975ZM117.773 24.0479H103.442L99.292 35.4004H95.6787L108.325 0.488281H112.671L125.83 35.4004H121.973L117.773 24.0479ZM104.492 20.8984H116.724C112.85 10.4329 110.767 4.6875 110.474 3.66211H110.425C110.409 3.75977 108.431 9.50521 104.492 20.8984ZM135.254 35.4004H131.763V0.488281H136.694C137.394 1.59505 139.51 4.9235 143.042 10.4736C146.574 16.0238 149.447 20.5648 151.66 24.0967C153.89 27.6286 155.322 29.9642 155.957 31.1035H156.006C155.843 28.4342 155.762 23.1689 155.762 15.3076V0.488281H159.204V35.4004H154.59C144.987 20.166 138.493 9.73307 135.107 4.10156H135.01C135.173 6.96615 135.254 12.3291 135.254 20.1904V35.4004ZM169.165 35.4004V0.488281H181.152C186.019 0.488281 189.95 2.05078 192.944 5.17578C195.955 8.28451 197.461 12.4268 197.461 17.6025C197.461 22.8434 195.947 27.124 192.92 30.4443C189.909 33.7484 185.954 35.4004 181.055 35.4004H169.165ZM172.705 3.66211V32.251H180.664C184.896 32.251 188.118 30.9163 190.332 28.2471C192.546 25.5778 193.652 22.0785 193.652 17.749C193.652 13.7451 192.562 10.4004 190.381 7.71484C188.2 5.01302 184.961 3.66211 180.664 3.66211H172.705ZM226.05 15.4541V18.6035H208.447V32.251H227.734L227.246 35.4004H204.907V0.488281H226.904V3.66211H208.447V15.4541H226.05ZM245.85 19.5068H237.939V35.4004H234.351V0.488281H247.388C250.822 0.488281 253.459 1.33464 255.298 3.02734C257.153 4.70378 258.081 6.94173 258.081 9.74121C258.081 11.9059 257.511 13.7044 256.372 15.1367C255.249 16.5527 253.735 17.4886 251.831 17.9443C255.623 18.8721 257.528 21.8913 257.544 27.002V28.3936C257.544 28.6865 257.536 29.1829 257.52 29.8828C257.503 30.5664 257.503 31.1198 257.52 31.543C257.536 31.9499 257.552 32.43 257.568 32.9834C257.585 33.5205 257.625 33.9925 257.69 34.3994C257.756 34.8063 257.853 35.14 257.983 35.4004H254.443C254.069 34.5703 253.882 32.1045 253.882 28.0029V27.1973C253.882 24.3978 253.328 22.4202 252.222 21.2646C251.115 20.0928 248.991 19.5068 245.85 19.5068ZM237.939 3.58887V16.4062H245.996C251.562 16.4062 254.346 14.2578 254.346 9.96094C254.346 7.92643 253.695 6.35579 252.393 5.24902C251.09 4.14225 249.17 3.58887 246.631 3.58887H237.939ZM280.981 10.1074H277.661C277.954 7.8125 278.939 5.87565 280.615 4.29688C282.292 2.70182 284.644 1.9043 287.671 1.9043C290.763 1.9043 293.123 2.72624 294.751 4.37012C296.395 5.99772 297.217 7.97526 297.217 10.3027C297.217 12.1419 296.777 13.6393 295.898 14.7949C295.02 15.9342 293.962 16.7155 292.725 17.1387V17.2607C294.499 17.7979 295.931 18.7663 297.021 20.166C298.128 21.5495 298.682 23.3968 298.682 25.708C298.682 28.6377 297.738 31.0872 295.85 33.0566C293.962 35.026 291.203 36.0107 287.573 36.0107C284.302 36.0107 281.738 35.14 279.883 33.3984C278.044 31.6406 276.969 29.541 276.66 27.0996H280.078C280.485 28.8249 281.331 30.249 282.617 31.3721C283.919 32.4951 285.636 33.0566 287.769 33.0566C290.243 33.0566 292.082 32.3649 293.286 30.9814C294.507 29.598 295.117 27.8564 295.117 25.7568C295.117 23.4294 294.434 21.696 293.066 20.5566C291.699 19.4173 289.787 18.8477 287.329 18.8477H285.229V15.9424H286.963C291.455 15.9424 293.709 14.0788 293.726 10.3516C293.726 8.69141 293.18 7.37305 292.09 6.39648C291.016 5.40365 289.51 4.90723 287.573 4.90723C284.041 4.90723 281.844 6.64062 280.981 10.1074ZM314.478 36.0107C311.304 36.0107 308.683 35.0993 306.616 33.2764C304.549 31.4535 303.516 29.0771 303.516 26.1475C303.516 23.9502 304.118 22.1191 305.322 20.6543C306.527 19.1895 307.992 18.1396 309.717 17.5049C306.543 16.0726 304.964 13.737 304.98 10.498C304.98 7.95898 305.843 5.89193 307.568 4.29688C309.31 2.70182 311.759 1.9043 314.917 1.9043C317.814 1.9043 320.117 2.70182 321.826 4.29688C323.551 5.89193 324.414 7.94271 324.414 10.4492C324.414 12.1094 323.991 13.5498 323.145 14.7705C322.298 15.9912 321.159 16.8538 319.727 17.3584C321.501 17.9281 322.949 18.986 324.072 20.5322C325.212 22.0785 325.781 23.9176 325.781 26.0498C325.781 29.0446 324.731 31.4535 322.632 33.2764C320.532 35.0993 317.814 36.0107 314.478 36.0107ZM314.673 33.0566C316.968 33.0566 318.807 32.4382 320.19 31.2012C321.574 29.9642 322.266 28.2308 322.266 26.001C322.266 23.7712 321.598 22.054 320.264 20.8496C318.929 19.6452 317.065 19.043 314.673 19.043C312.134 19.043 310.229 19.6859 308.96 20.9717C307.707 22.2575 307.08 23.9339 307.08 26.001C307.08 28.0355 307.756 29.7201 309.106 31.0547C310.457 32.3893 312.313 33.0566 314.673 33.0566ZM314.771 4.8584C310.539 4.8584 308.423 6.70573 308.423 10.4004C308.423 12.028 308.952 13.3789 310.01 14.4531C311.084 15.5111 312.703 16.04 314.868 16.04C318.937 16.04 320.972 14.2253 320.972 10.5957C320.972 8.93555 320.451 7.56836 319.409 6.49414C318.384 5.40365 316.838 4.8584 314.771 4.8584Z"
                    fill="black"
                  />
                </svg>
              </h1>
            </div>
          </div>
          <div className={styles["home__columns"]}>
            <Image
              src="/images/solander-drawing.png"
              alt="Solander 38 drawing"
              width={874}
              height={2054}
              priority
              className={styles["home__hero__img"]}
            />
            <div>{renderDescription(homepage.data.description)}</div>
            <div className={styles["home__section"]}>
              <h4>
                <Link className="icon-link" href={URLS.STORIES}>
                  Stories
                  <LiaArrowRightSolid size={18} />
                </Link>
              </h4>
              {renderText(homepage.data.sectionDescriptions.stories)}
              <p>
                For an overview by RTRF Research Director{" "}
                <Link
                  style={{ whiteSpace: "nowrap" }}
                  href={`${URLS.PEOPLE}#${"avi-bryant"}`}
                >
                  Avi Bryant
                </Link>
                , read:
              </p>
              <ul className={styles["home__latest-list"]}>
                {firstArticle && (
                  <li>
                    <ArticleRow
                      articleId="1&#8209;A"
                      href={`${URLS.STORIES}/${firstArticle.slug}`}
                      title={firstArticle.title}
                      date={formatDate(
                        firstArticle.effectiveDate ?? firstArticle._updatedAt,
                      )}
                      compact
                    />
                  </li>
                )}
              </ul>
              <p style={{ marginTop: "1.5em" }}>Recent stories:</p>
              <ul className={styles["home__latest-list"]}>
                {latestArticles.map((article) => (
                  <li key={article._id}>
                    <ArticleRow
                      articleId={articleIdMap[article._id]}
                      href={`${URLS.STORIES}/${article.slug}`}
                      title={article.title}
                      date={formatDate(
                        article.effectiveDate ?? article._updatedAt,
                      )}
                      compact
                    />
                    <p className={styles["home__article-subtitle"]}>
                      {article.subtitle}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles["home__section"]}>
              <h4>Systems</h4>
              {renderText(homepage.data.sectionDescriptions.systems)}
              <ul className={styles["home__systems-list"]}>
                {systems.map((s, i) => (
                  <li key={s.slug}>
                    <h6>
                      {i + 1}.&nbsp;&nbsp;&nbsp;
                      <Link href={`${URLS.ANATOMY}/${s.slug}`}>{s.name}</Link>
                    </h6>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles["home__section"]}>
              <h4>
                <Link className="icon-link" href={URLS.ANATOMY + '/overview'}>
                  Anatomy
                  <LiaArrowRightSolid size={18} />
                </Link>
              </h4>
              {renderText(homepage.data.sectionDescriptions.anatomy)}
              <Link
                href={URLS.ANATOMY + '/overview'}
                className={`bg--grid ${styles["home__anatomy-link"]}`}
              >
                <div
                  className={styles["anatomy-crossfade"]}
                  style={{
                    aspectRatio: `${anatomyStills[0].width} / ${anatomyStills[0].height}`,
                  }}
                >
                  <style>{crossfadeKeyframes}</style>
                  {anatomyStills.map((still, i) => (
                    <Image
                      key={still.name}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 900px) 100vw, (max-width: 94rem) calc(100vw - 21rem), 73rem"
                      src={still.src}
                      alt={still.alt}
                      style={{
                        animationName: "anatomy-crossfade",
                        animationDuration: `${crossfade}s`,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationFillMode: "backwards",
                        animationDelay: `${i * HOLD - FADE}s`,
                      }}
                    />
                  ))}
                </div>
              </Link>
            </div>
            <div className={styles["home__section"]}>
              <h4>
                <Link className="icon-link" href={URLS.DRAWINGS + '/overview'}>
                  Drawings
                  <LiaArrowRightSolid size={18} />
                </Link>
              </h4>
              {renderText(homepage.data.sectionDescriptions.drawings)}
              {featuredDrawing && (
                <DrawingCard
                  drawing={featuredDrawing as unknown as Drawing}
                  autoScale={true}
                />
              )}
            </div>
            <div className={styles["home__section"]}>
              <h4>
                <Link className="icon-link" href={URLS.PHOTOS + '/overview'}>
                  Photos
                  <LiaArrowRightSolid size={18} />
                </Link>
              </h4>
              {renderText(homepage.data.sectionDescriptions.photos)}
              <PhotoImage
                image={homepage.data.image}
                width={homepage.data.image.asset.metadata.dimensions.width}
                height={homepage.data.image.asset.metadata.dimensions.height}
                loading="eager"
              />
            </div>
            <div className={styles["home__section"]}>
              <h4>
                <Link className="icon-link" href={URLS.PEOPLE}>
                  People
                  <LiaArrowRightSolid size={18} />
                </Link>
              </h4>
              {renderText(homepage.data.sectionDescriptions.people)}
              <ul className={styles["home__people-list"]}>
                {people.data
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((person: any) => (
                    <li key={person._id}>
                      <p>
                        <Link href={`${URLS.PEOPLE}#${person.slug?.current}`}>
                          {person.name}
                        </Link>
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
            <div className={styles["home__section"]}>
              <h4>License</h4>
              <div>{renderDescription(homepage.data.license)}</div>
            </div>
            <div className={styles["home__section"]}>
              <h4>Contact</h4>
              <p>
                Connect with us via email info@risingtideresearch.org and
                subscribe to our newsletter:
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>
      <Footer minimal={true} />
    </>
  );
}
