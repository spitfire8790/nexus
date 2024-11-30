import { useCallback, useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  Loader2, School, GraduationCap, Building2, Hospital, 
  Truck, Shield, Flame, LifeBuoy, Train, MapPin 
} from 'lucide-react';
import * as turf from '@turf/turf';
import { buffer } from '@turf/buffer';

interface AmenityConfig {
  type: string;
  url: string;
  nameField: string;
  icon: React.ElementType;
}

const AMENITY_CONFIGS: Record<string, AmenityConfig> = {
  primarySchool: {
    type: 'Primary School',
    url: 'NSW_FOI_Education_Facilities/MapServer/0',
    icon: School,
    nameField: 'generalname'
  },
  highSchool: {
    type: 'High School',
    url: 'NSW_FOI_Education_Facilities/MapServer/2',
    icon: School,
    nameField: 'generalname'
  },
  technicalCollege: {
    type: 'Technical College',
    url: 'NSW_FOI_Education_Facilities/MapServer/4',
    icon: GraduationCap,
    nameField: 'generalname'
  },
  university: {
    type: 'University',
    url: 'NSW_FOI_Education_Facilities/MapServer/5',
    icon: Building2,
    nameField: 'generalname'
  },
  hospital: {
    type: 'Hospital',
    url: 'NSW_FOI_Health_Facilities/MapServer/1',
    icon: Hospital,
    nameField: 'generalname'
  },
  ambulanceStation: {
    type: 'Ambulance Station',
    url: 'NSW_FOI_Health_Facilities/MapServer/0',
    icon: Truck,
    nameField: 'generalname'
  },
  policeStation: {
    type: 'Police Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/1',
    icon: LifeBuoy,
    nameField: 'generalname'
  },
  fireStation: {
    type: 'Fire Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/0',
    icon: Flame,
    nameField: 'generalname'
  },
  sesStation: {
    type: 'SES Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/3',
    icon: Shield,
    nameField: 'generalname'
  },
  railStation: {
    type: 'Rail Station',
    url: 'NSW_FOI_Transport_Facilities/MapServer/1',
    icon: Train,
    nameField: 'generalname'
  }
};

interface Amenity {
  type: string;
  name: string;
  distance: number;
  icon: React.ElementType;
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

  const handleAddToMap = useCallback(async () => {
    if (!amenities?.length) return;
    setIsLayerLoading(true);

    try {
      const layerGroups = amenities.reduce((groups: Record<string, any[]>, amenity) => {
        if (!groups[amenity.type]) {
          groups[amenity.type] = [];
        }
        groups[amenity.type].push({
          name: amenity.name,
          coordinates: [amenity.geometry.x, amenity.geometry.y],
          distance: amenity.distance
        });
        return groups;
      }, {});

      setLayerGroups(layerGroups);
    } catch (error) {
      console.error('Error adding amenities to map:', error);
    } finally {
      setIsLayerLoading(false);
    }
  }, [amenities, setLayerGroups]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProperty?.geometry) return;
      setLoading(true);

      try {
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

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
            if (!response.ok) throw new Error(`${config.type} API returned status: ${response.status}`);
            
            const data = await response.json();
            return { key, config, data };
          } catch (error) {
            console.error(`Error fetching ${config.type}:`, error);
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
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Settings</CardTitle>
          <CardDescription>Adjust the search radius for nearby amenities</CardDescription>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Search Radius</span>
            <span className="text-sm text-muted-foreground">{searchRadius}km</span>
          </div>
          <Slider
            value={[searchRadius]}
            min={1}
            max={5}
            step={0.5}
            onValueChange={([value]) => setSearchRadius(value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : amenities && amenities.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(AMENITY_CONFIGS).map(([key, config]) => {
                const amenitiesOfType = amenities.filter(a => a.type === config.type);
                const Icon = config.icon;
                
                if (amenitiesOfType.length === 0) return null;
                
                const nearest = amenitiesOfType[0];
                
                return (
                  <div key={key} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{config.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {nearest.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(nearest.distance / 1000).toFixed(1)}km away
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground mt-4 italic">
                Closest amenity for each type is listed.
              </p>
            </div>
          ) : (
            <Alert>
              <AlertTitle>No amenities found within {searchRadius}km</AlertTitle>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAddToMap}
            className="w-full"
            disabled={isLayerLoading || !amenities?.length}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding to map...
              </span>
            ) : (
              'Add to Map'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
