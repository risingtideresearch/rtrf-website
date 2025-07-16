import {defineField, defineType} from 'sanity'
import {TiersIcon} from '@sanity/icons'

export const schematic = defineType({
  name: 'schematic',
  type: 'document',
  icon: TiersIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      type: 'array',
      name: 'layers',
      of: [
        defineField({
          type: 'object',
          name: 'layer',
          preview: {
            select: {
              partTitle: 'part.title',
              layerName: 'layerName',
              photo: 'photo',
            },
            prepare({partTitle, layerName, photo}) {
              return {
                title: partTitle || 'No part title',
                subtitle: layerName || '',
                media: photo, // This will be the layer's image
              }
            },
          },
          fields: [
            defineField({
              name: 'layerName',
              type: 'string',
            }),
            defineField({
              type: 'reference',
              name: 'part',
              to: [
                {
                  type: 'component',
                },
                {
                  type: 'customPart',
                },
              ],
            }),
            defineField({
              name: 'photo',
              type: 'image',
            }),
          ],
        }),
      ],
    }),
  ],
})
