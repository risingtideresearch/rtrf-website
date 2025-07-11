import AnatomyHierarchy from "@/app/components/AnatomyHierarchy";
import PartCatalog from "../components/PartCatalog";

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div>
      <PartCatalog />
    </div>
  );
}
