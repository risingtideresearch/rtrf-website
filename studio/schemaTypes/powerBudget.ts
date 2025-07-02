import {defineField, defineType} from 'sanity'
import {BoltIcon} from '@sanity/icons'

export const powerBudget = defineType({
  name: 'powerBudget',
  type: 'document',
  title: 'Power budget',
  icon: BoltIcon,
  fields: [
    defineField({
      type: 'reference',
      name: 'component',
      to: [
        {
          type: 'component',
        },
      ],
    }),

    defineField({
      type: 'string',
      name: 'voltage',
      initialValue: '48V',
      options: {
        list: [
          {
            value: '48V',
            title: '48V',
          },
          {
            value: '24V',
            title: '24V',
          },
          {
            value: '12V',
            title: '12V',
          },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      type: 'string',
      name: 'direction',
      initialValue: 'in',
      options: {
        list: [
          {
            value: 'in',
            title: 'In',
          },
          {
            value: 'out',
            title: 'Out',
          },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      type: 'string',
      name: 'maxContinuous',
    }),
    defineField({
      name: 'notes',
      type: 'array',
      title: 'Notes/sources',
      of: [
        defineField({
          type: 'block',
          name: 'child',
          styles: [],
        }),
      ],
    }),
    // documentation,
  ],
  preview: {
    select: {
      title: 'component.title',
      subtitle: 'component.component',
    },
  },
})
