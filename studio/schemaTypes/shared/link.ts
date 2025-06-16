import { defineField } from "sanity";

export const link = defineField({
  type: 'object',
  name: 'link',
  fields: [
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'label',
      type: 'string',
    }),
  ],
})
