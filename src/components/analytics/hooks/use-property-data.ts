import { useState, useEffect } from 'react';
import { useMapStore } from '@/lib/map-store';
import { fetchPropertyDetails, fetchZoningData } from '../utils/property-utils';

export function usePropertyData() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<any>(null);

  useEffect(() => {
    if (!selectedProperty?.propId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch property details and zoning data in parallel
        const [details, zoning] = await Promise.all([
          fetchPropertyDetails(selectedProperty.propId),
          fetchZoningData(selectedProperty.propId, selectedProperty.geometry)
        ]);

        setPropertyData({ details, zoning });
        setZoneInfo(zoning);
      } catch (err) {
        setError(err.message);
        console.error('Error loading property data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo]);

  return { loading, error, propertyData };
}
