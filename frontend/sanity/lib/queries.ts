/**
 *
 */
export const anatomyQuery = `
*[_type=="anatomy"]{
    _id,
    title,
    "slug": slug.current,
    parent->{
        _id,
        title,
        "slug": slug.current,
    },
    parts[]->{
        _id,
        title,
        _type,
        componentPart,
        "slug": slug.current,
        "connections":*[
          _type == "connection" &&
          (references(^._id))
        ]{
          _id,
          _type,
          description,
          componentFrom->{
            "slug": slug.current,
            title,
            "anatomy":*[
              _type == "anatomy" &&
              (references(^._id))
            ]{
              _id,
              title,  
              "slug": slug.current,
            },
            _id,
            _type
          },
          componentTo->{
            "slug": slug.current,
            title,
            "anatomy":*[
              _type == "anatomy" &&
              (references(^._id))
            ]{
              _id,
              title,  
              "slug": slug.current,
            },
            _id,
            _type
          }
        },
    },
    schematics[]->{
      ...,
      layers[]{
        ...,
        "image": photo.asset->{
          metadata,
          url
        },
        part->
      }
    }
}   
`;

/**
 *
 */
export const allPartsQuery = `
*[_type in ["component"]]{
  ...,
  "slug": slug.current,
  "image": image.asset->{
    metadata,
    url
  },
  "anatomy": *[
    _type == "anatomy" &&
    (references(^._id))
  ]{
    _id,
  },
  "connections": *[
    _type == "connection" &&
    (references(^._id))
  ]{
    _id,
    _type,
    description,
    componentFrom->{
      "slug": slug.current,
      title,
      _id,
      _type
    },
    componentTo->{
      "slug": slug.current,
      title,
      _id,
      _type
    }
  }
}
`;

/**
 *
 */
export const connectionsQuery = `
*[_type=="connection"] {
    title,
    description,
    componentFrom->{
        ...
    },
    componentTo->{
        ...
    },
}
`;

/**
 *
 */
export const schematicsQuery = `
*[_type=="schematic"]{
    _id,
    title,
    part->,
    layers[]{
        layerName,
        photo{
            asset->{...}
        }
    }
}   
`;

/**
 *
 */
export const annotationsQuery = `
*[_type=="annotation"]{
    _id,
    system,
    note,
    position,
    related[],
    relatedModels[]
}   
`;

/**
 *
 * 
    "articles": *[_type=="article" && references(^._id)]{
      _id,
      title,
      "slug": slug.current,
      isLive,
      "system": *[_type=="systems"][0].systems[references(^._id)][0] {
        name,
        "slug": slug.current
      }
    }
 */
export const peopleQuery = `
*[_type=="person"]{
    ...,
    image {
      ...,
      asset -> {
        ...,
        
        metadata {
          ...,
        }
      }
    },
    "articlesAsAuthor": *[_type=="article" && isLive == true && ^._id in authors[]->_id]{
      _id,
      title,
      "slug": slug.current,
      _updatedAt,
      "effectiveDate": coalesce(publishDate, _updatedAt),
      "system": *[_type=="systems"][0].systems[references(^._id)][0],
    },
    "articlesMentioned": *[_type=="article" && isLive == true && references(^._id) && !defined(authors[_ref == ^.^._id][0])]{
      _id,
      title,
      "slug": slug.current,
      _updatedAt,
      "effectiveDate": coalesce(publishDate, _updatedAt),
      "system": *[_type=="systems"][0].systems[references(^._id)][0],
    }
}   
`;

/**
 * Videos are file assets uploaded through the Media tab (see studio/schemaTypes/fileAsset.ts).
 */
const videoFilter = `_type == "sanity.fileAsset" && mimeType match "video/*"`;

const videoAssetFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  url,
  mimeType,
  size,
  originalFilename,
  title,
  description,
  altText,
  date,
  startTime,
  endTime,
  "tags": opt.media.tags[]->name.current
