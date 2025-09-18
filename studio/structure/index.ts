import type {ListItemBuilder, StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) => {
  const notBoat = ['person', 'location', 'timeline']
  const textDocs = ['article', 'annotation']

  return S.list()
    .title('Content')
    .items([
      ...S.documentTypeListItems().filter(
        (d: ListItemBuilder) =>
          !notBoat.includes(d.getId() as string) &&
          !textDocs.includes(d.getId() as string) &&
          d.getId() != 'media.tag',
      ),
      S.divider(),
      ...S.documentTypeListItems().filter((d: ListItemBuilder) =>
        notBoat.includes(d.getId() as string),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter((d: ListItemBuilder) =>
        textDocs.includes(d.getId() as string),
      ),
    ])
}
