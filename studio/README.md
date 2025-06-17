# Rising Tide Sanity CMS
Codebase for https://rising-tide.sanity.studio

## Local development

### Add .env file
Make a copy of .env.example and add to the top level directory as .env. Once you are added to the Sanity project, the project ID can be found in https://www.sanity.io/manage → Rising Tide Boat Works → project id. Anything prefixed with `SANITY_STUDIO` will be deployed to production.

```
SANITY_STUDIO_PROJECT_ID="<paste your project ID here>" # Required - The ID of your Sanity project
SANITY_STUDIO_DATASET="production" # Required - The dataset of your Sanity project
SANITY_STUDIO_PREVIEW_URL="" #Optional - defaults to http://localhost:3000
SANITY_STUDIO_STUDIO_HOST="" #Optional
```

### Install dependencies and run locally
```bash
npx install
```

```bash
npm run dev
```

This will serve the project from http://localhost:3333/.

### Deploy from command line
```
npx sanity deploy
```
