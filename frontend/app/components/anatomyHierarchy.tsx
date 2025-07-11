import { sanityFetch } from "@/sanity/lib/live";
import { hierarchyQuery } from "@/sanity/lib/queries";
import Link from "next/link";
import { DepartureMono } from "../layout";
import { buildHierarchy, romanize } from "../util/utils";

interface IAnatomyHierarchyProps {
  slug?: string;
}

export default async function AnatomyHierarchy({
  slug,
}: IAnatomyHierarchyProps) {
  const { data } = await sanityFetch({
    query: hierarchyQuery,
  });

  let thisItem = {};
  if (slug) {
    // data = data.forEach((item: any) => {
    //   if (item.slug == slug) {
    //     thisItem = item;
    //   }
    //   return item.slug == slug || item.parent?.slug == slug;
    // });

    data.forEach((item: any) => {
      if (item.slug == slug) {
        thisItem = item;
      }
      // return item.slug == slug || item.parent?.slug == slug;
    });
  }

  const item = (d: any, indexing: {anatomy: [], parts: []}) => {
    return (
      <div key={d._id}>
        <Link href={`/anatomy/${d.slug}`} style={{ fontWeight: "bold" }}>
          <h6>{romanize(indexing.anatomy.indexOf(d._id) + 1)}&nbsp;</h6>
          {d.title}
        </Link>
        {d.parts?.map((part: any) => {
          const index = indexing.parts.indexOf(part._id) + 1;
          return (
            <div key={part._id} style={{ margin: "0 0 0 2rem" }}>
              <Link
                href={`/part/${part.slug}`}
                className={DepartureMono.className}
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  background: part.slug == slug ? "yellow" : "",
                }}
              >
                {index < 10 ? <>&nbsp;</> : ""}
                {index}
                {part._type == "customPart" ? "*" : <>&nbsp;</>}
                {part.title}{" "}
              </Link>
            </div>
          );
        })}
        <div key={d._id} style={{ margin: "0.75rem 0 0 2rem" }}>
          {d.children.map((child: any) => item(child, indexing))}
        </div>
      </div>
    );
  };

  const { roots, indexing } = buildHierarchy(data)

  return (
    <div style={{ padding: "1rem" }}>
      {thisItem.parent ? (
        <Link href={`/anatomy/${thisItem.parent.slug}`}>
          part of: {thisItem.parent?.title}
        </Link>
      ) : (
        <></>
      )}
      {roots.map((d) => item(d, indexing))}
    </div>
  );
}
