import type {ListItemBuilder, StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) => {
  const notBoat = ['person', 'location', 'timeline']

  return S.list()
    .title('Content')
    .items([
      ...S.documentTypeListItems().filter(
        (d: ListItemBuilder) =>
          !notBoat.includes(d.getId() || '') && d.getId() != 'media.tag' && d.getId() != 'article',
      ),
      S.divider(),
      ...S.documentTypeListItems().filter((d: ListItemBuilder) =>
        notBoat.includes(d.getId() || ''),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter((d: ListItemBuilder) => d.getId() == 'article'),
    ])
}
