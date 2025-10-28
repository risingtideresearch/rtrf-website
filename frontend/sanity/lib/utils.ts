import { createDataAttribute, CreateDataAttributeProps } from "next-sanity";
import { dataset, projectId, studioUrl } from "./api";
import { annotationsQuery, articlesQuery, peopleQuery, sectionsQuery } from "./queries";
import { sanityFetch } from "./live";

export async function fetchAnnotations(models_manifest) {
  let { data } = await sanityFetch({ query: annotationsQuery });

  data = data.map((annotation, i) => ({
    ...annotation,
    // check sanity content against current model manifest
    relatedModels: annotation.relatedModels.filter((model) => {
      return models_manifest.exported_layers.find(
        (file) => file.filename == model
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

/**
 *
 * @returns
 */
export async function fetchSections(slug?: string) {
  const { data } = await sanityFetch({ query: sectionsQuery(slug) });

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
 */
export async function fetchTableOfContents() {
  const { data } = await sanityFetch({ query: sectionsQuery() });

  return data;
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
