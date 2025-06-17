# Rising Tide website UI

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

- [Next.js Documentation](https://nextjs.org/docs)
- [the Next.js GitHub repository](https://github.com/vercel/next.js)

## Local development

### Add .env file
Make a copy of .env.example and add to the top level directory as .env. Once you are added to the Sanity project, the project ID can be found in https://www.sanity.io/manage → Rising Tide Research Foundation → project id.

Read token can be created under Rising Tide Research Foundation → API → Tokens.

```
NEXT_PUBLIC_SANITY_PROJECT_ID="<paste your project here>" # Required - The ID of your Sanity project
NEXT_PUBLIC_SANITY_DATASET="production" # Required - The dataset of your Sanity project
NEXT_PUBLIC_SANITY_API_VERSION="2024-10-28" # Optional - The API version provided to the Sanity Client
NEXT_PUBLIC_SANITY_STUDIO_URL="" #Optional, defaults to http://localhost:3333
SANITY_API_READ_TOKEN="<paste your token here>" # Required - The read token for your Sanity project
```

### Install dependencies and run locally
```bash
npx install
```

```bash
npm run dev
```

This will serve the project from [http://localhost:3000](http://localhost:3000).
