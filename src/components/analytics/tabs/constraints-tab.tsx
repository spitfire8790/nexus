import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { BushfireRiskDial } from '../components/bushfire-risk-dial';

type RiskCategory = 'None' | 'Vegetation Buffer' | 'Vegetation Category 3' | 'Vegetation Category 2' | 'Vegetation Category 1';

export function ConstraintsTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [risk, setRisk] = useState<RiskCategory>('None');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBushfireRisk() {
      if (!selectedProperty?.geometry) {
        setRisk('None');
        return;
      }
      
      setLoading(true);
      console.log('Fetching bushfire data for property:', selectedProperty);
      
      try {
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer/229/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=Category` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) throw new Error('Failed to fetch bushfire risk data');
        
        const data = await response.json();
        console.log('Bushfire risk data received:', data);
        
        if (data.features && data.features.length > 0) {
          const categories = data.features.map((f: any) => f.attributes.Category);
          console.log('Risk categories found:', categories);
          
          const categoryToRisk: Record<number, RiskCategory> = {
            0: 'Vegetation Buffer',    // Lowest risk
            3: 'Vegetation Category 3', // Second lowest risk
            2: 'Vegetation Category 2', // Second highest risk
            1: 'Vegetation Category 1'  // Highest risk
          };
          
          // If we have a buffer zone (0), that's the lowest risk
          // Otherwise, find the lowest number (highest risk) excluding 0
          const riskLevel = categories.includes(0) && categories.length === 1 ? 
            'Vegetation Buffer' : 
            categoryToRisk[Math.min(...categories.filter((c: number) => c !== 0))];
          
          console.log('Risk categories found:', categories, '-> Mapped to:', riskLevel);
          setRisk(riskLevel || 'None');
        } else {
          console.log('No bushfire risk features found for property');
          setRisk('None');
        }
      } catch (error) {
        console.error('Error fetching bushfire risk:', error);
        setError('Failed to fetch bushfire risk data');
      } finally {
        setLoading(false);
      }
    }

    fetchBushfireRisk();
  }, [selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view site constraints</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Bushfire Risk Assessment</h3>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BushfireRiskDial risk={risk} />
          )}
        </div>
        
        {/* Add other constraint assessments here */}
      </div>
    </div>
  );
}
