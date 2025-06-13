import {defineField} from 'sanity'

export const schematics = defineField({
  type: 'array',
  name: 'schematics',
  of: [
    defineField({
      type: 'reference',
      name: 'schematic',
      to: [
        {
          type: 'schematic',
        },
      ],
    }),
  ],
})