`;

/**
 *
 */
export const articlesQuery = (slug?: string) => {
  if (slug) {
    return `*[_type=="article" && slug.current == "${slug}"]{
      ...,
      "effectiveDate": coalesce(publishDate, _updatedAt),
      isLive,
      hideMaterials,
      "system": *[_type=="systems"][0].systems[references(^._id)][0],
      authors[]->{
        name,
        slug,
        role,
        image {
          ...,
          asset -> {
            ...,
            
            metadata {
              ...,
            }
          }
        }
      },
      content[]{
        ...,
        children[]{
          ...,
          _type == 'personRef' => @->{
            ...
          }
        },
        markDefs[]{
          ...,
          _type == 'internalLink' => {
            ...,
            reference->{
              _type,
              _id,
              title,
              slug
            }
          }
        },
        _type == 'inlineImage' => {
          ...,
          image {
            ...,
            asset -> {
              ...,
              metadata {
                ...,
              }
            }
          }
        },
        _type == 'inlineVideo' => {
          ...,
          video {
            ...,
            asset -> {
              ${videoAssetFields}
            }
          }
        },
        _type == 'imageSet' => {
          ...,
          imageSet[]{
            ...,
            _type == 'image' => {
              ...,
              asset->{
                ...,
                metadata{
                  ...,
                  exif {
                    DateTimeOriginal,
                    DateTimeDigitized,
                  }
                }
              }
            },
            _type == 'drawingImage' => {
              ...,
              "drawingData": *[_type == 'media.tag' && name.current == ^.drawing][0]{
                ...,
                "asset": asset->
              }
            }
          }
        },
      }
    }`;
  }
  return `*[_type=="article"]{
    _id,
    _updatedAt,
    "effectiveDate": coalesce(publishDate, _publishedAt),
    title,
    relatedModels[],
    isLive,
    hideMaterials,
    "slug": slug.current,
    "system": *[_type=="systems"][0].systems[references(^._id)][0] {
      name,
      "slug": slug.current
    },
    content[]{
      _type == 'imageSet' => {
        ...,
        imageSet[]{
          _type == 'drawingImage' => {
            ...,
          }
        }
      },
    }
  }`;
};

export const systemsQuery = (slug?: string) => {
  if (slug) {
    return `
    *[_type=="systems"][0]{
      ...,
      systems[slug.current == "${slug}"][0]{
        ...,
        "slug": slug.current,
        articles[]->{
          _id,
          _updatedAt,
          "effectiveDate": coalesce(publishDate, _publishedAt),
          title,
          subtitle,
          isLive,
          "slug": slug.current,
          relatedModels[],
          "system": ^.slug.current
        }
      }
    }`;
  }
  return `
  *[_type=="systems"][0]{
    systems[]{
      _key,
      name,
      "slug": slug.current,
      articles[]->{
        _id,
        _updatedAt,
        "effectiveDate": coalesce(publishDate, _publishedAt),
        title,
        subtitle,
        isLive,
        "slug": slug.current,
        relatedModels[],
      }
    }
  }`;
};

/**
 *
 * @returns
 */
export const peoplePageQuery = `
*[_type=="homepage"][0]{
  "description": sectionDescriptions.people
}
`;

export const storiesPageQuery = `
*[_type=="homepage"][0]{
  "description": sectionDescriptions.stories
}
`;

export const homepageQuery = () => {
  return `
  *[_type=="homepage"][0]{
    ...,
    image {
      ...,
      asset -> {
        ...,
        metadata {
          ...,
        }
      }
    },
  }`;
};

/**
 * Minimal query used to assign story ID
 */
export const systemArticleOrderQuery = () => {
  return `
  *[_type=="systems"][0]{
    ...,
    systems[]{
      ...,
      "slug": slug.current,
      articles[]->{
        _id,
        "slug": slug.current,
      }
    }
  }`;
};

/**
 *
 */
export const materialsQuery = () => {
  return `
  *[_type=="materials"][0]{
    ...,
    
  }`;
};

/**
 *
 */
export const componentPartQuery = () => `
 *[_type=="component" && defined(relatedModel)]{
    componentPart,
    title,
    relatedModel,
  }`;
// export const componentPartQuery = (slug: string) => `
// {
//   "component": *[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0] {
//     ...,
//     "slug": slug.current,
//     "image": image.asset-> {
//         metadata,
//         url,
//     },
//     materials[]-> {
//       ...
//     }
//   },
//   "connections": *[
//     _type =="connection" &&
//     references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
//   ] {
//     _type,
//     description,
//     componentFrom->{
//         "slug": slug.current,
//         title,
//         _type,
//         _id,
//     },
//     componentTo->{
//         "slug": slug.current,
//         title,
//         _type,
//         _id,
//     }
//   },
//   "anatomy": *[
//     _type =="anatomy" &&
//     references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
//   ] {
//     _type,
//     title,
//     "slug": slug.current,
//   },
//   "powerBudget": *[
//     _type =="powerBudget" &&
//     references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
//   ] {
//     ...
//   },
//   "timelines": *[
//     _type =="timeline" &&
//     references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
//   ] {
//     ...,
//     timeline[] {
//       ...,
//       media[] {
//         asset->{
//           url,
//           metadata
//         }
//       }
//     }
//   }
// }

