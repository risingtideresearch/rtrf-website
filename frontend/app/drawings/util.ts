import { Article } from "@/sanity/sanity.types";

/**
 *
 */
export type DrawingsArticleDictionary = {
  [key: string]: Array<{
    slug: string;
    title: string;
    _id: string;
    section: {
      slug: string;
      name: string;
    };
  }>;
};

export function getDrawingArticleDictionary(
  articles: Array<Article>,
): DrawingsArticleDictionary {
  const dictionary = {};

  articles.forEach((article) => {
    article.content?.forEach((p) => {
      if (p.imageSet) {
        p.imageSet?.forEach((item) => {
          if (item._type == "drawingImage") {
            if (!dictionary[item.drawing]) {
              dictionary[item.drawing] = [];
            }
            dictionary[item.drawing].push({
              slug: article.slug,
              title: article.title,
              system: article.system,
              _id: article._id,
            });
          }
        });
      }
    });
  });

  return dictionary;
}

export function getSlugFromDrawingGroup(group: string): string {
  return group.replace(" & ", "-").replaceAll(" ", "-");
}
