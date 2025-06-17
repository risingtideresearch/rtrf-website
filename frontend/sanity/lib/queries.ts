export const testQuery = `
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
