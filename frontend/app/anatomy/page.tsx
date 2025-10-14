import { promises as fs } from "fs";
import path from "path";
import { fetchAnnotations } from "@/sanity/lib/utils";
import Anatomy from "./Anatomy";
import TableOfContents from "@/app/toc/TableOfContents";
import Navigation from "../components/Navigation";
import styles from "./page.module.scss";

export default async function Page() {
  const annotations = await fetchAnnotations();

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

  return (
    <div className={styles.page}>
      <TableOfContents
        modes={["system", "material"]}
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
