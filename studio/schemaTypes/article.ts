import {defineField, defineType} from 'sanity'
import {RiArticleLine} from 'react-icons/ri'
import ModelDropdownInput from '../components/ModelDropdownInput'
import DrawingDropdownInput, {
  getDrawingId,
  getDrawingTitle,
} from '../components/DrawingDropdownInput'

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
      name: 'authors',
      type: 'array',
      of: [
        defineField({
          name: 'author',
          type: 'reference',
          to: [
            {
              type: 'person',
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'relatedModels',
      type: 'array',
      title: 'Related 3D model layers',
      description:
        'By default, entire section will be shown (e.g. Propulsion) or use this list to override models shown',
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
          of: [{name: 'personRef', type: 'reference', to: [{type: 'person'}]}],
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
              validation: (rule) => rule.required().min(1),
              of: [
                {
                  type: 'object',
                  name: 'drawingImage',
                  title: 'Drawing',
                  fields: [
                    defineField({
                      name: 'drawing',
                      type: 'string',
                      components: {
                        input: DrawingDropdownInput,
                      },
                    }),
                  ],
                  preview: {
                    select: {
                      drawing: 'drawing',
                    },
                    prepare({drawing}) {
                      return {
                        title: getDrawingTitle(drawing),
                        subtitle: getDrawingId(drawing),
                      }
                    },
                  },
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
        defineField({
          type: 'object',
          name: 'inlineImage',
          fields: [
            defineField({
              type: 'boolean',
              name: 'fullBleed',
            }),
            defineField({
              name: 'image',
              type: 'image',
              options: {
                hotspot: true,
                metadata: ['blurhash', 'lqip', 'palette', 'exif', 'location'],
              },
            }),
          ],
          preview: {
            select: {
              media: 'image',
            },
          },
        }),
      ],
    }),
  ],
})
