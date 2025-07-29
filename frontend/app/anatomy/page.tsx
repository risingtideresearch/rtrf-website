import AnatomyHierarchy from "@/app/_components/AnatomyHierarchy";
import { sanityFetch } from "@/sanity/lib/live";
import { allPartsQuery, anatomyQuery } from "@/sanity/lib/queries";
import AnatomySystem from "../_components/AnatomySystem";
// import PartsAndConnections from "../_components/PartsAndConnections";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { data } = await sanityFetch({
    query: anatomyQuery,
  });

  console.log(data);

  return (
    <div>
      {/* <AnatomyHierarchy /> */}
      {/* <PartsAndConnections /> */}
      {data.map((anat) => {
        return <AnatomySystem key={anat._id} slug={anat.slug} />;
      })}
    </div>
  );
}
