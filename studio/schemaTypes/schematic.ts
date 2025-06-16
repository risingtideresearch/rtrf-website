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
          fields: [
            defineField({
              name: 'layerName',
              type: 'string',
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
