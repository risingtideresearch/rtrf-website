import React, { useState, useEffect, useCallback } from 'react';
import { Autocomplete, Box, Card, Flex, Stack, Text } from '@sanity/ui';
import { set, unset } from 'sanity';
import type { StringInputProps } from 'sanity';

import data from '../script_output/drawing_conversion_manifest.json';

const PREVIEW_SITE_URL =
  process.env.SANITY_STUDIO_PREVIEW_SITE_URL || 'https://solander38-preview.netlify.app'

interface Option {
  title: string;
  value: string;
  group: string;
  imageUrl: string;
}

/**
 * Drawing images are served by the frontend, not the Studio, so previews point at
 * the preview site. Segments are encoded individually because system folders
 * contain spaces and ampersands ("OUTFITTING & INTERIOR").
 */
export function getDrawingImageUrl(relPath?: string) {
  if (!relPath) return '';
  const encoded = relPath.split('/').map(encodeURIComponent).join('/');
  return `${PREVIEW_SITE_URL}${encoded}`;
}

export function getDrawingByUuid(uuid: string) {
  return data.files.find(file => file.uuid === uuid);
}

export function getDrawingTitle(uuid: string) {
  const drawing = getDrawingByUuid(uuid);
  return drawing?.title || drawing?.filename || uuid || 'Unknown Drawing';
}

export function getDrawingId(uuid: string) {
  const drawing = getDrawingByUuid(uuid);
  return drawing?.id || '';
}

/**
 * Prefer the mini thumbnail so the dropdown isn't pulling multi-megabyte
 * full-resolution renders, falling back to the drawing itself.
 */
export function getDrawingPreviewUrl(uuid: string) {
  const drawing = getDrawingByUuid(uuid);
  return getDrawingImageUrl(drawing?.thumbnail_path || drawing?.rel_path);
}

// Drawings are dark linework, often on a transparent background, so they need a
// white plate to stay legible in the Studio's dark theme.
const PLATE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 2,
  overflow: 'hidden',
};

const DrawingDropdownInput = React.forwardRef<HTMLInputElement, StringInputProps>(
  (props, ref) => {
    const { elementProps, onChange, value } = props;
    const [options, setOptions] = useState<Option[]>([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
      const mapped = data.files.map(file => ({
        title: `${file.id} ${file.title}`,
        value: file.uuid,
        group: file.group,
        imageUrl: getDrawingPreviewUrl(file.uuid),
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
      <Card as="button" padding={2}>
        <Flex align="center" gap={3}>
          <Box style={{ ...PLATE, flexShrink: 0, width: 64, height: 44 }}>
            <img
              src={option.imageUrl}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Stack space={2} style={{ minWidth: 0 }}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {option.title}
            </Text>
            <Text size={0} muted textOverflow="ellipsis">
              {option.group}
            </Text>
          </Stack>
        </Flex>
      </Card>
    ), []);

    return (
      <Stack space={3}>
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

        {currentOption && (
          <Card padding={2} radius={2} border>
            <Stack space={2}>
              <Box style={PLATE}>
                <img
                  src={currentOption.imageUrl}
                  alt={currentOption.title}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </Box>
              <Text size={0} muted>
                {currentOption.group}
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    );
  }
);

DrawingDropdownInput.displayName = 'DrawingDropdownInput';

export default DrawingDropdownInput;
