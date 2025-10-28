import React, { useState, useEffect, useCallback } from 'react';
import { Autocomplete, Box, Card, Stack, Text } from '@sanity/ui';
import { set, unset } from 'sanity';
import type { StringInputProps } from 'sanity';

import data from '../script_output/drawing_conversion_manifest.json';

interface Option {
  title: string;
  value: string;
}

export function getDrawingByUuid(uuid: string) {
  return data.files.find(file => file.uuid === uuid);
}

export function getDrawingTitle(uuid: string) {
  const drawing = getDrawingByUuid(uuid);
  return drawing?.filename || uuid || 'Unknown Drawing';
}

export function getDrawingId(uuid: string) {
  const drawing = getDrawingByUuid(uuid);
  return drawing?.id || '';
}

const DrawingDropdownInput = React.forwardRef<HTMLInputElement, StringInputProps>(
  (props, ref) => {
    const { elementProps, onChange, value } = props;
    const [options, setOptions] = useState<Option[]>([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
      const mapped = data.files.map(file => ({
        title: file.filename,
        value: file.uuid,
      }));
      setOptions(mapped);
    }, []);

    const filteredOptions = options.filter(option =>
      option.title.toLowerCase().includes(query.toLowerCase())
      || option.value.toLowerCase().includes(query.toLowerCase())
    );

    const handleChange = useCallback((selectedValue: string) => {
      onChange(selectedValue ? set(selectedValue) : unset());
    }, [onChange]);

    const handleQueryChange = useCallback((q: string | null) => {
      setQuery(q || '');
    }, []);

    const currentOption = options.find(opt => opt.value === value);

    const renderOption = useCallback((option: Option) => (
      <Card as="button" padding={3}>
        <Text>{option.title} ({option.value})</Text>
      </Card>
    ), []);

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
        placeholder="Search for a drawing..."
        openButton
      />
    );
  }
);

DrawingDropdownInput.displayName = 'DrawingDropdownInput';

export default DrawingDropdownInput;
