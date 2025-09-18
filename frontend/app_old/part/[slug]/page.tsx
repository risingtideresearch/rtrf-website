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
    <div style={{maxWidth: '1200px', padding: '5rem',  margin: '3rem 0 0 auto'}}>
      <ComponentPart slug={slug} componentIndex={componentIndex} />
    </div>
  );
}
