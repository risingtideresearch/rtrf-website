# Rising Tide Sanity CMS
Codebase for https://rising-tide.sanity.studio

## Local development

### Add .env file
This should be in the top level directory. Once you are added to the Sanity project, the API key can be found in https://www.sanity.io/manage --> Rising Tide Boat Works --> project id. Anything prefixed with `SANITY_STUDIO` will be deployed to production.

```
SANITY_STUDIO_PROJECT_ID=<project_id>
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
