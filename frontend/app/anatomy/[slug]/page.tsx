import { promises as fs } from "fs";
import path from "path";
import TableOfContents from "@/app/toc/TableOfContents";
import { fetchAnnotations, fetchSections } from "@/sanity/lib/utils";
import Anatomy from "../Anatomy";
import Navigation from "@/app/components/Navigation";
import styles from "./../page.module.scss";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const modelsManifestPath = path.join(
    process.cwd(),
    "public/models/export_manifest.json"
  );
  const modelsManifestData = await fs.readFile(modelsManifestPath, "utf8");
  const models_manifest = JSON.parse(modelsManifestData);

  const materialsIndexPath = path.join(
    process.cwd(),
    "public/script-output/material_index_simple.json"
  );
  const materialsIndexData = await fs.readFile(materialsIndexPath, "utf8");
  const materials_index = JSON.parse(materialsIndexData) || {};

  const annotations = await fetchAnnotations(models_manifest);

  const sections = await fetchSections();

  return (
    <div className={styles.page}>
      <TableOfContents
        sections={sections?.data.sections || []}
        modes={["system", "material"]}
        defaultSystem={slug}
        materials={materials_index.unique_materials}
      >
        <Navigation />
        <Anatomy
          content={{
            annotations: annotations.data,
            models_manifest: models_manifest,
            materials_index: materials_index,
          }}
        />
      </TableOfContents>
    </div>
  );
}
