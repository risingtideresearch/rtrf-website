"use client";
import {
  LiaArrowLeftSolid,
  LiaArrowRightSolid,
  LiaDownloadSolid,
} from "react-icons/lia";
import { cleanFilename } from "./DrawingsGallery";
import styles from "./styles.module.scss";
import { BiLink } from "react-icons/bi";

export function FocusedView({ drawing, onPrev, onNext, onClose, index, all }) {
  if (!drawing) {
    return <></>;
  }

  const total = all.length;

  return (
    <div
    // style={{
    //   position: "fixed",
    //   top: "3rem",
    //   right: "0.5rem",
    //   height: "calc(100vh - 3.5rem)",
    //   border: "1px solid",
    //   background: "rgba(255, 255, 255, 0.6)",
    //   backdropFilter: "blur(8px)",
    //   zIndex: 100,
    // }}
    >
      <div
        style={{
          position: "sticky",
          top: "3.25rem",
          zIndex: 1,
        }}
      >
        <div style={{}}>
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
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "20rem 1fr",
            backdropFilter: "none",
          }}
        >
          <div className={"pane " + styles["focused-header"]}>
            <div
              style={{
                display: "inline-flex",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              <h6>
                <span>{drawing.id}</span>
                <span>
                  {" "}
                  {drawing.date_info ? drawing.date_info.date : "<no date>"}
                </span>
                <span>{drawing.group}</span>
                <span>HJN</span>
              </h6>
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

          <div className={"pane " + styles["focused-header__title"]}>
            <p>{cleanFilename(drawing)}</p>
            <a href={`/drawings/file/${drawing.uuid}`}>
              <BiLink size={18} />
            </a>
            <a
              download
              href={encodeURIComponent(
                drawing.source_pdf_full_path.replace(
                  "../frontend/public/drawings",
                  ""
                )
              )}
            >
              <h6>PDF&nbsp;</h6>
              <LiaDownloadSolid />
            </a>
          </div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <img
          src={drawing.rel_path}
          style={{
            maxWidth: "100%",
            height: "auto",
            maxHeight: "calc(100% - 6.5rem)",
            width: "auto",
            border: "1px solid",
            marginTop: "-1px",
          }}
          height={drawing.height}
          width={drawing.width}
          loading="lazy"
        />
        <p
          style={{ position: "absolute", bottom: 0, left: "0.5rem" }}
          className="uppercase-mono"
        >
          {drawing.uuid}
        </p>
      </div>
      {/* <pre>{drawing.extracted_text}</pre> */}
    </div>
  );
}
