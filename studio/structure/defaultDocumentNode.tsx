import {type DefaultDocumentNodeResolver} from 'sanity/structure'
import DocumentsPane from 'sanity-plugin-documents-pane'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  switch (schemaType) {
    case `component`:
    case `customPart`:
      return S.document().views([
        S.view.form(),
        S.view
          .component(DocumentsPane)
          .options({
            query: `*[(_type in ["anatomy", "connection", "timeline", "material"]) && references($id)]`,
            params: {id: `_id`},
            options: {perspective: 'previewDrafts'},
          })
          .title('Part of'),
      ])
    case `model3d`:
    case `schematic`:
      return S.document().views([
        S.view.form(),
        S.view
          .component(DocumentsPane)
          .options({
            query: `*[(_type == "anatomy") && references($id)]`,
            params: {id: `_id`},
            options: {perspective: 'previewDrafts'},
          })
          .title('Part of'),
      ])
    case `article`:
      return S.document().views([
        S.view.form(),
        S.view
          .component(DocumentsPane)
          .options({
            query: `*[(_type == "sections") && references($id)]`,
            params: {id: `_id`},
            options: {perspective: 'drafts'},
          })
          .title('Part of'),
      ])
    default:
      return S.document().views([S.view.form()])
  }
}
