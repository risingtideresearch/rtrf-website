import {defineField, defineType} from 'sanity'
import {RiBook2Line} from 'react-icons/ri'
import { SYSTEM_ORDER } from '../consts'

export const sections = defineType({
  name: 'sections',
  type: 'document',
  icon: RiBook2Line,
  fields: [
    defineField({
      name: 'sections',
      type: 'array',
      of: [
        {
          type: 'section',
        }
      ],
      // Initialize with one entry per system
      initialValue: SYSTEM_ORDER.map((system) => ({
        _type: 'section',
        name: system,
        slug: {
          _type: 'slug',
          current: system.toLowerCase().replace(/\s+/g, '-')
        },
        articles: []
      })),
    })
  ],
  preview: {
    select: {
    },
    prepare({}) {
      return {
        title: 'Sections'
      }
    }
  }
})

export const section = defineType({
  name: 'section',
  type: 'object',
  icon: RiBook2Line,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: SYSTEM_ORDER,
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'articles',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'article',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      articles: 'articles'
    },
    prepare({title, articles}) {
      return {
        title: title,
        subtitle: `${articles?.length || 0} article(s)`
      }
    }
  }
})
