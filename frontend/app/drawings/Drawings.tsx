"use client";

import { useState } from "react";
import { Drawing } from "./types";
import DrawingsGallery from "./DrawingsGallery";

interface DrawingsProps {
    drawings: {
        files: Array<Drawing>,
    },
    defaultUUID?: string
}

export default function Drawings({
  drawings,
  defaultUUID,
}: DrawingsProps) {
  const [search, setSearch] = useState("");

  return (
    <div>
      <input
        type="text"
        placeholder="search"
        value={search}
        style={{
          border: "1px solid",
          position: "fixed",
          top: "3.25rem",
          left: "0.5rem",
          width: "15rem",
        }}
        onChange={(e) => {
          const val = e.target.value;
          setSearch(val);

        //   if (val.trim() != "") {
        //     setFocusIndex(-1);
        //     window.history.pushState(null, "", "/drawings");
        //   }
        }}
      />

      <DrawingsGallery drawings={drawings}
        search={search}
        defaultUUID={defaultUUID}
        />
    </div>
  );
}
