export const hierarchyQuery = `
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
    }
}   
`;

export const allPartsQuery = `
*[_type in ["customPart", "component"]]{
  ...,
  "slug": slug.current,
  "image": image.asset->{
    metadata,
    url
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

export const schematicsQuery = `
*[_type=="schematic"]{
    _id,
    title,
    layers[]{
        layerName,
        photo{
            asset->{...}
        }
    }
}   
`;

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
    },
    componentTo->{
        "slug": slug.current,
        title,
        _type,
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
