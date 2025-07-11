import ComponentPart from "@/app/components/ComponentMetadata";
import { buildHierarchy } from "@/app/util/utils";
import { sanityFetch } from "@/sanity/lib/live";
import { hierarchyQuery } from "@/sanity/lib/queries";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await sanityFetch({
    query: hierarchyQuery,
  });

  const { indexing } = buildHierarchy(data)

  return (
    <div>
      <ComponentPart slug={slug} indexing={indexing} />
    </div>
  );
}
