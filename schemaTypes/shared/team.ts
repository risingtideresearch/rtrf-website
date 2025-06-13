import { defineField } from "sanity";

export const team = defineField({
    type: 'reference',
    name: 'team',
    to: [
        {
            type: 'person',
        }
    ]
})
