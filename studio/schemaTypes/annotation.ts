import {defineField, defineType} from 'sanity'
import { RiStickyNoteLine} from 'react-icons/ri'

export const annotation = defineType({
  name: 'annotation',
  type: 'document',
  icon:  RiStickyNoteLine,
  fields: [
    // defineField({
    //   name: 'sections',
    //   type: 'array',
    //   of: [
        // defineField({
        //   type: 'block',
        //   name: 'child',
        //   styles: [],
        //   // of: [
        //   // ],
        // }),
        defineField({
          name: "note",
          type: "text"
        }),
        defineField({
          name: "position",
          type: "object",
          options: {
            columns: 3
          },
          fields: [
            {
              name: 'x',
              type: 'number',
            },
            {
              name: 'y',
              type: 'number',
            },
            {
              name: 'z',
              type: 'number',
            }
          ]
        })
    //   ],
    // }),
    // defineField({
    //   name: 'bibliography',
    //   type: 'array',
    //   of: [link],
    // }),
  ],
  preview: {
    select: {
      title: 'note',
    },
    prepare: ({title}) => ({
      title: `${title.slice(0, 30)}...`,
    }),
  },
})
