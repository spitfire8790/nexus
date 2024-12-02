import { useCallback, useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import * as turf from '@turf/turf';
import { buffer } from '@turf/buffer';
import L from 'leaflet';
import { Switch } from '@/components/ui/switch';

interface AmenityConfig {
  type: string;
  url: string;
  nameField: string;
  icon: string;
}

const AMENITY_CONFIGS: Record<string, AmenityConfig> = {
  primarySchool: {
    type: 'Primary School',
    url: 'NSW_FOI_Education_Facilities/MapServer/0',
    icon: 'School',
    nameField: 'generalname'
  },
  highSchool: {
    type: 'High School',
    url: 'NSW_FOI_Education_Facilities/MapServer/2',
    icon: 'School',
    nameField: 'generalname'
  },
  technicalCollege: {
    type: 'Technical College',
    url: 'NSW_FOI_Education_Facilities/MapServer/4',
    icon: 'GraduationCap',
    nameField: 'generalname'
  },
  university: {
    type: 'University',
    url: 'NSW_FOI_Education_Facilities/MapServer/5',
    icon: 'Building2',
    nameField: 'generalname'
  },
  hospital: {
    type: 'Hospital',
    url: 'NSW_FOI_Health_Facilities/MapServer/1',
    icon: 'Hospital',
    nameField: 'generalname'
  },
  ambulanceStation: {
    type: 'Ambulance Station',
    url: 'NSW_FOI_Health_Facilities/MapServer/0',
    icon: 'Truck',
    nameField: 'generalname'
  },
  policeStation: {
    type: 'Police Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/1',
    icon: 'LifeBuoy',
    nameField: 'generalname'
  },
  fireStation: {
    type: 'Fire Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/0',
    icon: 'Flame',
    nameField: 'generalname'
  },
  sesStation: {
    type: 'SES Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/3',
    icon: 'Shield',
    nameField: 'generalname'
  },
  railStation: {
    type: 'Rail Station',
    url: 'NSW_FOI_Transport_Facilities/MapServer/1',
    icon: 'Train',
    nameField: 'generalname'
  }
};

const AMENITY_COLORS: Record<string, string> = {
  'Primary School': '#FF6B6B',
  'High School': '#4ECDC4',
  'Technical College': '#45B7D1',
  'University': '#96CEB4',
  'Hospital': '#FF4858',
  'Ambulance Station': '#ED4C67',
  'Police Station': '#3498DB',
  'Fire Station': '#E74C3C',
  'SES Station': '#F1C40F',
  'Rail Station': '#9B59B6'
};

const getConfigKeyByType = (type: string): string => {
  return Object.entries(AMENITY_CONFIGS).find(
    ([_, config]) => config.type === type
  )?.[0] || '';
};

interface Amenity {
  type: string;
  name: string;
  distance: number;
  icon: string;
  geometry: {
    x: number;
    y: number;
  };
}

const iconPaths = {
  School: 'M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z',
  GraduationCap: 'M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z',
  Building2: 'M6 22V4c0-.27.2-.5.45-.5h11.1c.25 0 .45.23.45.5v18H6zm1-2h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V6H7v2z',
  Hospital: 'M8 20h3v-4h2v4h3v-7H8v7zm11-11h-1V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v5H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zM6 4c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v5H6V4zm13 15c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm2 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
  Truck: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z',
  Shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.4 9.16-7 10.36-3.6-1.2-7-5.53-7-10.36V6.3l7-3.12z',
  Flame: 'M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11zm0-20c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm3.5 12.5L12 17l-3.5-1.5V13l2.5 1.5V11l-4-5 4 2 1-4 1 4 4-2-4 5v3.5l2.5-1.5v2.5z',
  LifeBuoy: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm2 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z',
  Train: 'M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z',
  MapPin: 'M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11zm0-20c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm3.5 12.5L12 17l-3.5-1.5V13l2.5 1.5V11l-4-5 4 2 1-4 1 4 4-2-4 5v3.5l2.5-1.5v2.5z'
};

function calculateLabelOffset(amenities: Amenity[], currentAmenity: Amenity): number {
  const LABEL_HEIGHT = 20; // Height of our label in pixels
  const DISTANCE_THRESHOLD = 100; // Distance in meters to check for overlaps
  
  // Find nearby amenities
  const nearbyAmenities = amenities.filter(a => {
    if (a === currentAmenity) return false;
    
    const dx = a.geometry.x - currentAmenity.geometry.x;
    const dy = a.geometry.y - currentAmenity.geometry.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < DISTANCE_THRESHOLD;
  });
  
  if (nearbyAmenities.length === 0) return 0;
  
  // Sort by distance to ensure consistent ordering
  nearbyAmenities.sort((a, b) => {
    const distA = Math.abs(a.geometry.y - currentAmenity.geometry.y);
    const distB = Math.abs(b.geometry.y - currentAmenity.geometry.y);
    return distA - distB;
  });
  
  // Find the first non-overlapping position
  let offset = 0;
  const usedOffsets = new Set(nearbyAmenities.map((_, i) => i * LABEL_HEIGHT));
  
  while (usedOffsets.has(offset)) {
    offset += LABEL_HEIGHT;
  }
  
  return offset;
}

const createMarkerIcon = (iconName: string, amenityType: string, amenityName: string, offset: number) => {
  const iconClass = {
    School: 'fa-school',
    GraduationCap: 'fa-graduation-cap',
    Building2: 'fa-building',
    Hospital: 'fa-hospital',
    Truck: 'fa-truck',
    Shield: 'fa-shield',
    Flame: 'fa-fire',
    LifeBuoy: 'fa-life-ring',
    Train: 'fa-train',
    MapPin: 'fa-map-marker'
  }[iconName];

  const color = AMENITY_COLORS[amenityType];
  const showLabels = useMapStore.getState().showAmenityLabels;

  return L.divIcon({
    html: `
      <div class="flex flex-col items-center" style="transform: translateY(-${offset}px)">
        <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center" style="border: 2px solid ${color}">
          <i class="fas ${iconClass}" style="color: ${color};"></i>
        </div>
        ${showLabels ? `
          <span class="text-[10px] font-semibold whitespace-nowrap bg-white/75 px-1 rounded mt-1" style="color: ${color};">
            ${amenityName}
          </span>
        ` : ''}
      </div>
    `,
    className: 'amenity-marker',
    iconSize: [40, showLabels ? 60 : 40],
    iconAnchor: [20, showLabels ? 30 + offset : 20],
    popupAnchor: [0, showLabels ? -30 - offset : -20]
  });
};

export function AmenitiesLegend({ visible }: { visible: boolean }) {
  const showLabels = useMapStore((state) => state.showAmenityLabels);
  const setShowLabels = useMapStore((state) => state.setShowAmenityLabels);
  const isShowingAmenities = useMapStore((state) => state.isShowingAmenities);
  const currentTab = useMapStore((state) => state.currentTab);

  if (!visible || !isShowingAmenities || currentTab !== 'amenities') return null;

  return (
    <Card className="absolute top-4 right-4 z-[1000] w-64">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Amenities Legend</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Labels</span>
            <Switch
              checked={showLabels}
              onCheckedChange={setShowLabels}
              size="sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(AMENITY_COLORS)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, color]) => {
              const config = Object.values(AMENITY_CONFIGS).find(c => c.type === type);
              if (!config) return null;

              const iconClass = {
                School: 'fa-school',
                GraduationCap: 'fa-graduation-cap',
                Building2: 'fa-building',
                Hospital: 'fa-hospital',
                Truck: 'fa-truck',
                Shield: 'fa-shield',
                Flame: 'fa-fire',
                LifeBuoy: 'fa-life-ring',
                Train: 'fa-train',
                MapPin: 'fa-map-marker'
              }[config.icon];

              return (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center" style={{ border: `2px solid ${color}` }}>
                    <i className={`fas ${iconClass}`} style={{ color }} />
                  </div>
                  <span className="text-sm">{type}</span>
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );
};

export function AmenitiesTab() {
  const map = useMapStore((state) => state.mapInstance);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setBufferGeometry = useMapStore((state) => state.setBufferGeometry);
  const [loading, setLoading] = useState(true);
  const searchRadius = useMapStore((state) => state.searchRadius ?? 1.5);
  const setSearchRadius = useMapStore((state) => state.setSearchRadius);
  const [amenities, setAmenities] = useState<Array<Amenity> | null>(null);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const setLayerGroups = useMapStore((state) => state.setLayerGroups);
  const [isShowingOnMap, setIsShowingOnMap] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);
  const setIsShowingAmenities = useMapStore((state) => state.setIsShowingAmenities);

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
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
      }
    };
  }, [map]);

  const addMarkersToMap = async () => {
    if (!map || !amenities?.length) return;
    
    setIsLayerLoading(true);
    
    try {
      // If markers are showing, remove them
      if (isShowingOnMap) {
        if (markersRef.current) {
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
        }
        setIsShowingOnMap(false);
        setIsShowingAmenities(false);
        return;
      }

      const newMarkers: L.Marker[] = [];
      
      // Add markers for all amenities directly (no grouping needed)
      amenities.forEach((amenity) => {
        const config = Object.values(AMENITY_CONFIGS).find(c => c.type === amenity.type);
        if (!config) return;

        // Convert Web Mercator coordinates to Lat/Lng
        const lng = (amenity.geometry.x * 180) / 20037508.34;
        const lat = (Math.atan(Math.exp((amenity.geometry.y * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);
        
        const offset = calculateLabelOffset(amenities, amenity);
        
        const marker = L.marker([lat, lng], {
          icon: createMarkerIcon(config.icon, amenity.type, amenity.name, offset),
          pane: 'amenities-pane'
        });

        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${amenity.name}</h3>
            <p class="text-sm text-gray-600">${amenity.type}</p>
            <p class="text-sm text-gray-600">Distance: ${(amenity.distance/1000).toFixed(2)}km</p>
          </div>
        `, {
          pane: 'amenities-popup-pane'
        });
        
        marker.addTo(map);
        newMarkers.push(marker);
      });
      
      markersRef.current = newMarkers;
      setIsShowingOnMap(true);
      setIsShowingAmenities(true);
      
    } catch (error) {
      console.error('Error adding markers to map:', error);
      setIsShowingOnMap(false);
    } finally {
      setIsLayerLoading(false);
    }
  };

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

  useEffect(() => {
    const unsubscribe = useMapStore.subscribe(
      (state) => {
        // If markers are showing, update them when labels toggle changes
        if (isShowingOnMap && markersRef.current.length > 0 && amenities?.length) {
          // Remove existing markers
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
          
          // Re-add markers with updated labels
          const newMarkers: L.Marker[] = [];
          amenities.forEach((amenity) => {
            const config = Object.values(AMENITY_CONFIGS).find(c => c.type === amenity.type);
            if (!config) return;

            const lng = (amenity.geometry.x * 180) / 20037508.34;
            const lat = (Math.atan(Math.exp((amenity.geometry.y * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);
            
            const offset = calculateLabelOffset(amenities, amenity);
            
            const marker = L.marker([lat, lng], {
              icon: createMarkerIcon(config.icon, amenity.type, amenity.name, offset),
              pane: 'amenities-pane'
            }).bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${amenity.name}</h3>
                <p class="text-sm text-gray-600">${amenity.type}</p>
                <p class="text-sm text-gray-600">Distance: ${(amenity.distance/1000).toFixed(2)}km</p>
              </div>
            `, {
              pane: 'amenities-popup-pane'
            });
            
            marker.addTo(map!);
            newMarkers.push(marker);
          });
          
          markersRef.current = newMarkers;
        }
      }
    );

    return () => unsubscribe();
  }, [isShowingOnMap, amenities, map]);

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
              <i className="fas fa-spinner fa-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : amenities && amenities.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(AMENITY_CONFIGS).map(([key, config]) => {
                const amenitiesOfType = amenities
                  .filter(a => a.type === config.type)
                  .sort((a, b) => a.distance - b.distance);
                
                if (amenitiesOfType.length === 0) return null;
                
                const iconClass = {
                  School: 'fa-school',
                  GraduationCap: 'fa-graduation-cap',
                  Building2: 'fa-building',
                  Hospital: 'fa-hospital',
                  Truck: 'fa-truck',
                  Shield: 'fa-shield',
                  Flame: 'fa-fire',
                  LifeBuoy: 'fa-life-ring',
                  Train: 'fa-train',
                  MapPin: 'fa-map-marker'
                }[config.icon];
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2 font-medium border-b pb-2">
                      <i className={`fas ${iconClass} text-lg text-muted-foreground`} />
                      <span>{config.type}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {amenitiesOfType.length} found
                      </span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {amenitiesOfType.map((amenity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{amenity.name}</span>
                          <span className="text-muted-foreground">
                            {(amenity.distance / 1000).toFixed(1)}km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground mt-4 italic">
                Showing all amenities within {searchRadius}km, sorted by distance
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
            onClick={addMarkersToMap}
            className="w-full"
            disabled={isLayerLoading || !amenities?.length}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin h-4 w-4" />
                {isShowingOnMap ? 'Removing from map...' : 'Adding to map...'}
              </span>
            ) : (
              isShowingOnMap ? 'Hide from Map' : 'Add to Map'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
