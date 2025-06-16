import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: 'production'
  },
  studioHost: 'rising-tide',
  mediaLibrary: {
    // set the path relative to the location of sanity.cli.ts.
    aspectsPath: 'aspects',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
