import {defineField} from 'sanity'

export const models = defineField({
  type: 'array',
  name: 'models',
  title: '3D Models',
  of: [
    defineField({
      type: 'reference',
      name: 'model',
      to: [
        {
          type: 'model3d',
        },
      ],
    }),
  ],
})
