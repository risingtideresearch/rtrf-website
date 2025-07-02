import {defineField, defineType} from 'sanity'
import { TbSpeedboat } from "react-icons/tb";

export const boat = defineType({
  name: 'boat',
  type: 'document',
  title: 'Boat',
  icon: TbSpeedboat,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Name',
    }),
    // defineField({
    //   type: 'image',
    //   name: 'image',
    // }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare: ({title, media}) => ({
      title,
      media,
    }),
  },
})
