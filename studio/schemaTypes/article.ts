import {defineField, defineType} from 'sanity'
import {RiArticleLine} from 'react-icons/ri'
import ModelDropdownInput from '../components/ModelDropdownInput'
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
      name: 'subtitle',
      type: 'text',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      validation: (Rule) => Rule.required(),
      options: {
        source: 'title',
      },
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
    defineField({
      name: 'content',
      type: 'array',
      of: [
        defineField({
          type: 'block',
          name: 'child',
          styles: [{title: 'Heading 2', value: 'h2'}],
        }),
        defineField({
          name: 'imageSet',
          type: 'object',
          fields: [
             {
              type: 'string',
              name: 'title',
            },
            {
              type: 'string',
              name: 'caption',
            },
            defineField({
              name: 'imageSet',
              type: 'array',
              description: 'Set of drawings and/or images',
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
                defineField({
                  type: 'image',
                  name: 'image',
                  options: {
                    hotspot: true,
                    metadata: ['blurhash', 'lqip', 'palette', 'exif', 'location'],
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'title',
              caption: 'caption',
              imageSet: 'imageSet',
            },
            prepare({caption, title, imageSet}) {
              const imageCount = imageSet?.length || 0
              const pluralSuffix = imageCount === 1 ? '' : 's'

              return {
                title: title || 'Image Set',
                subtitle: `${imageCount} image${pluralSuffix}`,
              }
            },
          },
        }),
      ],
    }),
  ],
})
