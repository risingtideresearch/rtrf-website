import data from '../script_output/model_export_manifest.json'
import jigData from '../script_output/model_jig_export_manifest.json'
import batteryData from '../script_output/model_battery_export_manifest.json'

type Manifest = {exported_layers: {filename: string}[]}

/** Manifests outside the main Rhino export, offered whole rather than by layer. */
const SET_MANIFESTS: Manifest[] = [jigData, batteryData]

export type ModelSet = {title: string; files: string[]}

/** "BATTERY MODULE V1" → "Battery module v1". */
function titleFromSystem(system: string): string {
  const spaced = system.replace(/_/g, ' ').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** One set per system. */
export const MODEL_SETS: ModelSet[] = (() => {
  const bySystem = new Map<string, string[]>()
  for (const manifest of SET_MANIFESTS) {
    for (const {filename} of manifest.exported_layers) {
      const system = filename.split('__')[0]
      const files = bySystem.get(system)
      if (files) files.push(filename)
      else bySystem.set(system, [filename])
    }
  }
  return [...bySystem.entries()]
    .map(([system, files]) => ({title: titleFromSystem(system), files}))
    .sort((a, b) => a.title.localeCompare(b.title))
})()

const setFiles = new Set(MODEL_SETS.flatMap((set) => set.files))

/** Individually selectable models — the Rhino layers only. */
export const rhinoModels: string[] = data.exported_layers
  .map((f) => f.filename)
  .filter((name) => !setFiles.has(name))

export function modelTitle(filename: string): string {
  const parts = filename.replace('.glb', '').split('__')
  return parts[parts.length - 1]
}

/** The set a saved filename belongs to, if any. */
export function setForFile(filename: string): ModelSet | undefined {
  return MODEL_SETS.find((set) => set.files.includes(filename))
}
