import { createDataAttribute, CreateDataAttributeProps } from "next-sanity";
import { dataset, projectId, studioUrl } from "./api";
import {
  allPhotosQuery,
  allVideosQuery,
  annotationsQuery,
  articlesQuery,
  assetWithNavigationQuery,
  componentPartQuery,
  firstArticleQuery,
  homepageQuery,
  latestArticlesQuery,
  materialsQuery,
  peoplePageQuery,
  peopleQuery,
  storiesPageQuery,
  photoOrderQuery,
  systemNamesQuery,
  systemsQuery,
  galleryVideosQuery,
  videoWithNavigationQuery,
} from "./queries";
import { sanityFetch, sanityFetchStatic } from "./live";

export async function fetchAnnotations(models_manifest) {
  let { data } = await sanityFetch({ query: annotationsQuery });

  data = data.map((annotation, i) => ({
    ...annotation,
    // check sanity content against current model manifest
    relatedModels: annotation.relatedModels.filter((model) => {
      return models_manifest.exported_layers.find(
        (file) => file.filename == model,
      );
    }),
    i: i + 1,
  }));

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchArticles(slug?: string) {
  const { data } = await sanityFetch({ query: articlesQuery(slug) });

  return { data };
}

export async function fetchArticlesStatic(slug?: string) {
  const { data } = await sanityFetchStatic({ query: articlesQuery(slug) });
  return { data };
}

export async function fetchFirstArticle(): Promise<{ title: string; slug: string; _updatedAt: string; effectiveDate: string; authors: { name: string; slug: string }[] } | null> {
  const { data } = await sanityFetch({ query: firstArticleQuery });
  return data ?? null;
}

/**
 *
 * @returns
 */
export async function fetchMaterials() {
  const { data } = await sanityFetch({ query: materialsQuery() });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchSystems(slug?: string) {
  const { data } = await sanityFetch({ query: systemsQuery(slug) });

  data.systems?.forEach((section, i) => {
    section.articles.forEach((article, j) => {
      article.articleId = `${i + 1}–${String.fromCharCode(65 + j)}`
    })
  });

  return { data };
}

export async function fetchArticleIdMap(): Promise<Record<string, string>> {
  const { data } = await fetchSystems();
  const map: Record<string, string> = {};
  data?.systems?.forEach((system: { articles?: { _id: string }[] }, sysIdx: number) => {
    system.articles?.forEach((article: { _id: string }, artIdx: number) => {
      map[article._id] = `${sysIdx + 1}\u2013${String.fromCharCode(65 + artIdx)}`;
    });
  });
  return map;
}

export async function fetchSystemsStatic(slug?: string) {
  const { data } = await sanityFetchStatic({ query: systemsQuery(slug) });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchPhotos(section?: string) {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_SITE === "true";
  const { data } = await sanityFetch({ query: allPhotosQuery(section, isPreview) });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchPhotosStatic(section?: string) {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_SITE === "true";
  const { data } = await sanityFetchStatic({ query: allPhotosQuery(section, isPreview) });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchPhotoOrder() {
  const { data } = await sanityFetch({ query: photoOrderQuery });
  return { data };
}

/**
 *
 * @returns
 */
export async function fetchAssetWithNavigation(idPrefix: string) {
  const { data } = await sanityFetch({
    query: assetWithNavigationQuery(idPrefix),
  });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchVideosStatic() {
  const { data } = await sanityFetchStatic({ query: allVideosQuery });

  return { data };
}

/**
 * Videos that belong in a system's photo gallery.
 */
export async function fetchVideos(section?: string) {
  const isPreview = process.env.NEXT_PUBLIC_PREVIEW_SITE === "true";
  const { data } = await sanityFetch({ query: galleryVideosQuery(section, isPreview) });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchVideoWithNavigation(idPrefix: string) {
  const { data } = await sanityFetch({
    query: videoWithNavigationQuery(idPrefix),
  });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchPeople() {
  const { data } = await sanityFetch({ query: peopleQuery });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchPeoplePage() {
  const { data } = await sanityFetch({ query: peoplePageQuery });

  return { data };
}

export async function fetchStoriesPage() {
  const { data } = await sanityFetch({ query: storiesPageQuery });

  return { data };
}

/**
 *
 * @returns
 */
export async function fetchHomepage() {
  const { data } = await sanityFetch({ query: homepageQuery() });

  return { data };
}

/**
 *
 */
export async function fetchTableOfContents() {
  const { data } = await sanityFetch({ query: systemsQuery() });

  return data;
}

/**
 *
 * @returns
 */
export async function fetchComponents() {
  const { data } = await sanityFetch({ query: componentPartQuery() });

  return { data };
}

export async function fetchSystemNames(): Promise<Array<{ name: string; slug: string }>> {
  const { data } = await sanityFetch({ query: systemNamesQuery });
  return data as Array<{ name: string; slug: string }>;
}

/**
 * Fetch the 3 most recently published articles for use in the footer
 */
export async function fetchLatestArticles() {
  const { data } = await sanityFetch({ query: latestArticlesQuery });
  return data as Array<{
    _id: string;
    title: string;
    subtitle: string;
    slug: string;
    effectiveDate: string | null;
    _updatedAt: string;
  }>;
}

type DataAttributeConfig = CreateDataAttributeProps &
  Required<Pick<CreateDataAttributeProps, "id" | "type" | "path">>;

export function dataAttr(config: DataAttributeConfig) {
  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
  }).combine(config);
}
