import { sanityFetch } from "@/sanity/lib/live";
import { allPartsQuery } from "@/sanity/lib/queries";

import { grid } from "./../styles/common.module.scss";
import { DepartureMono } from "../layout";
import { Image } from "./Image";
import Link from "next/link";

export default async function PartCatalog() {
  const { data } = await sanityFetch({
    query: allPartsQuery,
  });

  console.log(data);
    return (
      <div className={grid}>
        {/* <AnatomyHierarchy /> */}
        {data.map((part) => {
          return (
            <div key={part._id}>
              <div><Link href={`/part/${part.slug}`}>{part.title}</Link></div>
              <div>{part.componentPart}</div>

              <div>
                {part.connections.map((connection) => {
                  return (
                    <div key={connection._id}>
                      {connection.componentFrom._id == part._id ? connection.componentTo.title : connection.componentFrom.title}
                    </div>
                  );
                })}
              </div>
              <div>
                {part.image && (
                  <Image
                    src={part.image.url}
                    height={100 / part.image.metadata.dimensions.aspectRatio}
                    width={100}
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
