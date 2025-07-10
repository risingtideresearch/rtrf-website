import { sanityFetch } from "@/sanity/lib/live";
import { hierarchyQuery } from "@/sanity/lib/queries";
import Link from "next/link";
import { DepartureMono } from "../layout";

interface IAnatomyHierarchyProps {
  slug?: string;
}

export default async function AnatomyHierarchy({
  slug,
}: IAnatomyHierarchyProps) {
  let { data } = await sanityFetch({
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

  function buildHierarchy(data: any[]) {
    const map = new Map();
    const roots: any[] = [];

    data.forEach((item: any) => {
      map.set(item._id, { ...item, children: [], y: 0 });
    });

    data.forEach((item) => {
      if (item.parent && item.parent._id) {
        const parent = map.get(item.parent._id);
        if (parent) {
          parent.children.push(map.get(item._id));
        } else {
          roots.push(map.get(item._id));
        }
      } else {
        roots.push(map.get(item._id));
      }
    });

    return roots;
  }

  const item = (d: any) => {
    return (
      <div key={d._id}>
        <Link href={`/anatomy/${d.slug}`} style={{ fontWeight: "bold" }}>
          {d.title}
        </Link>
        {d.parts?.map((part: any) => (
          <div key={part._id} style={{ margin: "0 0 0 1.625rem" }}>
            <Link
              href={`/part/${part.slug}`}
              className={DepartureMono.className}
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                background: part.slug == slug ? "yellow" : "",
              }}
            >
              {part._type == "customPart" ? "*" : <>&nbsp;</>}
              {part.title}{" "}
            </Link>
          </div>
        ))}
        <div key={d._id} style={{ margin: "0.75rem 0 0 2rem" }}>
          {d.children.map((child: any) => item(child))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      {thisItem.parent ? (
        <Link href={`/anatomy/${thisItem.parent.slug}`}>
          part of: {thisItem.parent?.title}
        </Link>
      ) : (
        <></>
      )}
      {buildHierarchy(data).map((d) => item(d))}
    </div>
  );
}
