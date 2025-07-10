import { sanityFetch } from "@/sanity/lib/live";
import { schematicsQuery } from "@/sanity/lib/queries";
import XMLtoSVG from "./components/XMLtoSVG";
import Connections from "./components/Connections";
import AnatomyHierarchy from "./components/AnatomyHierarchy";
import Layers from "./components/Layers";
import PartsAndConnections from "./components/PartsAndConnections";

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
    </div>
  )
}
