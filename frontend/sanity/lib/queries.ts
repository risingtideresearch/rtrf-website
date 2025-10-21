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

export const materialsQuery = `
*[_type=="material"] {
    name,
    aka[]
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
 */
export const articlesQuery = (slug?: string) => {
  if (slug) {
    return `*[_type=="article" && slug.current == "${slug}"]{
      ...,
      "section": *[_type=="sections"][0].sections[references(^._id)][0].name,
      content[]{
        ...,
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
                    // DateTime,
                    // Make,          // Camera manufacturer
                    // Model,         // Camera model
                    // LensModel,
                    // FNumber,       // Aperture
                    // ExposureTime,
                    // ISO,
                    // FocalLength
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
    ...,
    "section": *[_type=="sections"][0].sections[references(^._id)][0].name
  }`;
};

/**
 *
 */
export const sectionsQuery = (slug?: string) => {
  if (slug) {
    return `
    *[_type=="sections"][0]{
      ...,
      sections[slug.current == "${slug}"][0]{
        ...,
        "slug": slug.current,
        articles[]->{
          _id,
          title,
          "slug": slug.current,
        }
      }
    }`;
  }
  return `
  *[_type=="sections"][0]{
    ...,
    sections[]{
      ...,
      "slug": slug.current,
      articles[]->{
        _id,
        title,
        "slug": slug.current,
      }
    }
  }`;
};

/**
 *
 */
export const componentPartQuery = (slug: string) => `
{
  "component": *[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0] {
    ...,
    "slug": slug.current,
    "image": image.asset-> {
        metadata,
        url,
    },
    materials[]-> {
      ...
    }
  },
  "connections": *[
    _type =="connection" &&
    references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
  ] {
    _type,
    description,
    componentFrom->{
        "slug": slug.current,
        title,
        _type,
        _id,
    },
    componentTo->{
        "slug": slug.current,
        title,
        _type,
        _id,
    }
  },
  "anatomy": *[
    _type =="anatomy" &&
    references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
  ] {
    _type,
    title,
    "slug": slug.current,
  },
  "powerBudget": *[
    _type =="powerBudget" &&
    references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
  ] {
    ...
  },
  "timelines": *[
    _type =="timeline" &&
    references(*[(_type in ["customPart", "component"]) && slug.current == "${slug}"][0]._id)
  ] {
    ...,
    timeline[] {
      ...,
      media[] {
        asset->{
          url,
          metadata
        }
      }
    }
  }
}

`;
