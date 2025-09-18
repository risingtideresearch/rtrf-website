import Link from "next/link";
import { fetchHierarchyWithIndexing, romanize } from "../_util/utils";
// import { Image } from "./Image";
// import Schematic from "./Schematic";

interface IAnatomySystemProps {
  slug?: string;
}

export default async function AnatomySystem({ slug }: IAnatomySystemProps) {
  const { map } = await fetchHierarchyWithIndexing();

  const thisSystem = map.values().find((d) => d.slug == slug);

  console.log(thisSystem);

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 2fr" }}>
      <div>
        <p>{thisSystem.title}</p>
      </div>
      <div>
        {thisSystem.parts.map((part, i) => {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                marginBottom: "1rem",
              }}
              key={part._id}
            >
              <p>
                <Link href={`/part/${part.slug}`}>{part.title}</Link>
                <span style={{ width: "100%", borderTop: "1px solid" }}></span>
              </p>
              <div>
                {part.connections.map((connection, i) => {
                  return (
                    <p key={connection._id} style={{ margin: "0 0 1rem 0" }}>
                      {connection.componentFrom._id != part._id &&
                        connection.componentFrom.anatomy
                          .filter((anat) => anat._id != thisSystem._id)
                          .map((anat) => {
                            return (
                              <span
                                key={anat._id}
                                style={{
                                  display: "inline-flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                }}
                              >
                                <Link
                                  href={`/part/${connection.componentFrom.slug}`}
                                >
                                  {connection.componentFrom.title}
                                </Link>
                                <Link href={`/anatomy/${anat.slug}`}>
                                  ({anat.title})
                                </Link>
                              </span>
                            );
                          })}
                      {connection.componentTo._id != part._id &&
                        connection.componentTo.anatomy
                          .filter((anat) => anat._id != thisSystem._id)
                          .map((anat) => {
                            return (
                              <span
                                key={anat._id}
                                style={{
                                  display: "inline-flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Link
                                  href={`/part/${connection.componentTo.slug}`}
                                >
                                  {connection.componentTo.title}
                                </Link>
                                <Link href={`/anatomy/${anat.slug}`}>
                                  ({anat.title})
                                </Link>
                              </span>
                            );
                          })}
                    </p>
                  );
                  
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
