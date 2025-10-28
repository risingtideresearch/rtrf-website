"use client";
import {
  LiaArrowLeftSolid,
  LiaArrowRightSolid,
  LiaDownloadSolid,
} from "react-icons/lia";
import { cleanFilename } from "./util";
import styles from "./styles.module.scss";
import imageSetStyles from "./../components/image-set.module.scss";
import { BiCollapseAlt, BiLink } from "react-icons/bi";
import { Image } from "../components/Image";

function parseDateFromDescription(str: string | null | undefined): Date | null {
  if (!str) return null;

  const match = str.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
  if (!match || !match[1]) return null;

  const dateValue = match[1];
  const [year, month, day] = dateValue.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return null;

  return date;
}

function getSanityImageDate(asset): string {
  let date: Date | null = null;

  if (asset._createdAt) {
    date = new Date(asset._createdAt);
  }

  const { exif } = asset.metadata;

  if (exif?.DateTimeOriginal) {
    date = new Date(exif.DateTimeOriginal);
  } else if (asset.description) {
    const parsedDate = parseDateFromDescription(asset.description);
    if (parsedDate) {
      date = parsedDate;
    }
  }

  return date ? date.toLocaleDateString() : "";
}

function getSanityImageId(asset): string {
  return "IM-" + asset._key.slice(0, 5).toUpperCase();
}

export function FocusedView({
  asset,
  onPrev,
  onNext,
  onClose,
  index,
  all,
  popover = false,
  title,
}) {
  if (!asset) {
    return <></>;
  }

  const total = all.length;
  const isSanityImage = asset._type == "image";
  console.log(asset);

  return (
    <div
      className={"pane " + styles["focused-view"]}
      style={
        popover
          ? {
              position: "fixed",
              padding: "0.5rem",
              top: 0,
              left: 0,
              zIndex: 100,
              height: "100vh",
              overflow: "auto",
            }
          : {}
      }
    >
      <div
      // style={popover ? {
      //   position: "absolute",
      //   top: "3.25rem",
      //   zIndex: 1,
      // } : {}}
      >
        {popover ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {title ? <h3>{title}</h3> : <span></span>}
            <button
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                backdropFilter: "none",
              }}
              onClick={onClose}
            >
              <BiCollapseAlt size={18} />
            </button>
          </div>
        ) : (
          <button
            style={{
              display: "inline-flex",
              gap: "0.5rem",
              backdropFilter: "none",
            }}
            onClick={onClose}
          >
            <LiaArrowLeftSolid />
            drawings
          </button>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "20rem 1fr",
            backdropFilter: "none",
          }}
        >
          <div className={styles["focused-header"]}>
            <div
              style={{
                display: "inline-flex",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              {isSanityImage ? (
                <h6>
                  <span>{getSanityImageId(asset)}</span>
                  <span>{getSanityImageDate(asset.asset)}</span>
                  <span>{asset.group}</span>
                </h6>
              ) : (
                <h6>
                  <span>{asset.id}</span>
                  <span>
                    {" "}
                    {asset.date_info ? asset.date_info.date : "<no date>"}
                  </span>
                  <span>{asset.group}</span>
                  <span>HJN</span>
                </h6>
              )}
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            <button
              style={{
                display: "inline-flex",
                alignItems: "flex-start",
                textAlign: "left",
                gap: "0.25rem",
                backdropFilter: "none",
              }}
              onClick={onPrev}
              disabled={index === 0}
            >
              <LiaArrowLeftSolid size={14} /> {cleanFilename(all[index - 1])}
            </button>
            <button
              style={{
                display: "inline-flex",
                alignItems: "flex-start",
                textAlign: "right",
                gap: "0.25rem",
                backdropFilter: "none",
              }}
              onClick={onNext}
              disabled={index === total - 1}
            >
              {cleanFilename(all[index + 1])} <LiaArrowRightSolid size={14} />
            </button>
          </div>
        </div>
        {isSanityImage ? (
          <>
            <div className={styles["focused-header__title"]}>
              <p>
                {asset.asset?.title ||
                  asset.asset?.originalFilename ||
                  "<no title>"}
              </p>
            </div>
            <div
              className={`${styles["focused-view__body"]} ${imageSetStyles["image-set--photo"]}`}
            >
              <Image
                key={(asset as any)._key}
                src={asset}
                alt={"todo: add alt text"}
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles["focused-header__title"]}>
              <p>{cleanFilename(asset)}</p>
              <a href={`/drawings/file/${asset.uuid}`}>
                <BiLink size={18} />
              </a>
              <a
                download
                href={encodeURIComponent(
                  asset.source_pdf_full_path.replace(
                    "../frontend/public/drawings",
                    ""
                  )
                )}
              >
                <h6>PDF&nbsp;</h6>
                <LiaDownloadSolid />
              </a>
            </div>
            <div className={styles["focused-view__body"]}>
              <div style={{ position: 'relative'}}>
                <img
                  src={asset.rel_path}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                  height={asset.height}
                  width={asset.width}
                  loading="lazy"
                />
                <p
                  style={{ position: "absolute", bottom: 0, left: "0.5rem" }}
                  className="uppercase-mono"
                >
                  {asset.uuid}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      {/* <pre>{drawing.extracted_text}</pre> */}
    </div>
  );
}
