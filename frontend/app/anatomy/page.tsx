import AnatomyHierarchy from "@/app/components/AnatomyHierarchy";
import { sanityFetch } from "@/sanity/lib/live";
import { allPartsQuery } from "@/sanity/lib/queries";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { data } = await sanityFetch({
    query: allPartsQuery,
  });

  console.log(data);
  return (
    <div>
      <AnatomyHierarchy />
    </div>
  );
}