// `;

/**
 * Articles in system order with image and video refs extracted from content, for gallery/navigation ordering.
 */
export const photoOrderQuery = `
*[_type == "systems"][0]{
  systems[]{
    "slug": slug.current,
    articles[]->{
      _id,
      "imageRefs": content[_type == 'imageSet'].imageSet[_type == 'image'].asset._ref + content[_type == 'inlineImage'].image.asset._ref,
      "videoRefs": content[_type == 'inlineVideo'].video.asset._ref
    }
  }
}
`;

export const searchQuery = () => `
*[
  (_type == "article" || _type == "person" || (_type == "sanity.imageAsset" && (count(*[_type == "article" && isLive == true && references(^._id)]) > 0 || count(*[_type == "homepage" && references(^._id)]) > 0) && !("no-gallery" in coalesce(opt.media.tags[]->name.current, [])))
    || (${videoFilter} && (count(*[_type == "article" && isLive == true && references(^._id)]) > 0 || count(opt.media.tags) > 0) && !("no-gallery" in coalesce(opt.media.tags[]->name.current, []))))
  && (
    title match $query + "*" ||
    name match $query + "*" ||
    description match $query + "*" ||
    content[].children[].text match $query + "*" ||
    content[].children[]->name match $query + "*" ||
    authors[]->.name match $query + "*"
  )
][0...30]{
  _id,
  _type,
  _type == "article" => {
    title,
    slug,
    authors[]->{
      name
    },
    "system": *[_type == "systems"][0].systems[references(^._id)][0] {
      name,
      "slug": slug.current
    }
  },
  _type == "sanity.imageAsset" => {
    title,
    originalFilename,
    _id,
    url,
    "thumbnailUrl": url + "?w=128&h=128&fit=crop"
  },
  _type == "sanity.fileAsset" => {
    title,
    originalFilename,
    _id,
    url,
    mimeType
  },
  _type == "person" => {
    "title": name,
    _id,
    "slug": slug.current,
    "thumbnailUrl": image.asset->url + "?w=128&h=128&fit=crop"
  }
}`;

/**
 *
 */
export const allPhotosQuery = (system?: string, isPreview = false) => {
  const liveFilter = isPreview ? "" : " && isLive == true";

  const articleFilter = system
    ? `*[_type == "article"${liveFilter} && references(^._id) && _id in *[_type == "systems"][0].systems[slug.current == "${system}"].articles[]._ref]`
    : `*[_type == "article"${liveFilter} && references(^._id)]`;

  const articleFilterNoLive = system
    ? `*[_type == "article" && references(^._id) && _id in *[_type == "systems"][0].systems[slug.current == "${system}"].articles[]._ref]`
    : `*[_type == "article" && references(^._id)]`;

  const taggedNoStoryCondition = system
    ? ` || ("${system}" in coalesce(opt.media.tags[]->name.current, []) && count(${articleFilterNoLive}) == 0)`
    : ` || (count(opt.media.tags) > 0 && count(${articleFilterNoLive}) == 0 && count(*[_type == "homepage" && references(^._id)]) == 0)`;

  return `*[_type == "sanity.imageAsset" && (count(${articleFilter}) > 0${taggedNoStoryCondition}) && !("no-gallery" in coalesce(opt.media.tags[]->name.current, []))] | order(coalesce(date, metadata.exif.DateTimeOriginal, _createdAt) asc) {
  _id,
  url,
  originalFilename,
  metadata,
  title,
  "photoDate": coalesce(date, metadata.exif.DateTimeOriginal),
  "usedInArticles": ${articleFilter} {
    _id,
    title,
    "slug": slug.current,
    "system": *[_type == "systems"][0].systems[references(^._id)][0] {
      name,
      "slug": slug.current
    }
  }
}`;
};

/**
 *
 */
