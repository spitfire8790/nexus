import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { BushfireRiskDial } from '../components/bushfire-risk-dial';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type RiskCategory = 'None' | 'Vegetation Buffer' | 'Vegetation Category 3' | 'Vegetation Category 2' | 'Vegetation Category 1';

function BushfireRisk() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bushfire Risk Assessment</CardTitle>
        <CardDescription>
          Assessment based on NSW Planning Portal Bushfire Prone Land Map
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : (
          <BushfireRiskDial risk={risk} />
        )}
      </CardContent>
    </Card>
  );
}

function ContaminationRisk() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    contaminatedSites: Array<{
      siteName: string;
      activityType: string;
      managementClass: string;
    }>;
    epaLicenses: Array<{
      organisation: string;
      site: string;
      primaryActivity: string;
    }>;
  }>({
    contaminatedSites: [],
    epaLicenses: []
  });

  const fetchData = async () => {
    if (!selectedProperty?.geometry) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch contaminated sites
      const contaminatedResponse = await fetch(
        `https://mapprod2.environment.nsw.gov.au/arcgis/rest/services/EPA/Contaminated_land_notified_sites/MapServer/0/query?` +
        `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
        `&geometryType=esriGeometryPolygon` +
        `&spatialRel=esriSpatialRelContains` +
        `&outFields=SiteName,ContaminationActivityType,ManagementClass` +
        `&returnGeometry=false` +
        `&f=json`
      );

      // Fetch EPA licenses
      const licensesResponse = await fetch(
        `https://maptest1.environment.nsw.gov.au/arcgis/rest/services/EPA/Environment_Protection_Licences/FeatureServer/2/query?` +
        `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
        `&geometryType=esriGeometryPolygon` +
        `&spatialRel=esriSpatialRelIntersects` +
        `&outFields=APName,LocationName,PrimaryFeebasedActivity` +
        `&returnGeometry=false` +
        `&f=json`
      );

      if (!contaminatedResponse.ok || !licensesResponse.ok) {
        throw new Error('Failed to fetch environmental data');
      }

      const contaminatedData = await contaminatedResponse.json();
      const licensesData = await licensesResponse.json();

      setData({
        contaminatedSites: contaminatedData.features?.map((f: any) => ({
          siteName: f.attributes.SiteName,
          activityType: f.attributes.ContaminationActivityType,
          managementClass: f.attributes.ManagementClass
        })) || [],
        epaLicenses: licensesData.features?.map((f: any) => ({
          organisation: f.attributes.APName,
          site: f.attributes.LocationName,
          primaryActivity: f.attributes.PrimaryFeebasedActivity
        })) || []
      });
    } catch (err) {
      console.error('Error fetching environmental data:', err);
      setError('Failed to load environmental data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProperty?.geometry) {
      fetchData();
    }
  }, [selectedProperty?.geometry]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Contamination and Environmental Licenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading environmental data...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Contaminated Sites Section */}
            <div>
              <h3 className="font-semibold mb-2">Contaminated Land</h3>
              {data.contaminatedSites.length > 0 ? (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Contamination Notice</AlertTitle>
                    <AlertDescription>
                      This property is an identified site as part of the NSW EPA's Contaminated Land Register (Public).
                    </AlertDescription>
                  </Alert>
                  {data.contaminatedSites.map((site, index) => (
                    <div key={index} className="text-sm space-y-1">
                      <div><strong>Site Name:</strong> {site.siteName}</div>
                      <div><strong>Activity Type:</strong> {site.activityType}</div>
                      <div><strong>Management Class:</strong> {site.managementClass}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No Contamination Notices</AlertTitle>
                  <AlertDescription className="text-muted-foreground italic">
                    No contaminated sites have been identified within this property.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* EPA Licensed Premises Section */}
            <div>
              <h3 className="font-semibold mb-2">EPA Licensed Premises</h3>
              {data.epaLicenses.length > 0 ? (
                <div className="space-y-4">
                  {data.epaLicenses.map((license, index) => (
                    <div key={index} className="space-y-1 text-sm">
                      <div><strong>Organisation:</strong> {license.organisation}</div>
                      <div><strong>Site:</strong> {license.site}</div>
                      <div><strong>Primary Activity:</strong> {license.primaryActivity}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No EPA Licenses</AlertTitle>
                  <AlertDescription>
                    No EPA licensed premises have been identified for this property.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ConstraintsTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view site constraints</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <BushfireRisk />
      <ContaminationRisk />
    </div>
  );
}
