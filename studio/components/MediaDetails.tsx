import {Box, Stack, Text, TextInput} from '@sanity/ui'
import {type ReactElement, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'

type Props = {
  currentAsset: any
  formUpdating: boolean
  renderDefaultDetails: (props: any) => ReactElement
  [key: string]: any
}

/** Normalise EXIF / ISO date strings to YYYY-MM-DD for the date input.
 *  Handles:
 *   - "YYYY:MM:DD HH:MM:SS"       (standard EXIF)
 *   - "2025-04-25T11-20-08.000Z"  (ISO-like with hyphens in time)
 *   - "YYYY-MM-DD"                (already normalised)
 */
function parseExifDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  if (raw.includes('T')) return raw.split('T')[0]                      // ISO-like
  if (raw.includes(' ')) return raw.split(' ')[0].replace(/:/g, '-')   // EXIF standard
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw                     // already YYYY-MM-DD
  return undefined
}

function initDate(asset: any): string {
  return asset?.date ?? ''
}

function initExifDate(asset: any): string | null | undefined {
  const exif = asset?.metadata?.exif
  if (exif === undefined) return undefined
  return parseExifDate(exif?.DateTimeOriginal) ?? null
}

export function MediaDetails({renderDefaultDetails, currentAsset, formUpdating, setValue, ...props}: Props) {
  const client = useClient({apiVersion: '2024-01-01'})
  const [savedDate, setSavedDate] = useState<string>(() => initDate(currentAsset))
  const [date, setDate] = useState<string>(() => initDate(currentAsset))
  // undefined = not yet loaded, null = loaded but no EXIF, string = loaded with EXIF date
  const [exifDate, setExifDate] = useState<string | null | undefined>(() => initExifDate(currentAsset))

  useEffect(() => {
    if (!currentAsset?._id) return
    client
      .fetch<{date?: string; exif?: {DateTimeOriginal?: string}}>(
        `*[_id == $id][0]{date, "exif": metadata.exif}`,
        {id: currentAsset._id},
      )
      .then((doc) => {
        const loaded = doc?.date ?? ''
        setSavedDate(loaded)
        setDate(loaded)
        setExifDate(parseExifDate(doc?.exif?.DateTimeOriginal) ?? null)
      })
  }, [currentAsset?._id])

  // Save date alongside the main form — detect false → true transition on formUpdating.
  // Using refs so the effect only re-runs when formUpdating changes, not on every date edit.
  const dateRef = useRef(date)
  const savedDateRef = useRef(savedDate)
  dateRef.current = date
  savedDateRef.current = savedDate

  const prevFormUpdating = useRef(false)
  useEffect(() => {
    const wasUpdating = prevFormUpdating.current
    prevFormUpdating.current = formUpdating
    if (!wasUpdating && formUpdating && dateRef.current !== savedDateRef.current && currentAsset?._id) {
      const d = dateRef.current
      const patch = client.patch(currentAsset._id)
      ;(d ? patch.set({date: d}) : patch.unset(['date']))
        .commit()
        .then(() => setSavedDate(d))
    }
  }, [formUpdating, client, currentAsset?._id])

  // EXIF only exists on image assets; videos (file assets) get a plain date field.
  const isImage = currentAsset?._type === 'sanity.imageAsset'
  const hintLabel = !isImage
    ? ''
    : date && exifDate
    ? 'Overrides EXIF date'
    : exifDate
      ? 'EXIF date'
      : exifDate === null
        ? 'No EXIF date defined'
        : ''
  const hintDate = isImage && !date && exifDate ? exifDate : null

  return (
    <Stack space={3}>
      {renderDefaultDetails({currentAsset, formUpdating, ...props})}
      <Box>
        <Stack space={2} paddingTop={3}>
          <Text size={1} weight='semibold'>Date</Text>
          {hintLabel ? (
            <Stack space={1} paddingTop={1} paddingBottom={1}>
              <Text size={1} muted>{hintLabel}
              {hintDate ? <>&nbsp;{hintDate}</> : null}</Text>
            </Stack>
          ) : null}
          <TextInput
            disabled={formUpdating}
            onChange={(e) => {
              const v = e.currentTarget.value
              setDate(v)
              setValue?.('date' as any, v, {shouldDirty: true})
            }}
            type="date"
            value={date}
            placeholder={(isImage && exifDate) || undefined}
          />
        </Stack>
      </Box>
    </Stack>
  )
}
