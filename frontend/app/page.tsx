import { sanityFetch } from "@/sanity/lib/live";
import { schematicsQuery } from "@/sanity/lib/queries";
import XMLtoSVG from "./_components/XMLtoSVG";
import Connections from "./_components/Connections";
import AnatomyHierarchy from "./_components/AnatomyHierarchy";
import Layers from "./_components/Layers";
import PartsAndConnections from "./_components/PartsAndConnections";
import { Viewer3D } from "./_components/three-d/Viewer3D";

export default async function Page() {
  const { data } = await sanityFetch({
    query: schematicsQuery,
  });

  return (
    <div>
      {/* <PartsAndConnections /> */}
      {/* <AnatomyHierarchy /> */}
      {/* <Connections />
      <Layers layers={data[0].layers || []}/> */}
      <Viewer3D />
    </div>
  )
}
