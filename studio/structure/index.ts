import type {ListItemBuilder, StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) => {
  const notBoat = ['person', 'location', 'timeline']
  const textDocs = ['article', 'annotation'] 
  const singletons = ['sections'] 

  return S.list()
    .title('Content')
    .items([
      ...S.documentTypeListItems().filter((d: ListItemBuilder) =>
        textDocs.includes(d.getId() as string),
      ),
      // Singleton section
      S.listItem()
        .title('Sections')
        .id('sections')
        .child(
          S.document()
            .schemaType('sections')
            .documentId('sections')
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (d: ListItemBuilder) =>
          !notBoat.includes(d.getId() as string) &&
          !textDocs.includes(d.getId() as string) &&
          !singletons.includes(d.getId() as string) && // Filter out singletons
          d.getId() != 'media.tag',
      ),
      S.divider(),
      ...S.documentTypeListItems().filter((d: ListItemBuilder) =>
        notBoat.includes(d.getId() as string),
      ),
    ])
}
