import { sanityFetch } from "@/sanity/lib/live";
import { hierarchyQuery } from "@/sanity/lib/queries";

export default async function AnatomyHierarchy() {
  const { data } = await sanityFetch({
    query: hierarchyQuery,
  });

  console.log(data);

  function buildHierarchy(data: any[]) {
    const map = new Map();
    const roots: any[] = [];

    data.forEach((item: any) => {
      map.set(item._id, { ...item, children: [] });
    });

    data.forEach((item) => {
      if (item.parent && item.parent._id) {
        const parent = map.get(item.parent._id);
        if (parent) {
          parent.children.push(map.get(item._id));
        }
      } else {
        roots.push(map.get(item._id));
      }
    });

    return roots;
  }

  const item = (d: any) => (
    <div key={d._id}>
      <span style={{ fontWeight: "bold" }}>{d.title}</span>
      {d.parts?.map((part: any) => (
        <div key={part._id} style={{ margin: "0 0 0 2rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
            {part.componentPart ? part.componentPart : part.title}{" "}
          </span>
        </div>
      ))}
      <div key={d._id} style={{ margin: "0 0 0 2rem" }}>
        {d.children.map((child: any) => item(child))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "1rem"}}>
      {buildHierarchy(data).map((d) => item(d))}
    </div>
  );
}
