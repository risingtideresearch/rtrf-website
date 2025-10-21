"use client";

import { useEffect, useState } from "react";
import { BsSticky } from "react-icons/bs";
import { BiCollapseAlt, BiExpandAlt, BiLink, BiX } from "react-icons/bi";
import styles from "./annotations.module.scss";

export default function AnnotationsList({
  content,
  activeAnnotation,
  setActiveAnnotation,
  visible,
  setVisible,
}) {
  const [expand, setExpand] = useState(false);
  const [uuid_mapping, setUUIDMapping] = useState({});
  useEffect(() => {
    fetch("/drawings/output_images/uuid_mapping.json")
      .then((res) => res.json())
      .then((res) => {
        setUUIDMapping(res);
      });
  }, []);

  useEffect(() => {
    if (!activeAnnotation && expand) {
      setExpand(false);
    }
  }, [activeAnnotation]);

  return (
    <>
      {visible && (
        <div
          className={`pane ${styles.annotations} ${
            expand ? styles["annotations--expanded"] : ""
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
            Annotations
            {activeAnnotation ? (
              <button onClick={() => setActiveAnnotation(null)}>
                reset selection
              </button>
            ) : (
              <></>
            )}
          </h6>

          {activeAnnotation ? (
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
          ) : (
            <></>
          )}
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
                {activeAnnotation &&
                  note.related.map((uuid) => (
                    <div key={uuid}>
                      <div
                        style={{
                          display: "inline-flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            borderBottom: "none",
                          }}
                          className={styles.annotations__header}
                        >
                          <h6>{uuid_mapping[uuid].id}</h6>
                          <h6>{uuid_mapping[uuid].group}</h6>
                        </div>
                        <a href={`/drawings/file/${uuid}`}>
                          <BiLink size={18} />
                        </a>
                      </div>
                      <div style={{ border: "1px solid" }}>
                        <p
                          style={{
                            margin: 0,
                            padding: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                        >
                          {uuid_mapping[uuid].filename.replace(".png", "")}
                        </p>
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
        onClick={() => setVisible((prev) => !prev)}
        style={{
          position: "fixed",
          right: "0.5rem",
          top: "5.5rem",
          border: "1px solid",
        }}
      >
        <BsSticky size={18} />
        {!visible && (
          <span
            style={{
              position: "absolute",
              top: "25%",
              left: "75%",
              transform: "translate(-50%, -50%)",
              background: activeAnnotation ? "var(--accent)" : "white",
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
