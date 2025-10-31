import { promises as fs } from "fs";
import path from "path";
import {
  fetchAnnotations,
  fetchArticles,
  fetchSections,
} from "@/sanity/lib/utils";
import Anatomy from "./Anatomy";
import TableOfContents from "@/app/toc/TableOfContents";
import styles from "./page.module.scss";
import Navigation from "../components/Navigation";

export type Article = {
  title: string;
  slug: string;
  relatedModels: Array<string>;
};

type GLBExportMetadata = {
  filename: string;
}

export interface AnatomyContent {
  annotations: Array<unknown>;
  articles: Array<Article>;
  models_manifest: {
    exported_layers: Array<GLBExportMetadata>,
    export_info: {
      timestamp_end: string;
    };
  };
  materials_index: {
    material_index: {
      [key: string]: Array<string>;
    };
  };
}

export default async function Page() {
  const modelsManifestPath = path.join(
    process.cwd(),
    "public/models/export_manifest.json",
  );
  const modelsManifestData = await fs.readFile(modelsManifestPath, "utf8");
  const models_manifest = JSON.parse(modelsManifestData);

  const annotations = await fetchAnnotations(models_manifest);

  const materialsIndexPath = path.join(
    process.cwd(),
    "public/script-output/material_index_simple.json",
  );
  const materialsIndexData = await fs.readFile(materialsIndexPath, "utf8");
  const materials_index = JSON.parse(materialsIndexData) || {};

  const sections = await fetchSections();
  const articles = await fetchArticles();

  console.log(articles);

  return (
    <div className={styles.page}>
      <TableOfContents
        sections={sections?.data.sections || []}
        modes={["system", "material"]}
        materials={materials_index.unique_materials}
      >
        <Navigation />
        <Anatomy
          content={{
            annotations: [], //annotations.data,
            articles: articles?.data || [],
            models_manifest: models_manifest,
            materials_index: materials_index,
          }}
        />
      </TableOfContents>
    </div>
  );
}
