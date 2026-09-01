# Solander 38 website UI

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

- [Next.js Documentation](https://nextjs.org/docs)
- [the Next.js GitHub repository](https://github.com/vercel/next.js)

## Local development

### Add .env file
Copy `.env.example` to `.env` and fill in the values. Project ID: [sanity.io/manage](https://sanity.io/manage) → Rising Tide Research Foundation. Read token: Sanity → API → Tokens.

### Install dependencies and run locally
```bash
yarn install
```

```bash
npm run dev
```

This will serve the project from [http://localhost:3000](http://localhost:3000).

### Dev notes
`page.tsx` is a reserved filename used in routing, e.g. `anatomy/[slug]/page.tsx`.

## Regenerating model stills

```bash
npm run stills
```

Re-renders every still that shows the 3D model, so they stay in sync after a
Rhino re-export:

| Output | Size | Used by |
|--|--|--|
| `public/homepage/solander-38-*.png` | 1200×900 | homepage anatomy crossfade — transparent, sits on `.bg--grid` |
| `public/thumbs/<story-slug>.png` | 800×420 | stories index hover cards — transparent, no logo |
| `public/preview/<story-slug>.png` | 1600×840 | story preview / Open Graph — grid background and RTRF logo |

Each story is rendered once; the thumbnail and the framed preview are both
written from that single render.

The script drives the real `/anatomy` route in a headless browser rather than
re-rendering the scene separately, so stills always match the site. It runs
`npm run build`, serves the result on a free port, and shuts that server down
when it finishes. Stills always come from a production build — `next dev`
renders these pages several times slower and does not reliably survive a full
run.

```bash
npm run stills                                 # build, then every shot
npm run stills:fast                            # same, against the last build
npm run stills:fast -- --only=battery          # one shot, by name or slug
npm run stills -- --dry-run                    # list shots, outputs and URLs
npm run stills -- --homepage-only              # or --stories-only
npm run stills -- --headed                     # watch it render
npm run stills -- --base=http://localhost:3000 # a server you are running
```

`stills:fast` is `--skip-build`: it reuses whatever is in `.next`, so run it
after a build when iterating. If no build exists it builds anyway rather than
failing. Pair it with `--only=<name>` for a ~10s round trip on a single image.

Stories are discovered from `/stories`, so a new article only needs its
`relatedModels` set in Sanity. The homepage tiles are editorial views and are
listed in `scripts/stills.config.mjs` — camera angle, zoom, clipping, layer
filtering and transparency are all pinned there.

Any shot can be opened by hand for tuning — append the same params to an
`/anatomy` URL, e.g.
`/anatomy/body?capture=1&w=1200&h=900&dpr=2&clip=0.2,1&axis=z`. Parameters are
documented in `app/anatomy/capture.ts`.

Note that the clipping axes are normalized against the export manifest's ranges,
which the glTF conversion rotates — so `x` cuts bow/stern, `z` cuts
port/starboard, and `y` cuts horizontally. Easiest to find a value by eye.
