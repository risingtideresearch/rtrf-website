// ./scripts/createData.ts

import {getCliClient} from 'sanity/cli'
import manifest from './../../frontend/public/models/export_manifest.json'
import {SanityDocumentLike} from 'sanity'
import {uuid} from '@sanity/uuid'

const client = getCliClient()

async function createData() {
  console.log(`Create new data with:`)
  console.log(`Project ID: ${client.config().projectId}`)
  console.log(`Dataset: ${client.config().dataset}`)

  const transaction = client.transaction()

  manifest.exported_layers.forEach((layer) => {
    console.log(layer, layer.filename.split('__'))
  })

//   const notes: SanityDocumentLike[] = []

  for (let i = 0; i < 1; i++) {
    transaction.create({
      _type: 'annotation',
      _id: uuid(),
      note: 'test',
    })
  }

//   transaction
//     .commit()
//     .then((res) => {
//       console.log(`Complete!`, res)
//     })
//     .catch((err) => {
//       console.error(err)
//     })
}

createData()
