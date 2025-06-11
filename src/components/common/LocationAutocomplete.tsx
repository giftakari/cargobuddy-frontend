import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { debounce } from 'lodash';

// Location interface
interface Location {
  id: number;
  postcode: string;
  locality: string;
  state: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  label: string;
  placeholder?: string;
  value?: Location | null;
  onChange: (location: Location | null) => void;
  onSuburbChange?: (suburb: string) => void;
  onPostcodeChange?: (postcode: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

// Mock API function - replace with your actual API call
const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `/api/locations/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to search locations');
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onSuburbChange,
  onPostcodeChange,
  disabled = false,
  error = false,
  helperText,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query || query.length < 2) {
          setOptions([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const results = await searchLocations(query);
          setOptions(results);
        } catch (error) {
          console.error('Search failed:', error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  // Effect to search when input changes
  useEffect(() => {
    debouncedSearch(inputValue);
    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue, debouncedSearch]);

  // Handle selection change
  const handleChange = (event: any, newValue: Location | null) => {
    onChange(newValue);
    
    // Update individual suburb and postcode if callbacks provided
    if (newValue) {
      onSuburbChange?.(newValue.locality);
      onPostcodeChange?.(newValue.postcode);
    } else {
      onSuburbChange?.('');
      onPostcodeChange?.('');
    }
  };

  // Format option display
  const getOptionLabel = (option: Location) => {
    if (typeof option === 'string') return option;
    return `${option.locality}, ${option.state} ${option.postcode}`;
  };

  // Check if options are equal
  const isOptionEqualToValue = (option: Location, value: Location) => {
    return option.id === value.id;
  };

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={loading}
      disabled={disabled}
      noOptionsText={
        inputValue.length < 2 
          ? "Type at least 2 characters to search..." 
          : "No locations found"
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />
            <Box>
              <Typography variant="body1">
                {option.locality}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.state} {option.postcode}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      filterOptions={(x) => x} // Don't filter on frontend, we do it on backend
    />
  );
};

export default LocationAutocomplete;