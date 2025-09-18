"use client";

import { useMemo } from "react";
import { getSystemMap, models, drawings } from "./three-d/util";
import { IAnatomyDrawerSection } from "./AnatomyDrawer";
import Image from "next/image";

export default function AnatomySystems({
  navTo,
  active,
}: IAnatomyDrawerSection) {
  const systems = useMemo(() => getSystemMap(models), []);
  const drawingManifest = useMemo(() => drawings, []);

  if (active) {
    if (active.type != "system") {
      return null;
    }

    // const mats = new Set();

    // systems[active.key].children.forEach((child) => {
    //   const key = child.replace("models/", "").replace(".glb", "");
    //   console.log(materialIndex.layer_distribution[key], key);
    //   materialIndex.layer_distribution[key]?.materials.forEach((m) => {
    //     mats.add(m);
    //   });
    // });

    const children = systems[active.key]?.children || [];

    console.log(active.key, children);

    return (
      <>
        {/* <details>
          <summary>
            <span>layers</span> <sup>({children.length})</sup>
          </summary>
          <div>
            {children.sort().map((child: string) => (
              <p key={child}>
                {child
                  .replace(`${active.key}__`, "")
                  .replace("models/", "")
                  .replace(".glb", "")}
              </p>
            ))}
          </div>
        </details> */}

        {/* <details>
          <summary>
            <span>drawings <sup>({drawingManifest?.files.length})</sup></span>
          </summary> */}
        <div>
          {drawingManifest?.files.map((drawing) => (
            <div key={drawing.filename} style={{ position: "relative" }}>
              <h6
                style={{
                  background: "var(--foreground)",
                  color: "var(--background)",
                  padding: "0.25rem",
                }}
              >
                {drawing.filename}
              </h6>
              <Image
                src={drawing.rel_path}
                alt="test"
                width={drawing.width}
                height={drawing.height}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          ))}
        </div>
        {/* </details> */}

        {/* <h6>Materials</h6>
        {Array.from(mats)
          .sort()
          .map((mat) => (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => navTo({ key: mat, type: "material" })}
              key={mat}
            >
              {mat} &rarr;
            </div>
          ))} */}
      </>
    );
  }

  return (
    <>
      <h6>Anatomy</h6>
      <div>
        {Object.keys(systems)
          .filter((key: string) => systems[key].i == 0)
          .sort()
          .map((sys: string) => (
            <p
              className="link"
              onClick={() => navTo({ key: sys, type: "system" })}
              key={sys}
            >
              {sys} &rarr;
            </p>
          ))}
      </div>
    </>
  );
}
