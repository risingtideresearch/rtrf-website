import React, {useCallback, useMemo, useState} from 'react'
import {Autocomplete, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {set, unset} from 'sanity'
import type {ArrayOfPrimitivesInputProps} from 'sanity'

import {MODEL_SETS, ModelSet, modelTitle, rhinoModels, setForFile} from './modelSets'

const SET_PREFIX = 'set:'

type Option = {value: string; title: string; subtitle: string}

const options: Option[] = [
  ...MODEL_SETS.map((modelSet) => ({
    value: SET_PREFIX + modelSet.title,
    title: modelSet.title,
    subtitle: `Complete set — ${modelSet.files.length} models`,
  })),
  ...rhinoModels.map((filename) => ({
    value: filename,
    title: modelTitle(filename),
    subtitle: filename.replace('.glb', '').split('__').slice(0, -1).join(' / '),
  })),
]

/** A chosen entry: either a whole set, or one Rhino layer. */
type Row = {key: string; title: string; subtitle: string; files: string[]}

/** Collapse the stored filenames into rows, one per complete set. */
function toRows(files: string[]): Row[] {
  const rows: Row[] = []
  const claimed = new Set<string>()

  for (const modelSet of MODEL_SETS) {
    if (modelSet.files.every((f) => files.includes(f))) {
      modelSet.files.forEach((f) => claimed.add(f))
      rows.push({
        key: SET_PREFIX + modelSet.title,
        title: modelSet.title,
        subtitle: `${modelSet.files.length} models`,
        files: modelSet.files,
      })
    }
  }

  for (const file of files) {
    if (claimed.has(file)) continue
    const partial = setForFile(file)
    rows.push({
      key: file,
      title: modelTitle(file),
      subtitle: partial ? `${partial.title} — incomplete set` : file,
      files: [file],
    })
  }

  return rows
}

export default function ModelListInput(props: ArrayOfPrimitivesInputProps<string>) {
  const {value, onChange, readOnly} = props
  const [query, setQuery] = useState('')

  const files = useMemo(
    () => (value || []).filter((v): v is string => typeof v === 'string'),
    [value],
  )
  const rows = useMemo(() => toRows(files), [files])

  const commit = useCallback(
    (next: string[]) => onChange(next.length ? set(next) : unset()),
    [onChange],
  )

  const handleAdd = useCallback(
    (selected: string) => {
      const modelSet: ModelSet | undefined = selected.startsWith(SET_PREFIX)
        ? MODEL_SETS.find((s) => SET_PREFIX + s.title === selected)
        : undefined
      const incoming = modelSet ? modelSet.files : [selected]
      const added = incoming.filter((f) => !files.includes(f))
      if (added.length) commit([...files, ...added])
      setQuery('')
    },
    [files, commit],
  )

  const filtered = options.filter((option) =>
    (option.title + ' ' + option.subtitle).toLowerCase().includes(query.toLowerCase()),
  )

  const renderOption = useCallback(
    (option: Option) => (
      <Card as="button" padding={3} border>
        <Stack space={2}>
          <Text size={1} muted>
            <em>{option.subtitle}</em>
          </Text>
          <Text size={1}>{option.title}</Text>
        </Stack>
      </Card>
    ),
    [],
  )

  return (
    <Stack space={3}>
      {rows.length > 0 && (
        <Stack space={2}>
          {rows.map((row) => (
            <Card key={row.key} padding={2} radius={2} border>
              <Flex align="center" gap={2}>
                <Stack space={2} flex={1}>
                  <Text size={1}>{row.title}</Text>
                  <Text size={1} muted>
                    {row.subtitle}
                  </Text>
                </Stack>
                <Button
                  mode="bleed"
                  icon={TrashIcon}
                  tone="critical"
                  disabled={readOnly}
                  title={`Remove ${row.title}`}
                  onClick={() => commit(files.filter((f) => !row.files.includes(f)))}
                />
              </Flex>
            </Card>
          ))}
        </Stack>
      )}

      <Autocomplete
        id={props.id}
        options={filtered}
        value=""
        readOnly={readOnly}
        onChange={handleAdd}
        onQueryChange={(q) => setQuery(q || '')}
        renderOption={renderOption}
        filterOption={() => true}
        placeholder="Add a model or set…"
        openButton
      />
    </Stack>
  )
}
