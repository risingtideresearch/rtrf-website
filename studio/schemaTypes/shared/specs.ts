import {defineField} from 'sanity'

export const specs = defineField({
  type: 'array',
  name: 'specs',
  title: 'Specs',
  options: {
    modal: {
      type: 'popover',
    },
  },
  of: [
    defineField({
      type: 'object',
      name: 'spec',
      options: {
        columns: 3,
      },
      fields: [
        defineField({
          name: 'key',
          type: 'string',
        }),
        defineField({
          name: 'value',
          type: 'string',
        }),
        defineField({
          name: 'unit',
          type: 'string',
          options: {
            layout: 'dropdown',
            list: [
              {
                title: 'in',
                value: 'in',
              },
              {
                title: 'cm',
                value: 'cm',
              },
              {
                title: 'mm',
                value: 'mm',
              },
              {
                title: 'lb',
                value: 'lb'
              },
              {
                title: 'W',
                value: 'W'
              }
            ],
          },
        }),
      ],
      preview: {
        select: {
          title: 'key',
          value: 'value',
          unit: 'unit'
        },
        prepare: ({title, value, unit}) => ({
          title: `${title} – ${value} ${unit || ''}`,
        }),
      },
    }),
  ],
})
