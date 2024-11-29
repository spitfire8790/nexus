import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface DemographicData {
  totalPopulation: number;
  medianAge: number;
  medianIncome: number;
  householdSize: number;
  loading: boolean;
  error: string | null;
}

export function DemographicsTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [demographicData, setDemographicData] = useState<DemographicData>({
    totalPopulation: 0,
    medianAge: 0,
    medianIncome: 0,
    householdSize: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    async function fetchDemographicData() {
      if (!selectedProperty?.geometry) return;

      setDemographicData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Census/MapServer/0/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=*` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch demographic data');
        }

        const data = await response.json();
        
        if (!data.features?.[0]?.attributes) {
          throw new Error('No demographic data found for this area');
        }

        const attributes = data.features[0].attributes;
        
        setDemographicData({
          totalPopulation: attributes.total_population || 0,
          medianAge: attributes.median_age || 0,
          medianIncome: attributes.median_household_income || 0,
          householdSize: attributes.average_household_size || 0,
          loading: false,
          error: null
        });

      } catch (error: any) {
        console.error('Error fetching demographic data:', error);
        setDemographicData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch demographic data'
        }));
      }
    }

    fetchDemographicData();
  }, [selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view local demographics</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (demographicData.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (demographicData.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{demographicData.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Population</h3>
        <p className="text-2xl font-bold">
          {demographicData.totalPopulation.toLocaleString()}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Median Age</h3>
        <p className="text-2xl font-bold">
          {demographicData.medianAge.toFixed(1)}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Median Household Income</h3>
        <p className="text-2xl font-bold">
          ${demographicData.medianIncome.toLocaleString()}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Household Size</h3>
        <p className="text-2xl font-bold">
          {demographicData.householdSize.toFixed(1)}
        </p>
      </Card>
    </div>
  );
}
