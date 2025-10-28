import React, { useState, useEffect, useCallback } from 'react';
import { Autocomplete, Box, Card, Stack, Text } from '@sanity/ui';
import { set, unset } from 'sanity';
import type { StringInputProps } from 'sanity';

import data from '../script_output/model_export_manifest.json';

interface Option {
  title: string;
  value: string;
}

const ModelDropdownInput = React.forwardRef<HTMLInputElement, StringInputProps>(
  (props, ref) => {
    const { elementProps, onChange, value } = props;
    const [options, setOptions] = useState<Option[]>([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
      const mapped = data.exported_layers.map(file => ({
        title: file.filename,
        value: file.filename,
      }));
      setOptions(mapped);
    }, []);

    const filteredOptions = options.filter(option =>
      option.title.toLowerCase().includes(query.toLowerCase())
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
        <Text>{option.title}</Text>
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
        placeholder="Search for a model..."
        openButton
      />
    );
  }
);

ModelDropdownInput.displayName = 'ModelDropdownInput';

export default ModelDropdownInput;
