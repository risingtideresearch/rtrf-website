import Link from "next/link";
import { fetchHierarchyWithIndexing, romanize } from "../_util/utils";
import { Image } from "./Image";
import Schematic from "./Schematic";

interface IAnatomySystemProps {
  slug?: string;
}

export default async function AnatomySystem({ slug }: IAnatomySystemProps) {
  const { map } = await fetchHierarchyWithIndexing();

  // const root = roots.filter(root => {
  //   root.parent?.slug == slug
  // })

  const thisSystem = map.values().find((d) => d.slug == slug);

  return (
    <>
      <div>
        <div>
          {/* {thisSystem.parent ? (
            <div>
              <Link href={`/anatomy/${thisSystem.parent.slug}`}>
                {thisSystem.parent.title}
              </Link>
              <span>- - -</span>
            </div>
          ) : (
            <></>
          )} */}
          <h3>
            <Link href={`/anatomy/${thisSystem.slug}`}>{thisSystem.title}</Link>
          </h3>
        </div>
        {/* <span className="uppercase-mono" style={{ fontSize: "0.75rem" }}>
          {thisSystem.parts.map((part) => (
            <>
              ───
              <Link key={part._id} href={`/part/${part.slug}`}>
                {part.title}
              </Link>
            </>
          ))}
        </span> */}
        {thisSystem.schematics?.map((schematic) => {
          return <Schematic key={schematic._id} data={schematic} />;
        })}
      </div>
      {/* <pre>{JSON.stringify(thisSystem, null, 4)}</pre> */}
    </>
  );

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

  console.log(data);

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
                className={"uppercase-mono"}
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
