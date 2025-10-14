"use client";

import { IAnatomyDrawerSection } from "./AnatomyDrawer";
import { useEffect, useState } from "react";
import { BsSticky } from "react-icons/bs";
import { BiCollapseAlt, BiLink } from "react-icons/bi";
import styles from "./annotations.module.scss";
import Link from "next/link";

export default function AnnotationsList({
  content,
  setActiveAnnotation,
  expand,
  setExpand,
}) {
  const [uuid_mapping, setUUIDMapping] = useState({})
  useEffect(() => {
    fetch('/drawings/output_images/uuid_mapping.json')
      .then(res => res.json())
      .then(res => {
        setUUIDMapping(res)
      })
  }, [])

  return (
    <>
      {expand && (
        <div className={`pane ${styles.annotations}`}>
          <h6
            style={{
              margin: 0,
              display: "inline-flex",
              flexDirection: "row",
              alignItems: 'center',
              gap: "0.5rem",
            }}
          >
            Annotations
            <button onClick={() => setActiveAnnotation(null)}>reset selection</button>
          </h6>

          <button
            onClick={() => setExpand(false)}
            style={{
              position: "absolute",
              right: "0",
              top: "0",
              backdropFilter: "none",
            }}
          >
            <BiCollapseAlt size={18} />
          </button>
          <div>
            {content.map((note) => (
              <div key={note._id}>
                <p
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5rem 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    style={{
                      border: "1px solid",
                      borderRadius: "100%",
                      aspectRatio: "1/1",
                      padding: 0,
                    }}
                    onClick={() =>
                      setActiveAnnotation((prev) => (!prev ? note : null))
                    }
                  >
                    <strong>{note.i}</strong>
                  </button>
                  <span>{note.note}</span>
                </p>
                {note.related.map((uuid) => (
                  <div key={uuid}>
                    <div style={{display: 'inline-flex', gap: '0.5rem', alignItems: 'center'}}>
                      <div className={styles.annotations__header}>
                        <h6>{uuid_mapping[uuid].id}</h6>
                        <h6>{uuid_mapping[uuid].group}</h6>
                      </div>

                      <a href={`/drawings/file/${uuid}`}>
                        <BiLink size={18} />
                      </a>
                    </div>
                    <img
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        border: "1px solid",
                        marginTop: "-1px",
                      }}
                      loading={"lazy"}
                      src={uuid_mapping[uuid].rel_path}
                      height={uuid_mapping[uuid].height}
                      width={uuid_mapping[uuid].width}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        className="pane"
        onClick={() => setExpand((prev) => !prev)}
        style={{
          position: "fixed",
          right: "0.5rem",
          top: "3rem",
          border: "1px solid",
        }}
      >
        <BsSticky size={18} />
        {!expand && (
          <span
            style={{
              position: "absolute",
              top: "25%",
              left: "75%",
              transform: "translate(-50%, -50%)",
              background: "white",
              border: "1px solid",
              borderRadius: "100%",
              aspectRatio: "1 / 1",
              width: "0.75rem",
              fontSize: "0.5rem",
              lineHeight: "120%",
            }}
          >
            {content.length}
          </span>
        )}
      </button>
    </>
  );
}
