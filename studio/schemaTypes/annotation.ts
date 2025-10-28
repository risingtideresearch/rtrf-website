import {defineField, defineType} from 'sanity'
import {RiStickyNoteLine} from 'react-icons/ri'
import DrawingDropdownInput from '../components/DrawingDropdownInput'
import { SYSTEM_ORDER } from '../consts'
import ModelDropdownInput from '../components/ModelDropdownInput'

export const annotation = defineType({
  name: 'annotation',
  type: 'document',
  icon: RiStickyNoteLine,
  fields: [
    defineField({
      name: 'note',
      type: 'text',
    }),
    defineField({
      name: 'system',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: SYSTEM_ORDER
      }
    }),
    defineField({
      name: 'position',
      type: 'object',
      options: {
        columns: 3,
      },
      fields: [
        {
          name: 'x',
          description: 'Stern -11 to bow 0',
          type: 'number',
        },
        {
          name: 'y',
          description: 'Deck 3 to keel -3',
          type: 'number',
        },
        {
          name: 'z',
          description: 'Port -3 to starboard 3',
          type: 'number',
        },
      ],
    }),
    defineField({
      name: 'related',
      type: 'array',
      title: 'Related drawings',
      of: [
        defineField({
          name: 'drawing',
          type: 'string', 
          components: {
            input: DrawingDropdownInput, 
          },
        }),
      ],
    }),
    defineField({
      name: 'relatedModels',
      type: 'array',
      title: 'Related 3D model layers',
      of: [
        defineField({
          name: 'model',
          type: 'string', 
          components: {
            input: ModelDropdownInput, 
          },
        }),
      ],
    }),
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
