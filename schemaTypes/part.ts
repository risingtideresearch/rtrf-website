import {defineField, defineType} from 'sanity'

export const schematic = defineType({
  name: 'schematic',
  type: 'document',
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
          name: 'photo',
          type: 'image',
        }),
      ],
    }),
  ],
})
