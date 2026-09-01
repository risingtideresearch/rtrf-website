import { fetchArticles, fetchArticlesStatic, fetchFirstArticle, fetchSystems } from "@/sanity/lib/utils";
import Article from "../Article";
import { matchArticleDrawings } from "@/app/stories/util";
import { getReducedModelSet } from "@/app/utils";
import Navigation, { URLS } from "@/app/components/Navigation/Navigation";
import SubNav from "@/app/components/Navigation/SubNav";
import { notFound } from "next/navigation";
import { Model } from "@/app/anatomy/three-d/util";
import {
  getDrawingsManifest,
  getMaterialsManifest,
  getModelManifest,
} from "@/app/manifest-util";
import { Metadata } from "next";
import { SITE_URL } from "@/app/consts";
import { getStoryStill } from "@/app/manifest-util";

export async function generateStaticParams() {
  const articles = await fetchArticlesStatic();

  return articles.data.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const [{ data }, firstArticle] = await Promise.all([
    fetchArticles(slug),
    fetchFirstArticle(),
  ]);

  if (!data || data.length === 0) {
    return {
      title: "Article Not Found | Solander 38",
      description: "",
    };
  }

  const article = data[0];
  const isFirstArticle = firstArticle?.slug === slug;
  const preview = getStoryStill(article.slug?.current ?? slug, "preview");

  return {
    title: isFirstArticle ? article.title : `${article.title} | Solander 38`,
    description: article.subtitle || "",
    icons: `${SITE_URL}/rising-tide.svg`,
    authors: article.authors?.map(author => ({name: author.name})),
    publisher: 'Rising Tide Research Foundation',
    openGraph: {
      type: 'article',
      description: article.subtitle || "",
      modifiedTime: article.effectiveDate ?? article._updatedAt,
      images: [
        {
          url: `${SITE_URL}${preview.src}`,
          width: preview.width,
          height: preview.height,
          alt: `Model of ${article.title}`
        },
      ],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { data } = await fetchArticles(slug);
  const systems = await fetchSystems();

  if (!data[0]) {
    notFound();
  }
  const drawings = getDrawingsManifest();

  const models_manifest = getModelManifest();

  const getArticleNavigation = (systems: any, currentSlug: string) => {
    const allArticles = systems?.systems.flatMap((system: any) =>
      (system.articles || []).map((article: any) => ({
        ...article,
        systemName: system.name,
        systemSlug: system.slug,
      })),
    );

    const currentIndex = allArticles?.findIndex(
      (article: any) => article.slug === currentSlug,
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

  const navigation = getArticleNavigation(systems.data, slug);

  const dataWithMatchedDrawings = matchArticleDrawings(
    drawings.files,
    data[0] || {},
  );

  if (!dataWithMatchedDrawings.relatedModels) {
    const articleSystem = (
      dataWithMatchedDrawings.system?.slug?.current || ""
    ).replace(" & ", "_");

    const models =
      articleSystem == "overview"
        ? getReducedModelSet(models_manifest.exported_layers as unknown as Model[], true)
        : models_manifest.exported_layers.filter((layer) => {
            if (!layer.filename || layer.file_size > 8000000) {
              return false;
            }
            const system = layer.filename.split("__")[0].toLowerCase();

            return system == articleSystem;
          });
    dataWithMatchedDrawings.relatedModels = models.map(
      (layer) => layer.filename,
    );
  }
  const materials_index = getMaterialsManifest();

  const getMaterials = (acc, layer) => {
    materials_index.material_index[layer]?.forEach((material) => {
      acc.add(material);
    });
    return acc;
  };
  const relatedMaterials = dataWithMatchedDrawings.relatedModels.reduce(
    getMaterials,
    new Set(),
  );

  dataWithMatchedDrawings.relatedModels = Array.from(
    new Set(dataWithMatchedDrawings.relatedModels),
  ).filter((model) => {
    const exists = models_manifest.exported_layers.find(
      (layer) => layer.filename == model,
    );
    if (!exists) {
      console.warn(`${model} specified in CMS, not found in manifest`);
    }
    return exists;
  });

  dataWithMatchedDrawings.articleId = systems.data.systems
    .map((system) => system.articles)
    .flat()
    .find((article) => article._id == dataWithMatchedDrawings._id)?.articleId;

  return (
    <>
      <Navigation
        type={"top-bar"}
        active={URLS.STORIES}
        story={slug}
        system={
          dataWithMatchedDrawings?.system
            ? dataWithMatchedDrawings.system.slug?.current
            : null
        }
      />
      <SubNav
        prev={navigation.prev}
        next={navigation.next}
        urlPrefix="/stories"
        idKey="slug"
      />
      <Article
        data={dataWithMatchedDrawings}
        materials={Array.from(relatedMaterials)}
      />

      <SubNav
        prev={navigation.prev}
        next={navigation.next}
        noBorderBottom={true}
        urlPrefix="/stories"
        idKey="slug"
      />
    </>
  );
}
