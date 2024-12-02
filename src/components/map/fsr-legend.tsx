import { Card } from '@/components/ui/card';
import { useMapStore } from '@/lib/map-store';
import { useMap } from 'react-leaflet';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from "@/lib/utils";
import * as EL from 'esri-leaflet';

interface LegendItem {
  range: string;
  color: string;
  description: string;
}

const FSR_COLORS = [
  { range: '0-0.39', color: 'rgb(201,255,249)', description: '0 - 0.39' },
  { range: '0.4-0.44', color: 'rgb(153,255,253)', description: '0.4 - 0.44' },
  { range: '0.45-0.49', color: 'rgb(102,242,255)', description: '0.45 - 0.49' },
  { range: '0.5-0.54', color: 'rgb(51,218,255)', description: '0.5 - 0.54' },
  { range: '0.55-0.59', color: 'rgb(211,255,191)', description: '0.55 - 0.59' },
  { range: '0.6-0.64', color: 'rgb(195,240,170)', description: '0.6 - 0.64' },
  { range: '0.65-0.69', color: 'rgb(179,224,150)', description: '0.65 - 0.69' },
  { range: '0.7-0.74', color: 'rgb(163,209,130)', description: '0.7 - 0.74' },
  { range: '0.75-0.79', color: 'rgb(149,194,112)', description: '0.75 - 0.79' },
  { range: '0.8-0.84', color: 'rgb(137,181,96)', description: '0.8 - 0.84' },
  { range: '0.85-0.89', color: 'rgb(255,255,191)', description: '0.85 - 0.89' },
  { range: '0.9-0.94', color: 'rgb(255,255,0)', description: '0.9 - 0.94' },
  { range: '0.95-0.99', color: 'rgb(219,219,0)', description: '0.95 - 0.99' },
  { range: '1-1.09', color: 'rgb(237,216,173)', description: '1.0 - 1.09' },
  { range: '1.1-1.19', color: 'rgb(227,200,145)', description: '1.1 - 1.19' },
  { range: '1.2-1.29', color: 'rgb(219,187,123)', description: '1.2 - 1.29' },
  { range: '1.3-1.39', color: 'rgb(209,172,98)', description: '1.3 - 1.39' },
  { range: '1.4-1.49', color: 'rgb(199,158,76)', description: '1.4 - 1.49' },
  { range: '1.5-1.99', color: 'rgb(255,217,217)', description: '1.5 - 1.99' },
  { range: '2-2.49', color: 'rgb(255,166,163)', description: '2.0 - 2.49' },
  { range: '2.5-2.99', color: 'rgb(255,119,110)', description: '2.5 - 2.99' },
  { range: '3-3.49', color: 'rgb(255,72,59)', description: '3.0 - 3.49' },
  { range: '3.5-3.99', color: 'rgb(204,102,102)', description: '3.5 - 3.99' },
  { range: '4-4.49', color: 'rgb(233,191,255)', description: '4.0 - 4.49' },
  { range: '4.5-4.99', color: 'rgb(212,137,250)', description: '4.5 - 4.99' },
  { range: '5-5.99', color: 'rgb(190,81,240)', description: '5.0 - 5.99' },
  { range: '6-6.99', color: 'rgb(255,115,222)', description: '6.0 - 6.99' },
  { range: '7-7.99', color: 'rgb(204,102,153)', description: '7.0 - 7.99' },
  { range: '8-8.99', color: 'rgb(186,84,135)', description: '8.0 - 8.99' },
  { range: '9-9.99', color: 'rgb(255,235,173)', description: '9.0 - 9.99' },
  { range: '10-10.99', color: 'rgb(255,214,143)', description: '10.0 - 10.99' },
  { range: '11-11.99', color: 'rgb(255,199,0)', description: '11.0 - 11.99' },
  { range: '12-12.99', color: 'rgb(255,170,0)', description: '12.0 - 12.99' },
  { range: '13-13.99', color: 'rgb(230,152,0)', description: '13.0 - 13.99' },
  { range: '14+', color: 'rgb(255,140,0)', description: '14.0+' }
];

