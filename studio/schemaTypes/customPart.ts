import {defineField, defineType} from 'sanity'
import {AsteriskIcon} from '@sanity/icons'
import {documentation} from './shared/documentation'
import {team} from './shared/team'
import { models } from './shared/models'
import { schematics } from './shared/schematics'

export const customPart = defineType({
  name: 'customPart',
  type: 'document',
  title: 'Custom part',
  icon: AsteriskIcon,
  description: 'Bespoke component part',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      description: 'Name',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 200, 
        slugify: (input) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    }),
    defineField({
      type: 'array',
      name: 'componentParts',
      of: [
        defineField({
          type: 'reference',
          name: 'component',
          to: [
            {
              type: 'component',
            },
          ],
        }),
      ],
    }),
    defineField({
      type: 'array',
      name: 'materials',
      of: [
        defineField({
          type: 'reference',
          name: 'material',
          to: [
            {
              type: 'material',
            },
          ],
        }),
      ],
    }),
    team,
    defineField({
      type: 'image',
      name: 'image',
    }),
    // defineField({
    //     type: 'url',
    //     name: 'url',
    //     title: 'URL',
    // }),
    // defineField({
    //     type: 'text',
    //     name: 'description',
    // }),
    models,
    schematics,
    documentation,
  ],
  // preview: {
  //   select: {
  //     title: 'title',
  //     subtitle: 'componentPart',
  //     anatomy: 'anatomy.title',
  //     media: 'image',
  //   },
  //   prepare: ({title, subtitle, media, anatomy}) => ({
  //     title,
  //     subtitle: `${subtitle}`,
  //     media,
  //     description: anatomy ? `(${anatomy})` : ''
  //   }),
  // },
})
