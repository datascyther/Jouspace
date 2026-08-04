/**
 * SearchField — Search input with icon
 */

import React from 'react';
import { Search } from 'lucide-react-native';
import { TextField } from './TextField';
import type { TextFieldProps } from './TextField';

interface SearchFieldProps extends Omit<TextFieldProps, 'leftIcon'> {
  placeholder?: string;
}

export function SearchField({ placeholder = 'Search...', ...props }: SearchFieldProps) {
  return (
    <TextField
      {...props}
      placeholder={placeholder}
      leftIcon={<Search size={18} color="rgba(255,255,255,0.4)" />}
      returnKeyType="search"
    />
  );
}

export default SearchField;
