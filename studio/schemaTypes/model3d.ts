import {defineField, defineType} from 'sanity'
import {CubeIcon} from '@sanity/icons'

export const model3d = defineType({
  name: 'model3d',
  type: 'document',
  title: '3D Model',
  icon: CubeIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
    }),

    defineField({
      type: 'file',
      name: 'model',
      description: 'GLTF model',
      options: {
        accept: 'model/gltf+json',
      },
    }),
  ],
})
