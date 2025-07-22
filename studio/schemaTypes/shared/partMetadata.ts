import {defineField} from 'sanity'
import {link} from './link'
import {models} from './models'
import {scale} from './scale'
import {schematics} from './schematics'
import {specs} from './specs'
import {documentation} from './documentation'

/**
 * Shared metadata fields between component and custom parts
 */
export const partMetadata = [
  defineField({
    name: 'slug',
    type: 'slug',
    options: {
      source: 'title',
      maxLength: 200,
      slugify: (input) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
    },
  }),
  scale,
  defineField({
    type: 'image',
    name: 'image',
  }),
  defineField({
    type: 'number',
    name: 'count',
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
  link,
  specs,
  models,
  schematics,
  documentation,
]
