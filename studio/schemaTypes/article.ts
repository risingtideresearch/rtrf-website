import {defineField, defineType} from 'sanity'
import {link} from './shared/link'
import {RiArticleLine} from 'react-icons/ri'
import DrawingDropdownInput from '../components/DrawingDropdownInput'

export const article = defineType({
  name: 'article',
  type: 'document',
  icon: RiArticleLine,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'sections',
      type: 'array',
      of: [
        defineField({
          name: 'content',
          type: 'object',
          fields: [
            defineField({
              name: 'subtitle',
              type: 'string',
            }),
            defineField({
              name: 'sectionContent',
              type: 'array',
              of: [
                defineField({
                  type: 'block',
                  name: 'child',
                  styles: [],
                  // of: [
                  // ],
                }),
                // defineField({
                //   type: 'reference',
                //   name: 'plan',
                //   title: 'Schematic',
                //   to: [{type: 'schematic'}],
                // }),
                // defineField({
                //   type: 'reference',
                //   name: 'component',
                //   title: 'Component',
                //   to: [{type: 'component'}],
                // }),
                // defineField({
                //   type: 'reference',
                //   name: 'model3d',
                //   title: '3D Model',
                //   to: [{type: 'model3d'}],
                // }),
                defineField({
                  name: 'imageSet',
                  type: 'object',
                  fields: [
                    {
                      type: 'string',
                      name: 'caption'
                    },
                    defineField({
                      name: 'imageSet',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'drawingImage',
                          fields: [
                            defineField({
                              name: 'drawing',
                              type: 'string',
                              components: {
                                input: DrawingDropdownInput,
                              },
                            }),
                          ],
                        },
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // defineField({
    //   name: 'bibliography',
    //   type: 'array',
    //   of: [link],
    // }),
  ],
})
