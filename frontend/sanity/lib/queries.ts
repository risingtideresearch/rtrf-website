export const hierarchyQuery = `
*[_type=="anatomy"]{
    _id,
    title,
    parent->{
        _id,
        title,
    },
    parts[]->{
        _id,
        title,
        componentPart,
    }
}   
`;

export const connectorsQuery = `
*[_type=="connector"] {
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
