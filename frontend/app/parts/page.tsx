// import { sanityFetch } from "@/sanity/lib/live";
// import { schematicsQuery } from "@/sanity/lib/queries";
// import XMLtoSVG from "./_components/XMLtoSVG";
// import Connections from "./_components/Connections";
// import AnatomyHierarchy from "./_components/AnatomyHierarchy";
// import Layers from "./_components/Layers";
// import PartsAndConnections from "./_components/PartsAndConnections";
import { sanityFetch } from "@/sanity/lib/live";
import {
  allPartsQuery,
  anatomyQuery,
  materialsQuery,
} from "@/sanity/lib/queries";
import { fetchHierarchyWithIndexing } from "./../utils";
import PartCatalogGrid from "./PartCatalogGrid";

export default async function Page() {
  // const { data } = await sanityFetch({
  //   query: schematicsQuery,
  // });

  const { componentIndex, map } = await fetchHierarchyWithIndexing();
  const parts = await sanityFetch({
    query: allPartsQuery,
  });

  const anatomies = await sanityFetch({
    query: anatomyQuery,
  });

  // const materials = await sanityFetch({
  //   query: materialsQuery,
  // });

  console.log(parts, anatomies);

  return (
    <>
      <PartCatalogGrid
        componentIndex={componentIndex}
        parts={parts.data}
        anatomies={anatomies.data}
      />
    </>
  );
}
