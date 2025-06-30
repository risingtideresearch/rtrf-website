import {defineField} from 'sanity'

export const specs = defineField({
  type: 'array',
  name: 'specs',
  title: 'Specs',
  of: [
    defineField({
      type: 'object',
      name: 'spec',
      fields: [
        defineField({
          name: 'key',
          type: 'string',
        }),
        defineField({
          name: 'value',
          type: 'string',
        }),
      ],
    }),
  ],
})
