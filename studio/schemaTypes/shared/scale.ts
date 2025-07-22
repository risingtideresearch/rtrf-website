import {defineField} from 'sanity'

export const scale = defineField({
  name: 'scale',
  type: 'string',
  description: 'Approximate size',
  options: {
    layout: 'radio',
    list: [
      {
        title: 'Large (10m)',
        value: '10m',
      },
      {
        title: 'Medium (1m)',
        value: '1m',
      },
      {
        title: 'Small (0.1m)',
        value: '0.1m',
      },
    ],
  },
})
