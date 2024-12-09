import { useState, useEffect } from 'react';
import { useMapStore } from '@/lib/map-store';
import { fetchPropertyDetails, fetchZoningData } from '../utils/property-utils';

export function usePropertyData() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const setPermittedUses = useMapStore((state) => state.setPermittedUses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<any>(null);

  useEffect(() => {
    if (!selectedProperty?.propId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setPermittedUses({ loading: true, error: null, withConsent: [], withoutConsent: [] });

      try {
        // Fetch all property data in parallel
        const [details, zoning, permittedUses] = await Promise.all([
          fetchPropertyDetails(selectedProperty.propId),
          fetchZoningData(selectedProperty.propId, selectedProperty.geometry),
          fetchPermittedUses(selectedProperty.propId, selectedProperty.geometry)
        ]);

        setPropertyData({ details, zoning });
        setZoneInfo(zoning);
        setPermittedUses({
          loading: false,
          error: null,
          withConsent: permittedUses.withConsent,
          withoutConsent: permittedUses.withoutConsent
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch property data';
        setError(errorMessage);
        setPermittedUses({
          loading: false,
          error: errorMessage,
          withConsent: [],
          withoutConsent: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo, setPermittedUses]);

  return { loading, error, propertyData };
}
