import { promises as fs } from "fs";
import path from "path";
import TableOfContents from "@/app/toc/TableOfContents";
import Drawings from "../../Drawings";
import Navigation from "@/app/components/Navigation";
import { fetchSections } from "@/sanity/lib/utils";

export async function generateStaticParams() {
  const drawingsPath = path.join(
    process.cwd(),
    "public/drawings/output_images/conversion_manifest.json"
  );

  const drawingsData = await fs.readFile(drawingsPath, "utf8");

  const drawings = JSON.parse(drawingsData);

  return drawings.files.map((d) => ({
    slug: d.uuid,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const drawingsPath = path.join(
    process.cwd(),
    "public/drawings/output_images/conversion_manifest.json"
  );

  const drawingsData = await fs.readFile(drawingsPath, "utf8");

  const drawings = JSON.parse(drawingsData);
  
  const sections = await fetchSections();

  return (
    <>
      <TableOfContents sections={sections.data?.sections || []}>
        <Navigation />
        <main style={{ paddingLeft: "16.5rem" }}>
          <Drawings
            drawings={drawings}
            defaultUUID={slug}
          />
        </main>
      </TableOfContents>
    </>
  );
}
