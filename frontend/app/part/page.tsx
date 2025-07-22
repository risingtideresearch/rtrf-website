import { sanityFetch } from "@/sanity/lib/live";
import { allPartsQuery, anatomyQuery } from "@/sanity/lib/queries";
import PartCatalog from "../_components/PartCatalog";
import PartCatalogGrid from "../_components/PartCatalogGrid";
import { fetchHierarchyWithIndexing } from "../_util/utils";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { componentIndex, map } = await fetchHierarchyWithIndexing();
  const parts = await sanityFetch({
    query: allPartsQuery,
  });

  const anatomies = await sanityFetch({
    query: anatomyQuery,
  });

  return (
    <div>
      {/* <PartCatalog componentIndex={componentIndex} /> */}
      <PartCatalogGrid
        componentIndex={componentIndex}
        parts={parts.data}
        anatomies={anatomies.data}
      />
    </div>
  );
}
