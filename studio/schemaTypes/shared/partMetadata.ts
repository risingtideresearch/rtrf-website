import {defineField} from 'sanity'
// import {models} from './models'
import {scale} from './scale'
// import {schematics} from './schematics'
import {specs} from './specs'
import {documentation} from './documentation'
import models from './../../script_output/model_export_manifest.json';


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
  specs,
  // models,
  defineField({
    name: 'model',
    type: 'string',
    options: {
      layout: 'dropdown',
      list: models.exported_layers.map(layer => {
        return (
          {
            value: layer.layer_name,
            title: layer.layer_name,
          }
        )
      }),
    },
  }),
  // schematics,
  documentation,
]
