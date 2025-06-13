import {defineField, defineType} from 'sanity'
import {ColorWheelIcon} from '@sanity/icons'
import {documentation} from './shared/documentation'
import { models } from './shared/models'
import { schematics } from './shared/schematics'

export const component = defineType({
  name: 'component',
  type: 'document',
  title: 'Component part',
  icon: ColorWheelIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      description: 'Manufacturer and model name',
    }),
    defineField({
      type: 'string',
      name: 'componentPart',
      title: 'Component part',
      description: 'Type of component',
    }),
    defineField({
      type: 'image',
      name: 'image',
    }),
    models,
    schematics,
    // defineField({
    //     type: 'url',
    //     name: 'url',
    //     title: 'URL',
    // }),
    // defineField({
    //     type: 'text',
    //     name: 'description',
    // }),
    documentation,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'componentPart',
      media: 'image',
    },
    prepare: ({title, subtitle, media}) => ({
      title,
      subtitle: `${subtitle}`,
      media,
    }),
  },
})
