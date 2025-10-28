import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {media} from 'sanity-plugin-media'
import {sanityComputedField} from 'sanity-plugin-computed-field'
import {defaultDocumentNode} from './structure/defaultDocumentNode'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Rising Tide Research Foundation',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '',
  dataset: 'production',

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    visionTool(),
    media(),
    sanityComputedField(),
  ],

  mediaLibrary: {
    enabled: false,
  },

  form: {
    image: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.map((assetSource) => {
          if (assetSource.name === 'sanity-default') {
            return {
              ...assetSource,
              options: {
                ...assetSource.options,
                metadata: ['exif', 'location', 'lqip', 'palette'],
              },
            }
          }
          return assetSource
        })
      },
    },
  },

  schema: {
    types: schemaTypes,
  },
})
