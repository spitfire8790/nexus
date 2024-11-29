import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { fetchPropertyDetails } from '../utils/property-utils';

export function OverviewTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedProperty?.propId) return;

    const loadPropertyDetails = async () => {
      setLoading(true);
      try {
        const details = await fetchPropertyDetails(selectedProperty.propId);
        setPropertyDetails(details);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyDetails();
  }, [selectedProperty?.propId]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view details</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      {/* Property details content */}
      {propertyDetails && (
        <div>
          {/* Render property details */}
        </div>
      )}
    </div>
  );
}
