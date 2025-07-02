import { sanityFetch } from "@/sanity/lib/live";
import { connectorsQuery } from "@/sanity/lib/queries";

export default async function Connections() {
  const { data } = await sanityFetch({
    query: connectorsQuery,
  });

  function getTitle(component: any) {
    return component.title;
  }

  return (
    <div style={{ padding: "1rem" }}>
      {data.map((connection: any) => {
        return (
          <div>
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
  );
}
