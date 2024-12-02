import { Card } from '@/components/ui/card';
import { useMapStore } from '@/lib/map-store';
import { useMap } from 'react-leaflet';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ZONE_OPTIONS } from '@/lib/map-store';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegendItem {
  code: string;
  description: string;
  color: string;
  outlineColor?: string;
}

interface ZoneColor {
  fill: string;
  outline: string;
}

const ZONE_COLORS: Record<string, ZoneColor> = {
  // Special zones
  '2(a)': { fill: 'rgb(255,166,163)', outline: 'rgb(0,0,0)' },
  
  // A zones
  'A': { fill: 'rgb(252,119,110)', outline: 'rgb(0,0,0)' },
  'AGB': { fill: 'rgb(250,232,197)', outline: 'rgb(0,0,0)' },
  
  // B zones
  'B': { fill: 'rgb(99,240,245)', outline: 'rgb(0,0,0)' },
  'B1': { fill: 'rgb(201,255,249)', outline: 'rgb(0,0,0)' },
  'B2': { fill: 'rgb(98,240,245)', outline: 'rgb(0,0,0)' },
  'B3': { fill: 'rgb(0,194,237)', outline: 'rgb(0,0,0)' },
  'B4': { fill: 'rgb(149,157,194)', outline: 'rgb(0,0,0)' },
  'B5': { fill: 'rgb(125,160,171)', outline: 'rgb(0,0,0)' },
  'B6': { fill: 'rgb(149,191,204)', outline: 'rgb(0,0,0)' },
  'B7': { fill: 'rgb(186,214,222)', outline: 'rgb(0,0,0)' },
  
  // C zones
  'C': { fill: 'rgb(186,214,222)', outline: 'rgb(0,0,0)' },
  'C1': { fill: 'rgb(230,153,0)', outline: 'rgb(0,0,0)' },
  'C2': { fill: 'rgb(240,174,60)', outline: 'rgb(0,0,0)' },
  'C3': { fill: 'rgb(247,197,104)', outline: 'rgb(0,0,0)' },
  'C4': { fill: 'rgb(255,218,150)', outline: 'rgb(0,0,0)' },
  'CA': { fill: 'transparent', outline: 'rgb(0,92,230)' },
  
  // D zones
  'D': { fill: 'rgb(149,157,194)', outline: 'rgb(0,0,0)' },
  'DM': { fill: 'rgb(255,255,255)', outline: 'rgb(255,0,0)' },
  'DR': { fill: 'rgb(255,255,112)', outline: 'rgb(0,0,0)' },
  
  // E zones
  'E': { fill: 'rgb(0,194,237)', outline: 'rgb(0,0,0)' },
  'E1': { fill: 'rgb(153,204,255)', outline: 'rgb(0,0,0)' },
  'E2': { fill: 'rgb(180,198,231)', outline: 'rgb(0,0,0)' },
  'E3': { fill: 'rgb(142,169,219)', outline: 'rgb(0,0,0)' },
  'E4': { fill: 'rgb(153,153,255)', outline: 'rgb(0,0,0)' },
  'E5': { fill: 'rgb(153,102,255)', outline: 'rgb(0,0,0)' },
  'EM': { fill: 'rgb(149,191,204)', outline: 'rgb(0,0,0)' },
  'ENP': { fill: 'rgb(255,214,64)', outline: 'rgb(0,0,0)' },
  'ENT': { fill: 'rgb(118,192,214)', outline: 'rgb(0,0,0)' },
  'ENZ': { fill: 'rgb(115,178,115)', outline: 'rgb(0,0,0)' },
  'EP': { fill: 'rgb(252,249,182)', outline: 'rgb(0,0,0)' },
  
  // F-I zones
  'F': { fill: 'rgb(255,255,161)', outline: 'rgb(0,0,0)' },
  'G': { fill: 'rgb(255,255,112)', outline: 'rgb(0,0,0)' },
  'H': { fill: 'rgb(85,255,0)', outline: 'rgb(0,0,0)' },
  'I': { fill: 'rgb(211,255,191)', outline: 'rgb(0,0,0)' },
  
  // Industrial zones
  'IN1': { fill: 'rgb(221,184,245)', outline: 'rgb(0,0,0)' },
  'IN2': { fill: 'rgb(243,219,255)', outline: 'rgb(0,0,0)' },
  'IN3': { fill: 'rgb(197,149,232)', outline: 'rgb(0,0,0)' },
  
  // M zones
  'MAP': { fill: 'rgb(230,255,255)', outline: 'rgb(0,0,0)' },
  'MU': { fill: 'rgb(149,157,194)', outline: 'rgb(0,0,0)' },
  'MU1': { fill: 'rgb(149,157,194)', outline: 'rgb(0,0,0)' },
  
  // P zones
  'P': { fill: 'rgb(179,204,252)', outline: 'rgb(0,0,0)' },
  'PAE': { fill: 'rgb(244,236,73)', outline: 'rgb(0,0,0)' },
  'PEP': { fill: 'rgb(116,179,116)', outline: 'rgb(0,0,0)' },
  'PRC': { fill: 'rgb(84,153,128)', outline: 'rgb(0,0,0)' },
  
  // R zones
  'R': { fill: 'rgb(179,252,179)', outline: 'rgb(0,0,0)' },
  'R1': { fill: 'rgb(255,207,255)', outline: 'rgb(0,0,0)' },
  'R2': { fill: 'rgb(255,166,163)', outline: 'rgb(0,0,0)' },
  'R3': { fill: 'rgb(255,119,110)', outline: 'rgb(0,0,0)' },
  'R4': { fill: 'rgb(255,72,59)', outline: 'rgb(0,0,0)' },
  'R5': { fill: 'rgb(255,217,217)', outline: 'rgb(0,0,0)' },
  
  // RA zones
  'RAC': { fill: 'rgb(230,203,151)', outline: 'rgb(0,0,0)' },
  'RAZ': { fill: 'rgb(230,203,151)', outline: 'rgb(0,0,0)' },
  
  // RE zones
  'RE1': { fill: 'rgb(85,255,0)', outline: 'rgb(0,0,0)' },
  'RE2': { fill: 'rgb(211,255,190)', outline: 'rgb(0,0,0)' },
  'REC': { fill: 'rgb(174,242,179)', outline: 'rgb(0,0,0)' },
  'REZ': { fill: 'rgb(222,184,245)', outline: 'rgb(0,0,0)' },
  
  // RO-RW zones
  'RO': { fill: 'rgb(85,255,0)', outline: 'rgb(0,0,0)' },
  'RP': { fill: 'rgb(211,255,190)', outline: 'rgb(0,0,0)' },
  'RW': { fill: 'rgb(211,184,245)', outline: 'rgb(0,0,0)' },
  
  // RU zones
  'RU1': { fill: 'rgb(237,216,173)', outline: 'rgb(0,0,0)' },
  'RU2': { fill: 'rgb(230,202,151)', outline: 'rgb(0,0,0)' },
  'RU3': { fill: 'rgb(222,192,131)', outline: 'rgb(0,0,0)' },
  'RU4': { fill: 'rgb(214,188,111)', outline: 'rgb(0,0,0)' },
  'RU5': { fill: 'rgb(214,161,156)', outline: 'rgb(0,0,0)' },
  'RU6': { fill: 'rgb(199,158,76)', outline: 'rgb(0,0,0)' },
  'RUR': { fill: 'rgb(239,228,190)', outline: 'rgb(0,0,0)' },
  
  // S zones
  'SET': { fill: 'rgb(255,210,220)', outline: 'rgb(0,0,0)' },
  'SP1': { fill: 'rgb(255,255,161)', outline: 'rgb(0,0,0)' },
  'SP2': { fill: 'rgb(255,255,112)', outline: 'rgb(0,0,0)' },
  'SP3': { fill: 'rgb(255,255,0)', outline: 'rgb(0,0,0)' },
  'SP4': { fill: 'rgb(255,255,0)', outline: 'rgb(0,0,0)' },
  'SP5': { fill: 'rgb(230,230,0)', outline: 'rgb(0,0,0)' },
  'SPU': { fill: 'rgb(255,255,0)', outline: 'rgb(0,0,0)' },
  
  // T-U zones
  'T': { fill: 'rgb(252,210,239)', outline: 'rgb(0,0,0)' },
  'U': { fill: 'rgb(202,252,237)', outline: 'rgb(0,0,0)' },
  'UD': { fill: 'rgb(255,127,99)', outline: 'rgb(0,0,0)' },
  'UL': { fill: 'rgb(255,255,255)', outline: 'rgb(0,0,0)' },
  'UR': { fill: 'rgb(255,119,110)', outline: 'rgb(0,0,0)' },
  
  // W zones
  'W': { fill: 'rgb(252,196,184)', outline: 'rgb(0,0,0)' },
  'W1': { fill: 'rgb(217,255,242)', outline: 'rgb(0,0,0)' },
  'W2': { fill: 'rgb(153,255,221)', outline: 'rgb(0,0,0)' },
  'W3': { fill: 'rgb(51,255,187)', outline: 'rgb(0,0,0)' },
  'W4': { fill: 'rgb(0,230,169)', outline: 'rgb(0,0,0)' },
  'WFU': { fill: 'rgb(17,130,194)', outline: 'rgb(0,0,0)' }
};

