import AnatomyHierarchy from "@/app/components/AnatomyHierarchy"
import ComponentPart from "@/app/components/ComponentMetadata"
 
// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  return (
    <div>
      <ComponentPart slug={slug} />
    </div>
  )
}
