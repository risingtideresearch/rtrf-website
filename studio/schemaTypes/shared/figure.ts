import { defineField } from "sanity";

export const figure = defineField({
  type: 'object',
  name: 'figure',
  fields: [
    defineField({
      type: 'array',
      name: 'layers',
      of: [
        defineField({
          type: 'object',
          name: 'layer',
          fields: [
            defineField({
              name: 'caption',
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
