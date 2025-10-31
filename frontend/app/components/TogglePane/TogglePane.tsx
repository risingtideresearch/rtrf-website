"use client";

import { useState } from "react";
import { BsSticky } from "react-icons/bs";
import { BiCollapseAlt, BiExpandAlt, BiLink, BiX } from "react-icons/bi";
import styles from "./toggle-pane.module.scss";
import Link from "next/link";

export default function TogglePane({ children, title = "", defaultSize = {}, expandedSize = {} }) {
  const [expand, setExpand] = useState(false);

  return (
    <>
      <div
        className={`pane ${styles["toggle-pane"]} ${
          expand ? styles["toggle-pane--expanded"] : ""
        }`}
        style={expand ? {} : defaultSize}
      >
        <h6>
          {/* TODO routing */}
          {/* <a href={`/${title.toLowerCase()}`}>{title}</a> */}
          {title}
        </h6>

        <button onClick={() => setExpand((prev) => !prev)}>
          {expand ? <BiCollapseAlt size={18} /> : <BiExpandAlt size={18} />}
        </button>
        <div style={expand ? { height: '100%'} : defaultSize}>{children}</div>
      </div>
    </>
  );
}
