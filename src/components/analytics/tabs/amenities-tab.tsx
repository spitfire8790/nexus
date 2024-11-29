import { useCallback, useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';

interface AmenityConfig {
  type: string;
  url: string;
  nameField: string;
  icon: keyof typeof Icons;
}

const AMENITY_CONFIGS: Record<string, AmenityConfig> = {
  schools: {
    type: 'Schools',
    url: 'Planning/Planning_Portal_Schools/MapServer/0',
    nameField: 'school_name',
    icon: 'GraduationCap'
  },
  hospitals: {
    type: 'Hospitals',
    url: 'Planning/Planning_Portal_Hospitals/MapServer/0',
    nameField: 'hospital_name',
    icon: 'Heart'
  },
  transport: {
    type: 'Transport',
    url: 'Planning/Planning_Portal_Transport/MapServer/0',
    nameField: 'stop_name',
    icon: 'Train'
  }
};

interface Amenity {
  type: string;
  name: string;
  distance: number;
  icon?: keyof typeof Icons;
  geometry: {
    x: number;
    y: number;
  };
}

export function AmenitiesTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setBufferGeometry = useMapStore((state) => state.setBufferGeometry);
  const [loading, setLoading] = useState(true);
  const searchRadius = useMapStore((state) => state.searchRadius);
  const setSearchRadius = useMapStore((state) => state.setSearchRadius);
  const [amenities, setAmenities] = useState<Array<Amenity> | null>(null);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const setLayerGroups = useMapStore((state) => state.setLayerGroups);

  const updateBufferGeometry = useCallback((radius: number) => {
    if (!selectedProperty?.geometry) return;

    const rings = selectedProperty.geometry.rings[0];
    const coordinates = rings.map((coord: number[]) => [
      (coord[0] * 180) / 20037508.34,
      (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90)
    ]);

    const center = turf.center(turf.polygon([coordinates]));
    const buffered = buffer(center, radius, { units: 'kilometers' });
    
    const bufferCoords = buffered.geometry.coordinates[0].map((coord: [number, number]) => [
      (coord[0] * 20037508.34) / 180,
      Math.log(Math.tan((90 + coord[1]) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180
    ]) || [];

    setBufferGeometry({
      rings: [bufferCoords],
      spatialReference: { wkid: 102100 }
    });
  }, [selectedProperty?.geometry, setBufferGeometry]);

  useEffect(() => {
    updateBufferGeometry(searchRadius);
  }, [searchRadius, updateBufferGeometry]);

  useEffect(() => {
    return () => {
      setBufferGeometry(null);
    };
  }, [setBufferGeometry]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProperty?.geometry) return;
      setLoading(true);

      try {
        // Get center point from the property geometry
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

        // Create a simple square buffer (searchRadius in km converted to meters)
        const bufferDistance = searchRadius * 1000;
        const bufferGeometry = {
          rings: [[
            [centerX - bufferDistance, centerY - bufferDistance],
            [centerX + bufferDistance, centerY - bufferDistance],
            [centerX + bufferDistance, centerY + bufferDistance],
            [centerX - bufferDistance, centerY + bufferDistance],
            [centerX - bufferDistance, centerY - bufferDistance]
          ]],
          spatialReference: { wkid: 102100 }
        };

        const amenityPromises = Object.entries(AMENITY_CONFIGS).map(async ([key, config]) => {
          try {
            console.log(`🔍 Fetching ${config.type} amenities...`);
            const url = new URL(`https://portal.spatial.nsw.gov.au/server/rest/services/${config.url}/query`);
            
            url.searchParams.append('f', 'json');
            url.searchParams.append('geometry', JSON.stringify(bufferGeometry));
            url.searchParams.append('geometryType', 'esriGeometryPolygon');
            url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
            url.searchParams.append('outFields', '*');
            url.searchParams.append('returnGeometry', 'true');
            url.searchParams.append('inSR', '102100');
            url.searchParams.append('outSR', '102100');

            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`${config.type} API returned status: ${response.status}`);
            }
            
            const data = await response.json();
            return { key, config, data };
          } catch (error) {
            console.error(`❌ Error fetching ${config.type}:`, error);
            return { key, config, data: { features: [] } };
          }
        });

        const results = await Promise.all(amenityPromises);

        const allAmenities = results.flatMap(({ config, data }) => {
          if (!data.features?.length) return [];

          return data.features
            .map((feature: any) => {
              const dx = feature.geometry.x - centerX;
              const dy = feature.geometry.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              return {
                type: config.type,
                name: feature.attributes[config.nameField],
                distance: Math.round(distance),
                icon: config.icon,
                geometry: feature.geometry
              };
            })
            .filter((amenity: any) => amenity.distance <= searchRadius * 1000)
            .sort((a: any, b: any) => a.distance - b.distance);
        });

        setAmenities(allAmenities);
      } catch (error) {
        console.error('Error in amenities tab:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty?.geometry, searchRadius]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view nearby amenities</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Search Radius</h3>
          <span className="text-sm text-muted-foreground">{searchRadius}km</span>
        </div>
        <Slider
          value={[searchRadius]}
          min={1}
          max={5}
          step={0.5}
          onValueChange={([value]) => setSearchRadius(value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : amenities?.length ? (
        <div className="space-y-4">
          {amenities.map((amenity, index) => {
            const IconComponent = Icons[amenity.icon || 'MapPin'];
            return (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium truncate">{amenity.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {(amenity.distance / 1000).toFixed(1)}km
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{amenity.type}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Alert>
          <AlertTitle>No amenities found within {searchRadius}km</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
