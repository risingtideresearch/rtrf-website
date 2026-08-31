import {defineField, defineType} from 'sanity'

/**
 * Extends Sanity's built-in file asset document. Videos are uploaded as file
 * assets through the Media tab and carry the same title / description / tags
 * as photos; these fields add what a video needs on top of that.
 */
export const fileAsset = defineType({
  name: 'sanity.fileAsset',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'When the video was recorded',
    }),
    defineField({
      name: 'startTime',
      title: 'Start time (seconds)',
      type: 'number',
      description: 'Playback starts here instead of at the beginning of the file',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'endTime',
      title: 'End time (seconds)',
      type: 'number',
      description: 'Playback stops here instead of at the end of the file',
      validation: (rule) =>
        rule.min(0).custom((endTime, context) => {
          const startTime = (context.document as {startTime?: number} | undefined)?.startTime
          if (endTime != null && startTime != null && endTime <= startTime) {
            return 'End time must be after start time'
          }
          return true
        }),
    }),
  ],
})
