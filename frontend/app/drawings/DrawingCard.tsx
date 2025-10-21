"use client";

import { Drawing } from "./types";
import styles from "./styles.module.scss";
import { cleanFilename } from "./util";

interface IDrawingCard {
  drawing: Drawing;
  onClick: () => void;
}

export function DrawingCard({ drawing, onClick }: IDrawingCard) {
  return (
    <a
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      // href={`/drawings/${drawing.uuid}`}
      className={styles["drawing-card"]}
    >
      <h6>
        <span>{drawing.id}</span>
        <span> {drawing.date_info ? drawing.date_info.date : "<no date>"}</span>
        <span>{drawing.group}</span>
      </h6>
      <p>{cleanFilename(drawing)}</p>
      <img
        src={drawing.rel_path}
        height={drawing.height}
        width={drawing.width}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </a>
  );
}
