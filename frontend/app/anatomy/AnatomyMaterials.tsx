"use client";

import { IAnatomyDrawerSection } from "./AnatomyDrawer";
// import { useMemo } from "react";
import { materialIndex } from "./three-d/util";

export default function AnatomyMaterials({
  navTo,
  active,
}: IAnatomyDrawerSection) {
  if (active) {
    if (active.type != "material") {
      return null;
    }

    const layers = materialIndex.grouped_materials
      .find((mat: { name: string }) => mat.name == active.key)
      .associated_layers.sort();

    return (
      <>
        <h6 className="link" onClick={() => navTo(null)}>&larr; All</h6>
        <h3>{active.key}</h3>
        <details>
          <summary>
            <span>layers <sup>({layers.length})</sup></span>
          </summary>
          <div>
            {layers.map((child: { layer_name: string }) => (
              <div key={child.layer_name}>{child.layer_name}</div>
            ))}
          </div>
        </details>
      </>
    );
  }
  return (
    <>
      <h6>Materials</h6>
      <div>
        {materialIndex.grouped_materials
          .sort((a: { name: string }, b: { name: string }) =>
            a.name.localeCompare(b.name)
          )
          .map((material: { name: string }, i: number) => {
            return (
              <p
                className="link"
                onClick={() => navTo({ key: material.name, type: "material" })}
                key={i}
              >
                {material.name} <sup>({material.associated_layers.length})</sup> &rarr;
              </p>
            );
          })}
      </div>
    </>
  );
}
