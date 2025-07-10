import { sanityFetch } from "@/sanity/lib/live";
import { connectorsQuery, hierarchyQuery } from "@/sanity/lib/queries";

export default async function PartsAndConnections() {
  const { data } = await sanityFetch({
    query: hierarchyQuery,
  });

  const map = new Map();
  const allItems = {};

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
        }
      } else {
        roots.push(map.get(item._id));
      }
    });

    return roots;
  }

  let y = 0;

  const item = (d: any, x = 50) => {
    y += 18;
    allItems[d._id] = { y, x, parent: d.parent };
    return (
      <g key={d._id}>
        <text
          style={{ fontWeight: "bold", transform: `translate(${x}px, ${y}px)` }}
        >
          {d.title}
        </text>
        {d.parts?.map((part: any) => {
          y += 18;

          allItems[part._id] = { y, x, parent: d.parent };
          return (
            <g
              key={part._id}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <text style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                {part.title}{" "}
              </text>
            </g>
          );
        })}
        <g key={d._id}>{d.children.map((child: any) => item(child, x + 40))}</g>
      </g>
    );
  };

  const inner = buildHierarchy(data).map((d, i) => item(d));

  const connections = await sanityFetch({
    query: connectorsQuery,
  });

  let lineCount = {};

  const getLines = (d) => {
    return (
      <g>
        {d.map((connection, i) => {
          const from = connection.componentFrom._id;
          const to = connection.componentTo._id;

          if (!(from in lineCount)) lineCount[from] = 0;
          if (!(to in lineCount)) lineCount[to] = 0;

          const fromItem = allItems[from];
          const toItem = allItems[to];

          console.log(fromItem)

          let startX = 20;

          // Check if both components share the same parent
          const sameParent =
            fromItem.parent &&
            toItem.parent &&
            fromItem.parent._id === toItem.parent._id;

          // If they share a parent, use direct x position of the source
          if (sameParent) {
            startX = fromItem.x - 30;
          }

          const offset = i * 3 - lineCount[from] * 16;

          const path = (
            <path
              key={connection._id}
              style={{ fill: "none" }}
              d={`
              M ${fromItem.x},${fromItem.y + (2 * lineCount[from])}
              L ${startX + offset},${fromItem.y + (2 * lineCount[from])}
              L ${startX + offset},${toItem.y + (2 * lineCount[to])}
              L ${startX + i * 3 - lineCount[to] * 16},${toItem.y + (2 * lineCount[to])}
              L ${toItem.x},${toItem.y + (2 * lineCount[to])}
            `}
            />
          );

          lineCount[from] += 1;
          lineCount[to] += 1;

          return path;
        })}
      </g>
    );
  };

  const lines = getLines(connections.data);

  console.log(lineCount);

  return (
    <div className='parts-and-connections' style={{ padding: "1rem" }}>
      <h3 style={{ marginBottom: "1rem" }}>Anatomy</h3>
      <svg style={{ height: y, width: "100%", position: "relative" }}>
        {inner}
        {lines}
      </svg>
    </div>
  );
}
