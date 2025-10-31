"use client";

import { BiInfoCircle, BiX } from "react-icons/bi";
import styles from "./info.module.scss";

export default function Info({ visible, setVisible, lastUpdated }) {
  return (
    <>
      {visible && (
        <div className={`pane ${styles.info}`}>
          <h6
            style={{
              margin: 0,
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Last updated
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

          <div>
            <p>{lastUpdated}</p>
          </div>
        </div>
      )}
      <button
        className="pane"
        onClick={() => setVisible((prev) => !prev)}
        style={{
          position: "fixed",
          right: "0.5rem",
          top: "5.5rem",
          border: "1px solid",
        }}
      >
        <BiInfoCircle size={18} />
      </button>
    </>
  );
}
