import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle} from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface PermittedUses {
  withConsent: string[] | null;
  withoutConsent: string[] | null;
  loading: boolean;
  error: string | null;
}

export function PlanningTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  const [permittedUses, setPermittedUses] = useState<PermittedUses>({
    withConsent: null,
    withoutConsent: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    async function fetchZoningAndPermittedUses() {
      if (!selectedProperty?.propId) return;

      setPermittedUses(prev => ({ ...prev, loading: true, error: null }));

      try {
        // First fetch zoning information
        const zoningResponse = await fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const zoningData = await zoningResponse.json();
        const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

        if (!zoningLayer?.results?.[0]) {
          throw new Error('No zoning data found');
        }

        const zoneInfo = {
          zoneName: zoningLayer.results[0].title,
          lgaName: zoningLayer.results[0]["LGA Name"]
        };

        setZoneInfo(zoneInfo);

        // Fetch permitted uses
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/19/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=*` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const data = await response.json();
        
        if (!data.features?.[0]?.attributes) {
          throw new Error('No zoning data found');
        }

        const zoneData = data.features[0].attributes;
        const epiName = zoneData.EPI_NAME;
        const zoneCode = zoneData.SYM_CODE;

        const API_BASE_URL = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5173'
          : '';

        const permittedResponse = await fetch(`${API_BASE_URL}/api/proxy`, {
          headers: {
            'EPINAME': epiName,
            'ZONECODE': zoneCode,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!permittedResponse.ok) {
          throw new Error('Failed to fetch permitted uses');
        }

        const jsonData = await permittedResponse.json();
        const precinct = jsonData?.[0]?.Precinct?.[0];
        const zone = precinct?.Zone?.find((z: any) => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        // Remove duplicates and sort alphabetically
        const withConsentSet: Set<string> = new Set(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet: Set<string> = new Set(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        setPermittedUses({
          withConsent: [...withConsentSet].sort((a, b) => a.localeCompare(b)),
          withoutConsent: [...withoutConsentSet].sort((a, b) => a.localeCompare(b)),
          loading: false,
          error: null
        });

      } catch (error: any) {
        console.error('Error in planning tab:', error);
        setPermittedUses(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch planning data'
        }));
      }
    }

    fetchZoningAndPermittedUses();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view planning controls</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (permittedUses.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (permittedUses.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{permittedUses.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Zoning</CardTitle>
          <CardDescription>Current planning controls for this property</CardDescription>
        </CardHeader>
        <CardContent>
          {zoneInfo ? (
            <div className="space-y-2">
              <p><strong>Zone:</strong> {zoneInfo.zoneName}</p>
              <p><strong>LGA:</strong> {zoneInfo.lgaName}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No zoning information available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permitted Uses</CardTitle>
          <CardDescription>Land uses permitted in this zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Permitted Without Consent</h4>
              {permittedUses.withoutConsent?.length ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {permittedUses.withoutConsent.map((use, index) => (
                    <li key={index}>{use}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No uses permitted without consent</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Permitted With Consent</h4>
              {permittedUses.withConsent?.length ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {permittedUses.withConsent.map((use, index) => (
                    <li key={index}>{use}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No uses permitted with consent</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
