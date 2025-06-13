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
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      description: 'Name',
    }),
    // defineField({
    //   type: 'string',
    //   name: 'componentPart',
    //   title: 'Component part',
    //   description: 'Type of component'
    // }),
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
