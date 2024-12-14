import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';

// Add debouncing for coordinate updates
const debouncedQuerySuburb = useCallback(
  debounce((coordinates: { lon: number; lat: number }) => {
    if (!coordinates) return;
    
    // Check if we already have data for these coordinates
    const coordKey = `${coordinates.lon},${coordinates.lat}`;
    if (suburbCache.current[coordKey]) {
      return;
    }

    console.log('Querying suburb at coordinates:', coordinates);
    querySuburbAtPoint(coordinates)
      .then((response) => {
        if (response?.features?.[0]?.attributes?.suburbname) {
          const suburb = response.features[0].attributes.suburbname;
          suburbCache.current[coordKey] = suburb;
          setSuburbState(prev => ({
            ...prev,
            suburb,
            hasSuburb: true,
            timestamp: new Date().toISOString()
          }));
        }
      })
      .catch(console.error);
  }, 500),
  []
);

// Add coordinate caching
const suburbCache = useRef<Record<string, string>>({});

// Optimize the useEffect for coordinate changes
useEffect(() => {
  if (!coordinates || !coordinates.lon || !coordinates.lat) return;
  
  const coordKey = `${coordinates.lon},${coordinates.lat}`;
  if (suburbCache.current[coordKey]) {
    setSuburbState(prev => ({
      ...prev,
      suburb: suburbCache.current[coordKey],
      hasSuburb: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  debouncedQuerySuburb(coordinates);
}, [coordinates, debouncedQuerySuburb]);

// Add memoization for expensive computations
const queryHookState = useMemo(() => ({
  hasData: Boolean(data),
  isLoading,
  error,
  suburb: suburbState.suburb
}), [data, isLoading, error, suburbState.suburb]);

// Only log state changes when they actually change
useEffect(() => {
  console.log('Query hook state:', queryHookState);
}, [queryHookState]); 