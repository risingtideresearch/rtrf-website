"use client";
import Link from "next/link";
import { Image } from "./Image";
import { useState } from "react";

export default function PartCatalogGrid({ componentIndex, parts, anatomies }) {
  const [selectedAnatomy, setSelectedAnatomy] = useState([]);

  console.log(selectedAnatomy, parts);

  return (
    <>
      <div>
        {anatomies.map((anat) => {
          return (
            <div
              key={anat._id}
              style={{
                background: selectedAnatomy.includes(anat._id) ? "#f0f0f0" : "",
              }}
              onClick={() =>
                setSelectedAnatomy((prev) => {
                  if (prev.includes(anat._id)) {
                    return prev.filter((d) => d != anat._id);
                  }
                  return [...prev, anat._id];
                })
              }
            >
              {anat.title}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          // alignItems: "center",
          rowGap: "4rem",
        }}
      >
        {parts
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((part) => {
            const partAnatomy = part.anatomy.map((a) => a._id);
            return (
              <Link key={part._id} href={`/part/${part.slug}`}>
                <div
                  style={{
                    display: "flex",
                    marginBottom: "1rem",
                    alignItems: "center",
                    height: "100%",
                    position: "relative",
                    flexDirection: "column",
                    opacity:
                      selectedAnatomy.length > 0
                        ? selectedAnatomy.filter((i) => partAnatomy.includes(i))
                            .length > 0
                          ? 1
                          : 0.1
                        : 1,
                  }}
                >
                  {part.image ? (
                    <Image
                      src={part.image.url}
                      height={220 / part.image.metadata.dimensions.aspectRatio}
                      width={220}
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
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      position: "absolute",
                      textAlign: "center",
                      bottom: 0,
                    }}
                  >
                    {part.title}
                  </p>
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
}
