import {defineType, defineField} from 'sanity'
import {GrLocationPin} from 'react-icons/gr'

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
      type: 'object',
      name: 'location',
      options: {
        columns: 2,
      },
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number',
          validation: (rule) =>
            rule.required().custom((lng) => {
              if (typeof lng === 'undefined') return true // Allow undefined if not required
              if (lng < -90 || lng > 90) return 'Longitude must be between -180 and 180'
              return true
            }),
        },
        {
          name: 'lng',
          title: 'Longitude',
          type: 'number',
          validation: (rule) =>
            rule.required().custom((lng) => {
              if (typeof lng === 'undefined') return true // Allow undefined if not required
              if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180'
              return true
            }),
        },
      ],
    }),
  ],
})
