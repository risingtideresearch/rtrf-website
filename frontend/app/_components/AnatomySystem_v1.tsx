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

  console.log(thisSystem);

  const connections = (part) => {
    let longest = part.title.length;

    const markup = (
      <span style={{ display: "inline-flex", flexDirection: "column" }}>
        {part.connections.map((connection, i) => {
          return (
            <>
              {connection.componentFrom._id != part._id &&
                connection.componentFrom.anatomy
                  .filter((anat) => anat._id != thisSystem._id)
                  .map((anat) => {
                    longest = Math.max(
                      anat.title.length,
                      Math.max(connection.componentFrom.title.length, longest),
                    );
                    return (
                      <span
                        key={anat._id}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                        }}
                      >
                        ┆
                        <br />
                        ┆
                        <br />
                        └┐
                        <Link href={`/part/${connection.componentFrom.slug}`}>
                          &nbsp;├─{connection.componentFrom.title}
                        </Link>
                        <Link href={`/anatomy/${anat.slug}`}>
                          &nbsp;&nbsp;&nbsp;({anat.title})
                        </Link>
                      </span>
                    );
                  })}
              {connection.componentTo._id != part._id &&
                connection.componentTo.anatomy
                  .filter((anat) => anat._id != thisSystem._id)
                  .map((anat) => {
                    longest = Math.max(
                      anat.title.length,
                      Math.max(connection.componentTo.title.length, longest),
                    );
                    return (
                      <span
                        key={anat._id}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                        }}
                      >
                        ┆
                        <br />
                        ┆
                        <br />
                        └┐
                        <Link href={`/part/${connection.componentTo.slug}`}>
                          &nbsp;├─{connection.componentTo.title}
                        </Link>
                        <Link href={`/anatomy/${anat.slug}`}>
                          &nbsp;&nbsp;&nbsp;({anat.title})
                        </Link>
                      </span>
                    );
                  })}
            </>
          );
        })}
      </span>
    );

    return {
      markup,
      longest,
    };
  };

  return (
    <>
      <div>
        <div>
          <p className="uppercase-mono" style={{ fontSize: "0.75rem" }}>
            ┌─{thisSystem.title.split("").map((d) => "─")}─┐
            <br />│ {thisSystem.title} │{/* <br /> */}
            {/* └─{thisSystem.title.split("").map((d) => "─")}─┘ */}
          </p>
        </div>
        <div className="uppercase-mono" style={{ fontSize: "0.75rem" }}>
          {thisSystem.parts.map((part, i) => {
            const { markup, longest } = connections(part);
            return (
              <span key={part._id} style={{ display: "inline-flex" }}>
                <span
                  style={{ display: "inline-flex", flexDirection: "column" }}
                >
                  {i == 0 ? "├" : "┌"}─
                  {Array.from({ length: longest + 1 }, (v, i) => i).map(
                    (_) => "─",
                  )}
                  ─<Link href={`/part/${part.slug}`}>│{part.title}&nbsp;</Link>
                  {markup}
                </span>
              </span>
            );
          })}
        </div>
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
