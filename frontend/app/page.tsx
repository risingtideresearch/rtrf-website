import { sanityFetch } from "@/sanity/lib/live";
import { schematicsQuery } from "@/sanity/lib/queries";
import XMLtoSVG from "./components/XMLtoSVG";
import Layers from "./components/layers";
import AnatomyHierarchy from "./components/anatomyHierarchy";

export default async function Page() {
  const { data } = await sanityFetch({
    query: schematicsQuery,
  });

  return (
    <div>
      <AnatomyHierarchy />
      <Layers layers={data[0].layers || []}/>
    </div>
  )
}

// export default async function Page() {
//   const { data } = await sanityFetch({
//     // query: testQuery,
//     query: schematicsQuery,
//   });

//   console.log(data);

//   // useEffect(() => {
//   //   SanityClient(
//   //     "https://cdn.sanity.io/files/qjczz6gi/production/369a9d8d99fe1e16a84fb1e67c478048cb5f1fd6.xml"
//   //   ).then((d) => {
//   //     console.log(d.text())
//   //     return d
//   //   }).then(x => {
//   //     console.log(x)
//   //   }).catch(e => {
//   //     console.log(e)
//   //   })
//   // }, [])

//   return (
//     <div>
//       {/* {(data[0].layers || []).map((img, i) => (
//         <img key={i} src={img.photo?.asset?.url} />
//       ))} */}
//     </div>
//   );

//   // function buildHierarchy(data: any[]) {
//   //   const map = new Map();
//   //   const roots: any[] = [];

//   //   data.forEach((item: any) => {
//   //     map.set(item._id, { ...item, children: [] });
//   //   });

//   //   data.forEach((item) => {
//   //     if (item.parent && item.parent._id) {
//   //       const parent = map.get(item.parent._id);
//   //       if (parent) {
//   //         parent.children.push(map.get(item._id));
//   //       }
//   //     } else {
//   //       roots.push(map.get(item._id));
//   //     }
//   //   });

//   //   return roots;
//   // }

//   // const item = (d: any) => (
//   //   <div key={d._id}>
//   //     <span style={{ fontWeight: "bold" }}>{d.title}</span>
//   //     {d.parts?.map((part: any) => (
//   //       <div key={part._id} style={{ margin: "0 0 0 2rem" }}>
//   //         <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
//   //           {part.componentPart ? part.componentPart : part.title}{" "}
//   //         </span>
//   //       </div>
//   //     ))}
//   //     <div key={d._id} style={{ margin: "0 0 0 2rem" }}>
//   //       {d.children.map((child: any) => item(child))}
//   //     </div>
//   //   </div>
//   // );

//   // return (
//   //   <div style={{ padding: "1rem"}}>
//   //     {buildHierarchy(data).map((d) => item(d))}
//   //   </div>
//   // );
// }
