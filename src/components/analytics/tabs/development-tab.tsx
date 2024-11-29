import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as turf from '@turf/turf';

interface DevelopmentApplication {
  applicationId: string;
  description: string;
  status: string;
  lodgementDate: string;
  determinationDate?: string;
}

export function DevelopmentTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [applications, setApplications] = useState<DevelopmentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  console.log('DevelopmentTab rendered with selectedProperty:', selectedProperty);

  useEffect(() => {
    console.log('Full selected property data:', selectedProperty);
    
    if (!selectedProperty?.geometry) {
      console.log('No property geometry');
      return;
    }

    // Get the property address
    const address = selectedProperty.attributes?.ADDRESS || selectedProperty.address;
    if (!address) {
      console.log('No property address, full attributes:', selectedProperty.attributes);
      return;
    }

    const fetchApplications = async () => {
      try {
        // Get property center coordinates
        const propertyGeometry = selectedProperty.geometry;
        console.log('Property geometry:', propertyGeometry);
        
        // Convert coordinates if they're in Web Mercator
        const propertyCenter = convertToLatLong(propertyGeometry);
        console.log('Property center:', propertyCenter);

        if (!propertyCenter) {
          console.log('Failed to get property center');
          return;
        }

        const [propertyLon, propertyLat] = propertyCenter;

        // Define search bounds
        const searchBounds = {
          minLat: propertyLat - 0.002,
          maxLat: propertyLat + 0.002,
          minLon: propertyLon - 0.002,
          maxLon: propertyLon + 0.002
        };

        console.log('Searching in bounds:', searchBounds);

        // First get applications from City of Sydney without location filtering
        const { data: initialData, error: initialError } = await supabase
          .from('development_applications')
          .select('*')
          .eq('council_name', 'City of Sydney')
          .limit(5);

        if (initialError) {
          console.error('Initial query error:', initialError);
          throw initialError;
        }

        // Log the raw data structure to understand location format
        console.log('Raw data examples:', initialData?.map(app => ({
          id: app.id,
          council: app.council_name,
          address: app.location?.[0]?.FullAddress,
          rawLocation: app.location?.[0],
          coordinates: app.location?.[0] ? [
            parseFloat(app.location[0].X),
            parseFloat(app.location[0].Y)
          ] : null
        })));

        // Now try with just lat/lon bounds
        const { data: boundedData, error: boundedError } = await supabase
          .from('development_applications')
          .select('*')
          .eq('council_name', 'City of Sydney')
          .gte('location->0->Y', searchBounds.minLat)
          .lte('location->0->Y', searchBounds.maxLat)
          .gte('location->0->X', searchBounds.minLon)
          .lte('location->0->X', searchBounds.maxLon)
          .limit(100);

        if (boundedError) {
          console.error('Bounded query error:', boundedError);
          throw boundedError;
        }

        console.log('Bounded query results:', {
          total: boundedData?.length || 0,
          bounds: searchBounds,
          examples: boundedData?.slice(0, 3).map(app => ({
            id: app.id,
            address: app.location?.[0]?.FullAddress,
            coordinates: app.location?.[0] ? [
              parseFloat(app.location[0].X),
              parseFloat(app.location[0].Y)
            ] : null
          }))
        });

        // Filter applications client-side
        const filteredData = boundedData?.filter(app => {
          if (!app.location?.[0]) {
            return false;
          }

          const appLon = parseFloat(app.location[0].X);
          const appLat = parseFloat(app.location[0].Y);

          if (isNaN(appLon) || isNaN(appLat)) {
            return false;
          }

          const distance = turf.distance(
            turf.point([propertyLon, propertyLat]),
            turf.point([appLon, appLat]),
            { units: 'meters' }
          );

          console.log('Application check:', {
            id: app.id,
            address: app.location[0].FullAddress,
            coordinates: [appLon, appLat],
            distance,
            inBounds: distance <= 200,
            type: app.development_type,
            status: app.application_status
          });

          return distance <= 200;
        }) || [];

        console.log(`Found ${filteredData.length} applications in search area`);

        // Format the matching applications
        const matchingApplications = filteredData.map(app => ({
          applicationId: app.id.toString(),
          description: app.development_type?.[0]?.description || '',
          status: app.application_status || '',
          lodgementDate: app.lodgement_date || '',
          determinationDate: app.determination_date
        }));

        console.log('Matching applications:', matchingApplications);
        setApplications(matchingApplications);
        setCount(matchingApplications.length);
        
      } catch (error: any) {
        console.error('Error fetching DAs:', error);
        setError(error.message || 'Failed to fetch development applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [selectedProperty?.address]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view development applications</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Development Applications</h3>
        <p>Found {count} development application(s) for this property.</p>
      </Card>
    </div>
  );
}

// Convert Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
function convertToLatLong(geometry: any): [number, number] | null {
  if (geometry.rings) {
    const [x, y] = geometry.rings[0][0];
    const lon = (x * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    return [lon, lat];
  } else if (geometry.coordinates) {
    const [x, y] = geometry.coordinates;
    const lon = (x * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    return [lon, lat];
  } else {
    console.error('Unexpected geometry structure:', geometry);
    return null;
  }
}
