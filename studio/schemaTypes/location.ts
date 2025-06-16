import {defineType, defineField} from 'sanity'
import { GrLocationPin } from "react-icons/gr";

export const location = defineType({
  name: 'location',
  type: 'document',
  icon: GrLocationPin,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
    }),

    defineField({
      type: 'geopoint',
      name: 'location',
      options: {
        
      }
    }),
  ],
})
