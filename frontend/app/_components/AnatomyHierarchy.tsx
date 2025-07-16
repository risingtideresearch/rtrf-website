import Link from "next/link";
import { fetchHierarchyWithIndexing, romanize } from "../_util/utils";

interface IAnatomyHierarchyProps {
  slug?: string;
}

export default async function AnatomyHierarchy({
  slug,
}: IAnatomyHierarchyProps) {
  const { componentIndex, roots, data } = await fetchHierarchyWithIndexing()

  let thisItem = {};
  let thisParent = {};
  if (slug) {
    data.forEach((item: any) => {
      if (item.slug == slug) {
        thisItem = item;
        thisParent = item.parent;
      }
    });
  }

  console.log(data)

  // function getAllParents(item: any, map: Map<string, any>) {
  //   const parents: any[] = [];
  //   let current = item;

  //   while (current?.parent?._id) {
  //     const parent = map.get(current.parent._id);
  //     if (!parent) break;
  //     parents.push(parent);
  //     current = parent;
  //   }

  //   return parents;
  // }

  // console.log(roots, slug, getAllParents(thisItem, data));

  const item = (d: any, componentIndex: { anatomy: []; parts: [] }) => {
    return (
      <div key={d._id}>
        <Link href={`/anatomy/${d.slug}`} style={{ fontWeight: "bold" }}>
          <h6>{romanize(componentIndex.anatomy.indexOf(d._id) + 1)}&nbsp;</h6>
          {d.title}
        </Link>
        {d.parts?.map((part: any) => {
          const index = componentIndex.parts.indexOf(part._id) + 1;
          return (
            <div key={part._id} style={{ margin: "0.25rem 0 0.25rem 2rem" }}>
              <Link
                href={`/part/${part.slug}`}
                className={'uppercase-mono'}
                style={{
                  fontSize: "0.875rem",
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
          {d.children.map((child: any) => item(child, componentIndex))}
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
      {roots.map((d) => item(d, componentIndex))}
    </div>
  );
}
