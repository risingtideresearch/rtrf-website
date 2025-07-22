"use client";
import Link from "next/link";
import { Image } from "./Image";
import { useState } from "react";
import PartCatalogFilters from "./PartCatalogFilters";

type Anatomy = {
  _id: string;
  title: string;
  parent?: {
    _id: string;
    title: string;
    slug: string;
  } | null;
};

type PartAnatomy = { id: string }[];

function buildAncestorMap(anatomies: Anatomy[]): Record<string, string[]> {
  const map: Record<string, Anatomy> = {};
  anatomies.forEach((anatomy) => {
    map[anatomy._id] = anatomy;
  });

  const ancestorMap: Record<string, string[]> = {};

  function getAncestors(id: string): string[] {
    const ancestry: string[] = [];
    let current = map[id];

    while (current?.parent?._id) {
      const parentId = current.parent._id;
      ancestry.push(parentId);
      current = map[parentId];
    }

    return ancestry;
  }

  for (const anatomy of anatomies) {
    ancestorMap[anatomy._id] = getAncestors(anatomy._id);
  }

  return ancestorMap;
}

export default function PartCatalogGrid({ componentIndex, parts, anatomies }) {
  const [filters, setFilters] = useState({
    anatomies: [],
    scales: [],
    types: [],
  });
  const [scaleImages, setScaleImages] = useState(false);

  const ancestorMap = buildAncestorMap(anatomies);

  function hasAnySelectedAncestor(partAnatomy: PartAnatomy): boolean {
    console.log(partAnatomy);
    // for (const { id } of partAnatomy) {
    //   let currentId: string | null = id;
    //   while (currentId) {
    //     if (filters.anatomies.has(currentId)) {
    //       return true;
    //     }
    //     currentId = ancestorMap[currentId] ?? null;
    //   }
    // }
    for (let i = 0; i < partAnatomy.length; i += 1) {
      const id = partAnatomy[i]._id;
      const ancestors = ancestorMap[id];

      const antatomyAndAncestors = [id, ...ancestors];

      for (let j = 0; j < filters.anatomies.length; j += 1) {
        if (antatomyAndAncestors.indexOf(filters.anatomies[j]) > -1) {
          return true;
        }
      }
    }

    return false;
  }

  const isVisible = (part): boolean => {
    const { anatomies, scales, types } = filters;
    if (types.length > 0) {
      if (!types.includes(part._type)) {
        return false;
      }
    }
    if (scales.length > 0) {
      if (!scales.includes(part.scale)) {
        return false;
      }
    }

    console.log(part.scale)

    if (anatomies.length > 0) {
      const partAnatomy = part.anatomy.map((a) => a._id);
      if (anatomies.filter((i) => partAnatomy.includes(i)).length == 0) {
        return false;
      }

      // if (!hasAnySelectedAncestor(part.anatomy)) {
      //   return false;
      // }
    }

    return true;
  };

  return (
    <>
      <PartCatalogFilters
        anatomies={anatomies}
        filters={filters}
        setFilters={setFilters}
      />
      <label>
        <input
          type="checkbox"
          checked={scaleImages}
          onChange={() => setScaleImages((prev) => !prev)}
        />
        &nbsp;scale to size
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          // alignItems: "center",
        }}
      >
        {parts
          .filter((part) => isVisible(part))
          .sort((a, b) => parseFloat(b.scale.replace('m', '')) - parseFloat(a.scale.replace('m', '')))
          .map((part) => {
            const size = scaleImages
              ? 220 / (part.scale == "1m" ? 2 : part.scale == "0.1m" ? 8 : 1)
              : 220;
            return (
              <Link
                key={part._id}
                href={`/part/${part.slug}`}
                style={{ position: "relative" }}
              >
                <div
                  style={{
                    display: "flex",
                    marginBottom: "1rem",
                    alignItems: "center",
                    height: "100%",
                    position: "relative",
                    flexDirection: "column",
                    padding: "2rem",
                  }}
                >
                  <div style={{ padding: "1rem" }}>
                    {part.image ? (
                      <Image
                        src={part.image.url}
                        height={
                          size / part.image.metadata.dimensions.aspectRatio
                        }
                        width={size}
                        alt={part.image.altText}
                      />
                    ) : (
                      <div
                        style={{
                          width: "5rem",
                          height: "5rem",
                          background: "#e6e6e6",
                        }}
                      ></div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      position: "absolute",
                      textAlign: "center",
                      margin: "1rem 0",
                      top: 0,
                    }}
                  >
                    {part.title}
                  </p>
                </div>
                <svg
                  viewBox="0 0 20 20"
                  style={{
                    stroke: "#dadada",
                    overflow: "visible",
                    width: 20,
                    height: 20,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <line x1={0} x2={20} y1={0} y2={0}></line>
                  <line x1={0} x2={0} y1={20} y2={0}></line>
                </svg>
                <svg
                  viewBox="0 0 20 20"
                  style={{
                    stroke: "#dadada",
                    overflow: "visible",
                    width: 20,
                    height: 20,
                    position: "absolute",
                    top: 0,
                    right: 0,
                  }}
                >
                  <line x1={0} x2={20} y1={0} y2={0}></line>
                  <line x1={20} x2={20} y1={20} y2={0}></line>
                </svg>
                <svg
                  viewBox="0 0 20 20"
                  style={{
                    stroke: "#dadada",
                    overflow: "visible",
                    width: 20,
                    height: 20,
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <line x1={0} x2={20} y1={20} y2={20}></line>
                  <line x1={20} x2={20} y1={20} y2={0}></line>
                </svg>

                <svg
                  viewBox="0 0 20 20"
                  style={{
                    stroke: "#dadada",
                    overflow: "visible",
                    width: 20,
                    height: 20,
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <line x1={0} x2={20} y1={20} y2={20}></line>
                  <line x1={0} x2={0} y1={20} y2={0}></line>
                </svg>
              </Link>
            );
          })}
      </div>
    </>
  );
}