export function FSRLegend() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const [visibleItems, setVisibleItems] = useState<LegendItem[]>([]);
  
  const { fsrLayer } = useMemo(() => {
    const layer = layerGroups
      .flatMap(group => group.layers)
      .find(layer => layer.id === 'fsr');
    
    return { fsrLayer: layer };
  }, [layerGroups]);

  const updateVisibleItems = useCallback(async () => {
    if (!fsrLayer?.enabled || !fsrLayer.url) {
      setVisibleItems([]);
      return;
    }

    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const bbox = [sw.lng, sw.lat, ne.lng, ne.lat].join(',');

      // Get the actual pixel dimensions of the map
      const mapSize = map.getSize();

      const identifyUrl = `${fsrLayer.url}/identify`;
      const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify({
          spatialReference: { wkid: 4326 },
          rings: [[[sw.lng, sw.lat], [ne.lng, sw.lat], [ne.lng, ne.lat], [sw.lng, ne.lat], [sw.lng, sw.lat]]]
        }),
        geometryType: 'esriGeometryPolygon',
        sr: '4326',
        layers: 'all:' + fsrLayer.layerId,
        tolerance: '1',
        mapExtent: bbox,
        imageDisplay: `${mapSize.x},${mapSize.y},96`,
        returnGeometry: 'false',
        maxAllowableOffset: '0.1'
      });

      console.log('Querying FSR features with URL:', `${identifyUrl}?${params}`);
      const response = await fetch(`${identifyUrl}?${params}`);
      const data = await response.json();
      console.log('FSR identify response:', data);

      // Extract unique FSR values from results
      const uniqueFsrValues = new Set<number>();
      if (data?.results) {
        data.results.forEach((result: any) => {
          // Check both FSR and Floor Space Ratio fields
          const fsr = result.attributes?.FSR || result.attributes?.['Floor Space Ratio'];
          if (fsr) {
            // Convert string to number if needed
            const fsrValue = typeof fsr === 'string' ? parseFloat(fsr) : fsr;
            if (!isNaN(fsrValue)) {
              uniqueFsrValues.add(fsrValue);
            }
          }
        });
      }
      console.log('Unique FSR values in viewport:', Array.from(uniqueFsrValues));

      // First, filter by viewport if we have results
      let viewportFilteredItems = FSR_COLORS;
      if (uniqueFsrValues.size > 0) {
        viewportFilteredItems = FSR_COLORS.filter(item => {
          const [minStr, maxStr] = item.range.split('-');
          const min = Number(minStr);
          const max = maxStr === '+' ? Infinity : Number(maxStr);
          
          // Check if any FSR value in view falls within this range
          const matches = Array.from(uniqueFsrValues).some(fsr => fsr >= min && fsr <= max);
          if (matches) {
            console.log(`FSR range ${item.range} matches viewport values`);
          }
          return matches;
        });
      }
      console.log('Viewport filtered items:', viewportFilteredItems);

      // Then, apply any active FSR range filter to the viewport-filtered items
      if (fsrLayer.fsrRange) {
        const finalItems = viewportFilteredItems.filter(item => {
          const [min] = item.range.split('-').map(Number);
          return min >= fsrLayer.fsrRange!.min && min <= fsrLayer.fsrRange!.max;
        });
        console.log('Final items after FSR range filter:', finalItems);
        setVisibleItems(finalItems);
      } else {
        setVisibleItems(viewportFilteredItems);
      }

    } catch (error) {
      console.error('Error querying FSR features:', error);
      setVisibleItems(FSR_COLORS);
    }
  }, [map, fsrLayer]);

  useEffect(() => {
    if (fsrLayer?.enabled) {
      updateVisibleItems();
      map.on('moveend', updateVisibleItems);
      map.on('zoomend', updateVisibleItems);
    } else {
      setVisibleItems([]);
    }

    return () => {
      map.off('moveend', updateVisibleItems);
      map.off('zoomend', updateVisibleItems);
    };
  }, [map, fsrLayer?.enabled, updateVisibleItems]);

  if (!fsrLayer?.enabled || visibleItems.length === 0) {
    return null;
  }

  return (
    <Card className="absolute bottom-4 left-4 p-4 z-[1000] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Floor Space Ratio (n:1)</h3>
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <div 
              key={item.range} 
              className="flex items-center gap-2 p-1"
            >
              <div 
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 