function getZoneColor(code: string): string {
  // Check for exact matches first
  const zoneColor = ZONE_COLORS[code];
  if (zoneColor) return zoneColor.fill;

  // Check for prefix matches
  for (const [prefix, color] of Object.entries(ZONE_COLORS)) {
    if (code.startsWith(prefix)) return color.fill;
  }

  // Default color for unknown zones
  return 'rgb(200,200,200)';
}

export function ZoningLegend() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const updateSelectedZones = useMapStore((state) => state.updateSelectedZones);
  const [visibleItems, setVisibleItems] = useState<LegendItem[]>([]);
  
  const { zoningLayer, selectedZones } = useMemo(() => {
    const layer = layerGroups
      .flatMap(group => group.layers)
      .find(layer => layer.id === 'zoning');
    
    const zones = layer?.selectedZones || [];
    
    return { zoningLayer: layer, selectedZones: zones };
  }, [layerGroups]);

  const handleZoneClick = useCallback((zoneCode: string) => {
    const newSelectedZones = selectedZones.includes(zoneCode)
      ? selectedZones.filter(z => z !== zoneCode)
      : [...selectedZones, zoneCode];
    
    updateSelectedZones('zoning', newSelectedZones);
  }, [selectedZones, updateSelectedZones]);

  const clearFilters = useCallback(() => {
    updateSelectedZones('zoning', []);
  }, [updateSelectedZones]);

  const legendItems = useMemo(() => 
    ZONE_OPTIONS
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(zone => ({
        ...zone,
        color: getZoneColor(zone.code)
      }))
  , []);

  const updateVisibleItems = useCallback(async () => {
    if (!zoningLayer?.enabled || !zoningLayer.url) {
      console.log('Zoning layer not enabled or no URL');
      setVisibleItems([]);
      return;
    }

    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const bbox = [sw.lng, sw.lat, ne.lng, ne.lat].join(',');

      // Create the query URL for the identify operation
      const identifyUrl = `${zoningLayer.url}/identify`;
      const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify({
          spatialReference: { wkid: 4326 },
          rings: [[[sw.lng, sw.lat], [ne.lng, sw.lat], [ne.lng, ne.lat], [sw.lng, ne.lat], [sw.lng, sw.lat]]]
        }),
        geometryType: 'esriGeometryPolygon',
        sr: '4326',
        layers: 'all:' + zoningLayer.layerId,
        tolerance: '3',
        mapExtent: bbox,
        imageDisplay: '800,600,96',
        returnGeometry: 'false'
      });

      // Fetch the data
      const response = await fetch(`${identifyUrl}?${params}`);
      const data = await response.json();
      console.log('Identify response:', data);

      if (!data?.results) {
        console.log('No results from identify operation');
        // Show all items if no results (might be zoomed out too far)
        setVisibleItems(
          selectedZones.length > 0 
            ? legendItems.filter(item => selectedZones.includes(item.code))
            : legendItems
        );
        return;
      }

      // Extract zone details from the results
      const zoneDetails = new Map<string, { landUse: string; purpose: string }>();
      data.results.forEach((f: any) => {
        const zoneCode = f.attributes?.Zone;
        const landUse = f.attributes?.['Land Use'];
        // Only include purpose if it's not null/undefined/"Null"/"null"
        const purpose = f.attributes?.Purpose;
        const cleanPurpose = purpose && purpose.toLowerCase() !== 'null' ? purpose : '';
        
        if (zoneCode) {
          zoneDetails.set(zoneCode, {
            landUse: landUse || '',
            purpose: cleanPurpose
          });
        }
      });
      
      console.log('Zone details:', Object.fromEntries(zoneDetails));

      // Filter legend items to show only zones in view
      const filteredItems = Array.from(zoneDetails.entries())
        .map(([code, details]) => ({
          code,
          description: `${code}: ${details.landUse}${details.purpose ? ` (${details.purpose})` : ''}`.trim(),
          color: getZoneColor(code)
        }))
        .sort((a, b) => a.code.localeCompare(b.code)); // Sort alphabetically by code

      // Add any selected zones that aren't already in the filtered items
      if (selectedZones.length > 0) {
        const existingCodes = new Set(filteredItems.map(item => item.code));
        const selectedItems = legendItems
          .filter(item => selectedZones.includes(item.code) && !existingCodes.has(item.code));
        filteredItems.push(...selectedItems);
        // Sort again after adding selected items
        filteredItems.sort((a, b) => a.code.localeCompare(b.code));
      }

      console.log('Filtered items:', filteredItems);
      setVisibleItems(filteredItems.length > 0 ? filteredItems : legendItems);
    } catch (error) {
      console.error('Error querying zoning features:', error);
      // If there's an error, show all items
      setVisibleItems(legendItems);
    }
  }, [map, zoningLayer, selectedZones, legendItems]);

  useEffect(() => {
    console.log('Effect running, layer enabled:', zoningLayer?.enabled);
    if (zoningLayer?.enabled) {
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
  }, [map, zoningLayer?.enabled, updateVisibleItems]);

  if (!zoningLayer?.enabled) {
    console.log('Legend not showing: layer not enabled');
    return null;
  }

  if (visibleItems.length === 0) {
    console.log('Legend not showing: no visible items');
    return null;
  }

  return (
    <Card className="absolute bottom-4 left-4 p-4 z-[1000] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Land Zoning</h3>
          {selectedZones.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const zoneColor = ZONE_COLORS[item.code];
            const style = zoneColor ? {
              backgroundColor: zoneColor.fill,
              border: `1px solid ${zoneColor.outline}`
            } : {
              backgroundColor: item.color,
              border: '1px solid rgb(0,0,0)'
            };
            
            const isSelected = selectedZones.includes(item.code);
            
            // More thorough description cleaning
            const description = item.description
              ?.replace(/\s*\(\s*\)\s*$/, '') // Remove empty parentheses with any surrounding whitespace
              ?.replace(`${item.code}:`, '') // Remove the code prefix
              ?.replace(item.code, '') // Remove any remaining instance of the code
              ?.trim();
            
            return (
              <div 
                key={item.code} 
                className={cn(
                  "flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent/50 transition-colors",
                  isSelected && "bg-accent/80 hover:bg-accent/70"
                )}
                onClick={() => handleZoneClick(item.code)}
                role="button"
                tabIndex={0}
              >
                <div 
                  className={cn(
                    "w-4 h-4 rounded-sm",
                    isSelected && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={style}
                />
                <span className={cn(
                  "text-sm text-muted-foreground",
                  isSelected && "font-medium text-foreground"
                )}>
                  {item.code}: {description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
