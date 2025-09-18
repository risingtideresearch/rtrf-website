import { sanityFetch } from "@/sanity/lib/live";
import { allPartsQuery } from "@/sanity/lib/queries";

import { grid } from "./../styles/common.module.scss";
import { Image } from "./Image";
import Link from "next/link";
import ComponentIndex from "./ComponentIndex";

export default async function PartCatalog({ componentIndex }) {
  const { data } = await sanityFetch({
    query: allPartsQuery,
  });

  const rows = data
    .map((part) => {
      return {
        index: componentIndex.parts.indexOf(part._id) + 1 || "-",
        ...part,
      };
    })
    // .sort((a, b) => b.connections.length - a.connections.length);
    .sort((a, b) => a.index - b.index);

  return (
    <div className={grid}>
      {/* <AnatomyHierarchy /> */}
      {rows.map((part) => {
        return (
          <div key={part._id} style={{borderBottom: '1px solid #e6e6e6'}}>
            <div>
              <ComponentIndex componentIndex={componentIndex} part={part} />
            </div>
            <div className="uppercase-mono">
              <Link href={`/part/${part.slug}`}>{part.title}</Link>
            </div>

            <div>
              {part.connections.map((connection, i) => {
                return (
                  <div
                    key={connection._id}
                    className={"uppercase-mono"}
                    style={{ fontSize: "0.875rem", textTransform: "uppercase" }}
                  >
                    <span>
                      {i == 0 && part.connections.length == 1 ? (
                        "──"
                      ) : i == 0 ? (
                        "─┬"
                      ) : i < part.connections.length - 1 ? (
                        <>&nbsp;│<br/>&nbsp;├</>
                      ) : (
                        <>&nbsp;│<br/>&nbsp;└</>
                      )}
                      ──────→&nbsp;
                    </span>
                    <span>
                      {connection.componentFrom._id == part._id
                        ? connection.componentTo.title
                        : connection.componentFrom.title}
                    </span>
                  </div>
                );
              })}
            </div>

            <div>{part.componentPart}</div>
            <div>
              {part.image && (
                <Image
                  src={part.image.url}
                  height={120 / part.image.metadata.dimensions.aspectRatio}
                  width={120}
                  alt={part.image.altText}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
