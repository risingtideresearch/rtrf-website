"use client";

import Image from "next/image";
import { Drawing } from "./types";
import styles from "./drawings.module.scss";
import { formatDate, toISODate } from "../utils";
import { getDrawingName } from "./util";

interface IDrawingCard {
  drawing: Drawing;
  hideMetadata?: boolean;
  autoScale?: boolean;
}

export function DrawingCard({ drawing, hideMetadata, autoScale }: IDrawingCard) {
  return (
    <a
      href={`/drawings/file/${drawing.uuid}`}
      className={styles["drawing-card"]}
    >
      {!hideMetadata && (
        <h6>
          <span>{drawing.id}</span>
          {drawing.date_info && (
            <span> {formatDate(drawing.date_info.date)}</span>
          )}
          <span>{drawing.group}</span>
        </h6>
      )}
      <p style={{ margin: 0 }}>{getDrawingName(drawing)}</p>
      <div
        style={{
          aspectRatio: !hideMetadata && !autoScale ? 1.15 : `${drawing.width} / ${drawing.height}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={drawing.rel_path}
          alt={getDrawingName(drawing)}
          height={drawing.height}
          width={drawing.width}
          style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}
        />
      </div>
    </a>
  );
}