export const assetWithNavigationQuery = (idPrefix?: string) => {
  const articleFilter = `*[_type == "article" && references(^._id)]`;

  return `{
  "allImages": *[_type == "sanity.imageAsset" && (count(*[_type == "article" && references(^._id)]) > 0 || (count(opt.media.tags) > 0 && !("no-gallery" in coalesce(opt.media.tags[]->name.current, []))))] | order(coalesce(date, metadata.exif.DateTimeOriginal, _createdAt) asc) {
    _id,
    url,
    originalFilename,
    "metadata": {
      "dimensions": {
        ...metadata.dimensions,
      },
      "date": coalesce(date, metadata.exif.DateTimeOriginal)
    },
    description,
    altText,
    title,
    "tags": opt.media.tags[]->name.current,
    "taggedSystem": *[_type == "systems"][0].systems[slug.current in ^.opt.media.tags[]->name.current][0] {
      name,
      "slug": slug.current
    },
    "usedInArticles": ${articleFilter} {
      _id,
      title,
      "slug": slug.current,
      "system": *[_type == "systems"][0].systems[references(^._id)][0] {
        name,
        "slug": slug.current
      }
    }
  },
  "currentId": "${idPrefix}"
}`;
};

/**
 * Every video asset, for static params.
 */
export const allVideosQuery = `*[${videoFilter}]{ _id }`;

/**
 * Videos shown in a system's photo gallery: same rules as allPhotosQuery —
 * used in a (live) story in that system, or tagged with the system and not
 * used in any story. Tagged with "no-gallery" hides them.
 */
export const galleryVideosQuery = (system?: string, isPreview = false) => {
  const liveFilter = isPreview ? "" : " && isLive == true";

  const articleFilter = system
    ? `*[_type == "article"${liveFilter} && references(^._id) && _id in *[_type == "systems"][0].systems[slug.current == "${system}"].articles[]._ref]`
    : `*[_type == "article"${liveFilter} && references(^._id)]`;

  const articleFilterNoLive = system
    ? `*[_type == "article" && references(^._id) && _id in *[_type == "systems"][0].systems[slug.current == "${system}"].articles[]._ref]`
    : `*[_type == "article" && references(^._id)]`;

  const taggedNoStoryCondition = system
    ? ` || ("${system}" in coalesce(opt.media.tags[]->name.current, []) && count(${articleFilterNoLive}) == 0)`
    : ` || (count(opt.media.tags) > 0 && count(${articleFilterNoLive}) == 0)`;

  return `*[${videoFilter} && (count(${articleFilter}) > 0${taggedNoStoryCondition}) && !("no-gallery" in coalesce(opt.media.tags[]->name.current, []))] | order(coalesce(date, _createdAt) asc) {
  ${videoAssetFields},
  "photoDate": date,
  "usedInArticles": ${articleFilter} {
    _id,
    title,
    "slug": slug.current,
    "system": *[_type == "systems"][0].systems[references(^._id)][0] {
      name,
      "slug": slug.current
    }
  }
}`;
};

/**
 * All videos with everything the /video/[uuid] page needs, ordered oldest first.
 */
export const videoWithNavigationQuery = (idPrefix?: string) => {
  const articleFilter = `*[_type == "article" && references(^._id)]`;

  return `{
  "allVideos": *[${videoFilter}] | order(coalesce(date, _createdAt) asc) {
    ${videoAssetFields},
    "taggedSystem": *[_type == "systems"][0].systems[slug.current in ^.opt.media.tags[]->name.current][0] {
      name,
      "slug": slug.current
    },
    "usedInArticles": ${articleFilter} {
      _id,
      title,
      "slug": slug.current,
      "system": *[_type == "systems"][0].systems[references(^._id)][0] {
        name,
        "slug": slug.current
      }
    }
  },
  "currentId": "${idPrefix}"
}`;
};

export const firstArticleQuery = `
*[_type=="systems"][0].systems[0].articles[0]->{
  title,
  "slug": slug.current,
  _updatedAt,
  "effectiveDate": coalesce(publishDate, _updatedAt),
  authors[]->{
    name,
    "slug": slug.current
  }
}
`;

export const systemNamesQuery = `
*[_type=="systems"][0].systems[]{
  name,
  "slug": slug.current
}
`;

export const latestArticlesQuery = `
*[_type == "article" && isLive == true && _id != *[_type=="systems"][0].systems[0].articles[0]->_id] | order(coalesce(publishDate, _updatedAt) desc) [0..2] {
  _id,
  _updatedAt,
  "effectiveDate": coalesce(publishDate, _updatedAt),
  title,
  subtitle,
  "slug": slug.current
}`;
