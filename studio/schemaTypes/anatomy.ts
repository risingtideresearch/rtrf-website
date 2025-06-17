import {defineField, defineType} from 'sanity'
import {VersionsIcon} from '@sanity/icons'
import { schematics } from './shared/schematics'
import { models } from './shared/models'

// Install lucide.dev icons with "npm install lucide-react"
// import {TagIcon} from 'lucide-react'

export const anatomy = defineType({
  name: 'anatomy',
  title: 'Anatomy',
  type: 'document',
  icon: VersionsIcon,
  description: 'Anatomical part or system with component parts',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'anatomy'}],
      description: 'Is this a child of another anatomical system?',
      options: {
        filter: ({document}) => {
          return {
            filter: '!defined(parent) && _rev != $rev',
            params: {
              rev: document._rev,
            },
          }
        },
      },
    }),
    defineField({
      name: 'boat',
      type: 'reference',
      to: [{type: 'boat'}],
    }),
    defineField({
      name: 'parts',
      type: 'array',
      description: 'Custom and component parts',
      of: [
        {
          type: 'reference',
          name: 'part',
          // preview: {},
          to: [
            {
              type: 'customPart',
            },
            {
              type: 'component',
            },
          ],
        },
      ],
    }),
    schematics,
    models,
  ],
  orderings: [
    {
      title: 'Name',
      name: 'byName',
      by: [
        {
          field: 'title',
          direction: 'asc',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      boat: 'boat.title',
      subtitle: 'parent.title',
    },
    prepare: ({title, subtitle, boat}) => ({
      title: `${boat || ''} ${title}`,
      subtitle: subtitle ? `— ${subtitle}` : '',
    }),
  },
})
