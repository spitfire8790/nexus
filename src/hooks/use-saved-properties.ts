import { useEffect } from 'react';
import { useMapStore } from '@/lib/map-store';

export function useSavedProperties() {
  const setSavedProperties = useMapStore((state) => state.setSavedProperties);

  useEffect(() => {
    // Load saved properties from localStorage
    try {
      const saved = localStorage.getItem('savedProperties');
      const properties = saved ? JSON.parse(saved) : [];
      setSavedProperties(properties);
    } catch (error) {
      console.error('Error loading saved properties:', error);
      setSavedProperties([]);
    }
  }, [setSavedProperties]);
} 