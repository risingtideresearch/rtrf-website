import { sanityFetch } from "@/sanity/lib/live";
import { connectionsQuery } from "@/sanity/lib/queries";

export default async function Connections() {
  const { data } = await sanityFetch({
    query: connectionsQuery,
  });

  function getTitle(component: any) {
    return component.title;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h3 style={{ marginBottom: "1rem" }}>All connections</h3>
      <div>
        {data
          .sort((a, b) =>
            getTitle(a.componentFrom).localeCompare(getTitle(b.componentFrom)),
          )
          .map((connection: any) => {
            return (
              <div key={connection._id}>
                {getTitle(connection?.componentFrom)} &harr;{" "}
                {getTitle(connection?.componentTo)}
                <p
                  style={{
                    margin: "0 0 0 1rem",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  {connection.description || ""}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
