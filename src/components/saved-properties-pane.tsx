import { useEffect } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import * as L from 'leaflet';

export function SavedPropertiesPane() {
  const savedProperties = useMapStore((state) => state.savedProperties);
  const removeSavedProperty = useMapStore((state) => state.removeSavedProperty);
  const map = useMapStore((state) => state.mapInstance);
  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);

  const handleRemove = async (id: string) => {
    await removeSavedProperty(id);
  };

  const handlePropertyClick = async (property: any) => {
    if (!map) return;

    try {
      console.log('Property:', property);

      // Handle nested GeoJSON Feature structure
      const geometry = property.geometry.type === 'Feature' 
        ? property.geometry.geometry 
        : property.geometry;

      const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.rings[0];
      
      // Calculate centroid
      const centroid = coords.reduce(
        (acc: [number, number], curr: number[]) => [acc[0] + curr[0], acc[1] + curr[1]],
        [0, 0]
      ).map((sum: number) => sum / coords.length);

      // Convert to Web Mercator if needed
      const point = geometry.type === 'Polygon' 
        ? L.CRS.EPSG3857.project(L.latLng(centroid[1], centroid[0]))
        : L.point(centroid[0], centroid[1]);

      const queryGeometry = {
        spatialReference: {
          latestWkid: 3857,
          wkid: 102100
        },
        x: point.x,
        y: point.y
      };

      const response = await fetch(
        `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/property?geometry=${encodeURIComponent(JSON.stringify(queryGeometry))}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const propId = await response.text();

      if (propId) {
        const [boundaryResponse, lotsResponse, addressResponse] = await Promise.all([
          fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/boundary?id=${propId}&Type=property`),
          fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${propId}`),
          fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`)
        ]);

        if (!boundaryResponse.ok || !lotsResponse.ok || !addressResponse.ok) {
          throw new Error('Failed to fetch property details');
        }

        const [boundaryData] = await boundaryResponse.json();
        const lotsData = await lotsResponse.json();
        const address = await addressResponse.text();

        if (boundaryData?.geometry) {
          setSelectedProperty({
            ...boundaryData,
            propId,
            lots: lotsData || [],
            address: address.replace(/^"|"$/g, '')
          });

          // Create bounds and fly to them
          const layer = L.geoJSON(property.geometry);
          const bounds = layer.getBounds();
          map.flyToBounds(bounds, { 
            padding: [50, 50],
            duration: 1 
          });
        }
      }
    } catch (error) {
      console.error('Error loading property details:', error);
    }
  };

  return (
    <div className="border-t">
      <div className="p-4">
        <h2 className="font-semibold">Saved Properties</h2>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 p-4">
          {savedProperties.map((property) => (
            <div key={property.id} className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-sm truncate text-left justify-start flex-1 px-2"
                onClick={() => handlePropertyClick(property)}
              >
                {property.address}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(property.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 