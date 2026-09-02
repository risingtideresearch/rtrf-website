import React, {useState, useEffect, useCallback} from 'react'
import {Autocomplete, Card, Stack, Text} from '@sanity/ui'
import {set, unset} from 'sanity'
import type {StringInputProps} from 'sanity'

import data from '../script_output/model_export_manifest.json'
import jigData from '../script_output/model_jig_export_manifest.json'
import batteryData from '../script_output/model_battery_export_manifest.json'

interface Option {
  title: string
  value: string
}

const ModelDropdownInput = React.forwardRef<HTMLInputElement, StringInputProps>((props, ref) => {
  const {elementProps, onChange, value} = props
  const [options, setOptions] = useState<Option[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const mapped = data.exported_layers.map((file) => {
      const name = file.filename.replace('.glb', '').split('__')
      return {
        title: name[name.length - 1],
        value: file.filename,
      }
    })

    ;[...jigData.exported_layers, ...batteryData.exported_layers].forEach((file) => {
      const name = file.filename.replace('.glb', '').split('__')
      mapped.push({
        title: name[name.length - 1],
        value: file.filename,
      })
    })
    setOptions(mapped)
  }, [])

  const filteredOptions = options.filter((option) =>
    option.value.toLowerCase().includes(query.toLowerCase()),
  )

  const handleChange = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue ? set(selectedValue) : unset())
    },
    [onChange],
  )

  const handleQueryChange = useCallback((q: string | null) => {
    setQuery(q || '')
  }, [])

  const currentOption = options.find((opt) => opt.value === value)

  const renderOption = useCallback(
    (option: Option) => (
      <Card as="button" padding={3} border={true}>
        <Stack space={3}>
          <Text size={1} align={'left'}>
            <em>{option.value.replace(option.title, '').replace('__.glb', '')}</em>
          </Text>
          <Text size={1} align={'left'}>
            {option.title}
          </Text>
        </Stack>
      </Card>
    ),
    [],
  )

  return (
    <Autocomplete
      {...elementProps}
      ref={ref}
      options={filteredOptions}
      value={currentOption?.title || ''}
      onChange={handleChange}
      onQueryChange={handleQueryChange}
      renderOption={renderOption}
      filterOption={() => true} // We handle filtering ourselves
      placeholder="Search for a model..."
      openButton
    />
  )
})

ModelDropdownInput.displayName = 'ModelDropdownInput'

export default ModelDropdownInput
