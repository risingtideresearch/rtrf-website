import {defineField, defineType} from 'sanity'
import { CogIcon } from '@sanity/icons';

export const material = defineType({
  name: 'material',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
    }),
  ],
})
