import {defineField} from 'sanity'
import {link} from './link'

export const documentation = defineField({
  type: 'array',
  name: 'documentation',
  description: 'Reference materials',
  // options: {
  //   insertMenu: {
  //     showIcons: true,
  //   },
  // },
  of: [
    defineField({
      type: 'file',
      name: 'documentation',
    }),
    defineField({
      type: 'image',
      name: 'image',
    }),
    link,
  ],
})
