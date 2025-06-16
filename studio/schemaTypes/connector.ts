import {defineField, defineType} from 'sanity'
import {SchemaIcon} from '@sanity/icons'
import { documentation } from './shared/documentation'

export const connector = defineType({
  name: 'connector',
  type: 'document',
  title: 'Connector',
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
    documentation,
  ],
  preview: {
    select: {
      from: 'componentFrom.componentPart',
      fromCustom: 'componentFrom.title',
      to: 'componentTo.componentPart',
      toCustom: 'componentTo.title',
    },
    prepare: ({from, to, fromCustom, toCustom}) => ({
      title: `${from || fromCustom} to ${(to || toCustom).toLowerCase()}`,
    }),
  },
})
