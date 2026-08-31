import {defineField, defineType} from 'sanity'
import {RiArticleLine} from 'react-icons/ri'
import {ChartUpwardIcon, CubeIcon, InlineIcon, PlayIcon} from '@sanity/icons'
import ModelDropdownInput from '../components/ModelDropdownInput'
import DrawingDropdownInput, {
  getDrawingId,
  getDrawingTitle,
} from '../components/DrawingDropdownInput'

export const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Story',
  icon: RiArticleLine,
  preview: {
    select: {
      title: 'title',
      isLive: 'isLive',
      publishDate: 'publishDate',
      publishedAt: '_publishedAt',
      updatedAt: '_updatedAt',
    },
    prepare({title, isLive, publishDate, publishedAt, updatedAt}) {
      const rawDate = publishDate || publishedAt || updatedAt
      const dateStr = rawDate
        ? new Date(publishDate ? publishDate + 'T00:00:00' : rawDate).toLocaleDateString(
            'en-US',
            {year: 'numeric', month: 'short', day: 'numeric'},
          )
        : null
      const status = isLive ? '● Live' : '○ In progress'
      return {
        title: title || 'Untitled',
        subtitle: dateStr && isLive ? `${status} · ${dateStr}` : status,
      }
    },
  },
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'publishDate',
      type: 'date',
      title: 'Publish date',
      description: 'Overrides the automatic publish date (_publishedAt) for display purposes.',
    }),
    defineField({
      name: 'isLive',
      type: 'boolean',
      description:
        'Toggle on to publish story content to the site. While this is off, only subtitle and associated models/materials will be visible for this story.',
    }),
    defineField({
      name: 'subtitle',
      type: 'text',
      rows: 3
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
      name: 'content',
      type: 'array',
      of: [
        defineField({
          type: 'block',
          name: 'child',
          styles: [{title: 'Heading', value: 'h2'}],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
              {
                name: 'internalLink',
                type: 'object',
                title: 'Link to another story',
                icon: RiArticleLine,
                fields: [
                  {
                    name: 'reference',
                    type: 'reference',
                    title: 'Reference',
                    to: [{type: 'article'}],
                  },
                ],
              },
            ],
          },
          of: [{name: 'personRef', type: 'reference', to: [{type: 'person'}]}],
        }),

        defineField({
          name: 'imageSet',
          type: 'object',
          icon: InlineIcon,
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
                  options: {
                    modal: {type: 'inline'},
                  },
                  fields: [
                    defineField({
                      name: 'drawing',
                      type: 'string',
                      components: {
                        input: DrawingDropdownInput,
                      },
                      validation: (rule) => rule.required(),
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
                    modal: {type: 'popover'},
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
            prepare({title, caption, imageSet}) {
              const imageCount = imageSet?.length || 0
              const pluralSuffix = imageCount === 1 ? '' : 's'

              return {
                title: title || 'Image Set',
                subtitle: `${imageCount} image${pluralSuffix}`,
                description: caption || '',
              }
            },
          },
        }),
        defineField({
          type: 'object',
          name: 'inlineImage',
          fields: [
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
              url: 'image.asset.url',
              title: 'image.asset.title',
            },
            prepare({url, title}) {
              return {
                media: (
                  <img
                    src={url}
                    alt={title || ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ),
                title,
                subtitle: 'Edit title in Media tab',
              }
            },
          },
        }),

        defineField({
          type: 'object',
          name: 'inlineVideo',
          title: 'Video',
          icon: PlayIcon,
          fields: [
            defineField({
              name: 'video',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              type: 'string',
              description: 'Optional. Defaults to the video title and date from the Media tab.',
            }),
          ],
          preview: {
            select: {
              url: 'video.asset.url',
              title: 'video.asset.title',
              filename: 'video.asset.originalFilename',
              caption: 'caption',
            },
            prepare({url, title, filename, caption}) {
              return {
                media: url ? (
                  <video
                    src={url}
                    preload="metadata"
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  PlayIcon
                ),
                title: title || filename || 'Video',
                subtitle: caption || 'Edit title, description and tags in Media tab',
              }
            },
          },
        }),

        defineField({
          name: 'inlineModel',
          type: 'object',
          icon: CubeIcon,
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'models',
              type: 'array',
              validation: (Rule) =>
                Rule.custom((models: string[] | undefined) => {
                  if (!models || models.length === 0) return true

                  // Check for empty values
                  const hasEmptyValues = models.some((model) => !model || model.trim() === '')
                  if (hasEmptyValues) {
                    return 'Empty values are not allowed'
                  }

                  // Check for duplicates
                  const seen = new Map<string, number>()
                  const duplicates: string[] = []

                  models.forEach((model) => {
                    const count = seen.get(model) || 0
                    seen.set(model, count + 1)
                    if (count === 1) {
                      duplicates.push(model)
                    }
                  })

                  if (duplicates.length > 0) {
                    return `Duplicate models found: ${duplicates.join(', ')}`
                  }

                  return true
                }),
              of: [
                defineField({
                  name: 'model',
                  type: 'string',
                  components: {
                    input: ModelDropdownInput,
                  },
                }),
              ],
            },
          ],
        }),
        defineField({
          name: 'chart',
          type: 'object',
          icon: ChartUpwardIcon,
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            defineField({
              name: 'type',
              type: 'string',
              options: {
                layout: 'dropdown',
                list: ['range chart'],
              },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'relatedModels',
      type: 'array',
      title: 'Related 3D model layers',
      options: {
        layout: 'list',
      },
      description:
        'By default, entire section will be shown (e.g. Propulsion) or use this list to override models shown',
      validation: (Rule) =>
        Rule.custom((models: string[] | undefined) => {
          if (!models || models.length === 0) return true

          // Check for empty values
          const hasEmptyValues = models.some((model) => !model || model.trim() === '')
          if (hasEmptyValues) {
            return 'Empty values are not allowed'
          }

          // Check for duplicates
          const seen = new Map<string, number>()
          const duplicates: string[] = []

          models.forEach((model) => {
            const count = seen.get(model) || 0
            seen.set(model, count + 1)
            if (count === 1) {
              duplicates.push(model)
            }
          })

          if (duplicates.length > 0) {
            return `Duplicate models found: ${duplicates.join(', ')}`
          }

          return true
        }),
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
      name: 'hideMaterials',
      title: "Hide Materials Table",
      type: 'boolean',
      description: 'Materials table derived from 3D model layers above will display at end of story. Toggle on to hide.',
    }),
  ],
})
