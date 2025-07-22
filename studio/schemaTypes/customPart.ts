import {defineField, defineType} from 'sanity'
import {AsteriskIcon} from '@sanity/icons'
import {documentation} from './shared/documentation'
import {team} from './shared/team'
import { models } from './shared/models'
import { schematics } from './shared/schematics'
import { partMetadata } from './shared/partMetadata'

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
    ...partMetadata,
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
