"use client";

import styles from "./toc.module.scss";
import { createContext, useEffect, useState } from "react";

/**
 *
 */
export const getSections = () => {
  return [
    {
      name: "Overview",
      slug: "overview",
      chapters: [
        {
          name: "Self-sufficiency",
        },
        {
          name: "Technical specifications",
        },
      ],
    },
    {
      name: "Power architecture",
      slug: "power-architecture",
      chapters: [
        {
          name: "Solar panels",
        },
        {
          name: "Battery",
        },
      ],
    },
    {
      name: "Superstructure",
      slug: "superstructure",
      chapters: [
        {
          name: "Wooden jig",
        },
        {
          name: "Aluminum build",
        },
        {
          name: "Wireways",
        },
      ],
    },
    {
      name: "Control",
      slug: "control",
      chapters: [
        {
          name: "CAN bus",
        },
        {
          name: "Automation",
        },
        {
          name: "Electrical steering",
        },
        {
          name: "Mechanical steering",
        },
      ],
    },
    {
      name: "Propulsion",
      slug: "propulsion",
      chapters: [
        {
          name: "Rudder, propellers, and struts",
        },
        {
          name: "Motors",
        },
      ],
    },
    {
      name: "Body",
      slug: "body",
      chapters: [
        {
          name: "Hull and deck",
        },
        {
          name: "Laminate schedule",
        },
        {
          name: "Areas of high vs normal core",
        },
      ],
    },
    {
      name: "Water & heating systems",
      slug: "water-heating-systems",
      chapters: [
        {
          name: "Cooling",
        },
        {
          name: "Fresh water",
        },
      ],
    },
    {
      name: "Outfitting & interior",
      slug: "outfitting-interior",
      chapters: [
        {
          name: "Cabinetry",
        },
        {
          name: "Table inlay",
        },
        {
          name: "Tread plate",
        },
        {
          name: "Railings",
        },
      ],
    },
  ];
};

const dates = [
  "2025-09",
  "2025-08",
  "2025-07",
  "2025-06",
  "2025-05",
  "2025-04",
  "2025-02",
  "2025-01",
  "2024-12",
  "2024-11",
  "2024-09",
  "2024-08",
  "2024-02",
];

export const TOCContext = createContext({
  mode: "system",
  section: "overview",
});

export default function TableOfContents({
  children,
  modes = ["system", "date"],
  defaultSystem = "",
  materials = [],
  disable = false,
}) {
  const [mode, setMode] = useState("system");
  const [section, setSection] = useState(
    defaultSystem || getSections()[0].slug
  );

  return (
    <TOCContext.Provider value={{ mode, section }}>
      {!disable && (
        <div className={"pane toc " + styles.toc}>
          {/* <h2 className="uppercase-mono">Table of Contents</h2> */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: modes.length == 1 ? "1fr" : "1fr 1fr",
              borderBottom: "1px solid",
              margin: "0 -0.5rem",
            }}
          >
            {modes.map((type, i) => (
              <h6
                onClick={() => {
                  setMode(type);
                  setSection(getSections()[0].slug);
                }}
                key={type}
                style={{
                  cursor: "pointer",
                  fontWeight: mode == type ? 800 : 400,
                  margin: 0,
                  padding: "0.5rem",
                  borderRight: i < modes.length - 1 ? "1px solid" : "",
                }}
              >
                {type == "system" ? "system" : type}
              </h6>
            ))}
          </div>
          {mode == "system" ? (
            <ol>
              {getSections().map((s) => {
                return (
                  <li
                    style={{ cursor: "pointer" }}
                    key={s.slug}
                    onClick={() => setSection(s.slug)}
                  >
                    <h6
                      style={{
                        margin: "0.5rem",
                        fontWeight: s.slug == section ? 600 : 400,
                      }}
                    >
                      {s.name}
                    </h6>
                    {/* <ul>
                {section.chapters.map((chapter) => (
                  <li key={chapter.name}>
                    <p>
                      <Link href={"/articles"}>{chapter.name}</Link>
                    </p>
                  </li>
                ))}
              </ul> */}
                  </li>
                );
              })}
            </ol>
          ) : mode == "date" ? (
            <ol>
              {dates.map((section) => {
                return (
                  <li key={section}>
                    <h6 style={{ margin: "0.5rem" }}>{section}</h6>
                  </li>
                );
              })}
            </ol>
          ) : mode == "material" ? (
            <ol>
              {materials.map((mat) => {
                return (
                  <li key={mat} onClick={() => setSection(mat)}>
                    <h6 style={{ margin: "0.5rem" }}>{mat}</h6>
                  </li>
                );
              })}
            </ol>
          ) : (
            <></>
          )}
        </div>
      )}
      {children}
    </TOCContext.Provider>
  );
}
