import {defineField, defineType} from 'sanity'
import {SchemaIcon} from '@sanity/icons'
import {documentation} from './shared/documentation'

export const connection = defineType({
  name: 'connection',
  type: 'document',
  title: 'Connection',
  icon: SchemaIcon,
  fields: [
    // defineField({
    //   type: 'string',
    //   name: 'title',
    // }),
    defineField({
      type: 'reference',
      name: 'componentFrom',
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
      type: 'reference',
      name: 'componentTo',
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
      type: 'text',
      name: 'description',
    }),
    defineField({
      type: 'array',
      name: 'using',
      of: [
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
      ],
    }),
    documentation,
  ],
  preview: {
    select: {
      from: 'componentFrom.title',
      to: 'componentTo.title',
    },
    prepare: ({from, to}) => ({
      title: `${from} to ${to.toLowerCase()}`,
    }),
  },
})
