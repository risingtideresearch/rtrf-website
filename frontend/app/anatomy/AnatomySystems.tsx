"use client";

import { useMemo } from "react";
import { getSystemMap, models } from "./three-d/util";
import { IAnatomyDrawerSection } from "./AnatomyDrawer";

export default function AnatomySystems({
  navTo,
  active,
}: IAnatomyDrawerSection) {
  const systems = useMemo(() => getSystemMap(models), []);

  if (active) {
    return <></>
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
