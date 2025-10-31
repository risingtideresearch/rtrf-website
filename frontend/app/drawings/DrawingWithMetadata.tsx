import { LiaDownloadSolid } from "react-icons/lia";
import styles from "./styles.module.scss";
import { BiLink } from "react-icons/bi";
import { cleanFilename } from "./util";

export function DrawingWithMetadata({ drawing }) {
  if (!drawing) {
    return <></>;
  }

  return (
    <div>
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
      <div style={{ position: "relative" }}>
        <img
          src={drawing.rel_path}
          style={{
            maxWidth: "100%",
            height: "auto",
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
    </div>
  );
}
