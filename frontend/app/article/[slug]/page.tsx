import { promises as fs } from "fs";
import path from "path";
import { fetchArticles, fetchSections } from "@/sanity/lib/utils";
import Navigation from "../../components/Navigation";
import Article from "../../articles/Article";
import { matchArticleDrawings } from "@/app/articles/util";

export default async function Page({ params }) {
  const { slug } = await params;
  const { data } = await fetchArticles(slug);
  const sections = await fetchSections();

  const drawingsPath = path.join(
    process.cwd(),
    "public/drawings/output_images/conversion_manifest.json"
  );
  const drawingsData = await fs.readFile(drawingsPath, "utf8");
  const drawings = JSON.parse(drawingsData);

  const modelsManifestPath = path.join(
    process.cwd(),
    "public/models/export_manifest.json"
  );
  const modelsManifestData = await fs.readFile(modelsManifestPath, "utf8");
  const models_manifest = JSON.parse(modelsManifestData);

  const getArticleNavigation = (sections: any, currentSlug: string) => {
    const allArticles = sections?.sections.flatMap((section: any) =>
      (section.articles || []).map((article: any) => ({
        ...article,
        sectionName: section.name,
        sectionSlug: section.slug,
      }))
    );

    const currentIndex = allArticles?.findIndex(
      (article: any) => article.slug === currentSlug
    );

    if (currentIndex === undefined || currentIndex === -1) {
      return { prev: null, next: null, current: null };
    }

    return {
      current: allArticles[currentIndex],
      prev:
        currentIndex > 0
          ? allArticles[currentIndex - 1]
          : allArticles[allArticles.length - 1],
      next:
        currentIndex < allArticles.length - 1
          ? allArticles[currentIndex + 1]
          : allArticles[0],
    };
  };

  const navigation = getArticleNavigation(sections.data, slug);

  const dataWithMatchedDrawings = matchArticleDrawings(
    drawings.files,
    data[0] || {}
  );

  if (!dataWithMatchedDrawings.relatedModels) {
    dataWithMatchedDrawings.relatedModels = models_manifest.exported_layers
      .filter(
        (layer) =>
          layer.filename &&
          layer.file_size < 3000000 &&
          (dataWithMatchedDrawings.section == "overview" ||
            layer.filename.split("__")[0].toLowerCase() ==
              dataWithMatchedDrawings.section)
      )
      .map((layer) => layer.filename);
  }

  dataWithMatchedDrawings.relatedModels = Array.from(
    new Set(dataWithMatchedDrawings.relatedModels)
  );

  return (
    <div>
      <Navigation forceNav={true} />
      <Article data={dataWithMatchedDrawings} navigation={navigation} />
    </div>
  );
}
