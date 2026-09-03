import React, {useState, useCallback} from 'react'
import {Autocomplete, Card, Stack, Text} from '@sanity/ui'
import {set, unset} from 'sanity'
import type {StringInputProps} from 'sanity'

import {modelTitle, rhinoModels} from './modelSets'

interface Option {
  title: string
  value: string
}

const options: Option[] = rhinoModels.map((filename) => ({
  title: modelTitle(filename),
  value: filename,
}))

const ModelDropdownInput = React.forwardRef<HTMLInputElement, StringInputProps>((props, ref) => {
  const {elementProps, onChange, value} = props
  const [query, setQuery] = useState('')

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

  // fall back to the raw value so an already-saved model still shows its name
  const currentOption =
    options.find((opt) => opt.value === value) ||
    (value ? {title: modelTitle(value), value} : undefined)

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
