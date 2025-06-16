import {defineType, defineField} from 'sanity'
import {TimelineIcon} from '@sanity/icons'

export const timeline = defineType({
  name: 'timeline',
  type: 'document',
  icon: TimelineIcon,
  fields: [
    defineField({
      type: 'reference',
      name: 'parent',
      to: [
        {
          type: 'boat',
        },
        {
          type: 'customPart',
        },
        {
          type: 'anatomy',
        }
      ],
    }),
    defineField({
      type: 'array',
      name: 'timeline',
      of: [
        defineField({
          type: 'object',
          name: 'event',
          preview: {
            select: {
                title: 'title',
                subtitle: 'date',
            },
          },
          fields: [
            defineField({
              name: 'title',
              type: 'string',
            }),
            defineField({
              name: 'date',
              type: 'date',
            }),
            defineField({
              type: 'reference',
              name: 'location',
              to: [{type: 'location'}],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'parent.title',
    },
  },
})
