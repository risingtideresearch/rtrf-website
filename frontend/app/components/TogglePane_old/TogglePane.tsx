"use client";

import { useState } from "react";
import { BsSticky } from "react-icons/bs";
import { BiCollapseAlt, BiExpandAlt, BiLink, BiX } from "react-icons/bi";
import styles from "./toggle-pane.module.scss";
import Link from "next/link";

export default function TogglePane({
  icon = <BsSticky size={18} />,
  children,
  title = '',
  top = '0.5rem'
}) {
  const [expand, setExpand] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <>
      {visible && (
        <div
          className={`pane ${styles["toggle-pane"]} ${
            expand ? styles["toggle-pane--expanded"] : ""
          }`}
        >
          <h6
            style={{
              margin: 0,
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <a href={`/${title.toLowerCase()}`}>{title}</a>
          </h6>

          <button
            onClick={() => setVisible(false)}
            style={{
              position: "absolute",
              right: "0",
              top: "0",
              backdropFilter: "none",
            }}
          >
            <BiX size={18} />
          </button>

          <button
            onClick={() => setExpand((prev) => !prev)}
            style={{
              position: "absolute",
              right: "2rem",
              top: "0",
              backdropFilter: "none",
            }}
          >
            {expand ? <BiCollapseAlt size={18} /> : <BiExpandAlt size={18} />}
          </button>
          <div>
            {children}
          </div>
        </div>
      )}
      <button
        className="pane"
        onClick={() => setVisible((prev) => !prev)}
        style={{
          position: "fixed",
          right: "0.5rem",
          top: top,
          border: "1px solid",
        }}
      >
        {icon}
      </button>
    </>
  );
}
