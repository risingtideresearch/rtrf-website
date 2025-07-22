import {defineField, defineType} from 'sanity'
import {ColorWheelIcon} from '@sanity/icons'
import { partMetadata } from './shared/partMetadata'

export const component = defineType({
  name: 'component',
  type: 'document',
  title: 'Component part',
  icon: ColorWheelIcon,
  description: 'Off the shelf part',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      description: 'Type of component',
    }),
    defineField({
      type: 'string',
      name: 'componentPart',
      title: 'Component part',
      description: 'Manufacturer and model name',
    }),
    ...partMetadata,
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
