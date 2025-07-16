import ComponentPart from "@/app/_components/ComponentMetadata";
import { fetchHierarchyWithIndexing } from "@/app/_util/utils";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { componentIndex } = await fetchHierarchyWithIndexing();

  return (
    <div>
      <ComponentPart slug={slug} componentIndex={componentIndex} />
    </div>
  );
}
