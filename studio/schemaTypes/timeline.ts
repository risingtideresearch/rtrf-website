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
        },
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
              subtitle: 'dates.start',
            },
          },
          fields: [
            defineField({
              name: 'title',
              type: 'string',
            }),
            defineField({
              name: 'dates',
              type: 'object',
              options: {
                columns: 2,
              },
              fields: [
                defineField({
                  name: 'start',
                  type: 'date',
                }),
                defineField({
                  name: 'end',
                  type: 'date',
                }),
              ],
            }),
            defineField({
              type: 'reference',
              name: 'location',
              to: [{type: 'location'}],
            }),
            defineField({
              type: 'array',
              name: 'media',
              of: [
                {
                  name: 'image',
                  type: 'image',
                }
              ]
            })
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
