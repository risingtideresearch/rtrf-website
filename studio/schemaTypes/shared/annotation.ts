import {defineField} from 'sanity'

export const annotations = defineField({
  type: 'array',
  name: 'annotations',
  description: 'Annotations',
  options: {
    insertMenu: {
      showIcons: true,
    },
  },
  of: [
    defineField({
      type: 'object',
      name: 'annotation',
      fields: [
        defineField({
          type: 'block',
          name: 'child',
          styles: [],
          // of: [
          // ],
        }),
      ],
    }),
  ],
})
