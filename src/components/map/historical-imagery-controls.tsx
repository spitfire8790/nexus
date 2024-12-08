import { useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/lib/map-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2 } from '@/components/ui/icons';
import * as L from 'leaflet';
import debounce from 'lodash/debounce';
import type { MapLayer } from '@/lib/map-store';

interface YearConfig {
  year: number;
  url: string;
}

interface HistoricalImageryLayer extends MapLayer {
  years: YearConfig[];
  timeIndex: number;
  maxZoom?: number;
  maxNativeZoom?: number;
  tileSize?: number;
}

const checkTileAvailability = async (
  yearConfig: YearConfig, 
  bounds: L.LatLngBounds, 
  zoom: number,
  mapInstance: L.Map
): Promise<boolean> => {
  try {
    const center = bounds.getCenter();
    const centerPoint = mapInstance.project(center, zoom);
    const centerTile = centerPoint.divideBy(256).floor();
    
    // Check multiple tiles around the center for better availability detection
    const tilesToCheck = [
      centerTile,
      centerTile.add(L.point(1, 0)),
      centerTile.add(L.point(0, 1)),
      centerTile.add(L.point(-1, 0)),
      centerTile.add(L.point(0, -1))
    ];

    for (const tile of tilesToCheck) {
      const proxyUrl = `http://localhost:5174/api/proxy/tileservices/Hosted/HistoricalImagery${yearConfig.year}/MapServer/WMTS/tile/1.0.0/HistoricalImagery${yearConfig.year}/default/default028mm/${zoom}/${tile.y}/${tile.x}`;

      try {
        const response = await fetch(proxyUrl, { 
          method: 'HEAD',
          headers: {
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          }
        });
        
        if (response.ok) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export function HistoricalImageryControls() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const updateTimeIndex = useMapStore((state) => state.updateTimeIndex);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  const imageryLayer = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.tooltipKey === 'historical-imagery') as HistoricalImageryLayer | undefined;

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    if (!imageryLayer?.years || !Array.isArray(value) || value.length === 0) return;
    
    const index = value[0];
    if (index < 0 || index >= imageryLayer.years.length) return;
    
    const yearConfig = imageryLayer.years[index];
    if (availableYears.includes(yearConfig.year)) {
      console.log('Updating to year:', yearConfig.year);
      updateTimeIndex(imageryLayer.id, index);
    }
  }, [imageryLayer, updateTimeIndex, availableYears]);

  // Update tile layer when timeIndex changes
  useEffect(() => {
    if (!map || !imageryLayer?.enabled || !imageryLayer.years) {
      console.log('Historical imagery layer not ready:', { map, enabled: imageryLayer?.enabled, years: imageryLayer?.years });
      return;
    }

    const yearConfig = imageryLayer.years[imageryLayer.timeIndex];
    if (!yearConfig || !availableYears.includes(yearConfig.year)) {
      console.log('Current year not available:', yearConfig?.year);
      return;
    }

    console.log('Updating historical imagery layer:', { 
      year: yearConfig.year,
      url: yearConfig.url,
      timeIndex: imageryLayer.timeIndex 
    });
    
    if (tileLayer) {
      map.removeLayer(tileLayer);
    }

    const proxyUrl = `http://localhost:5174/api/proxy/tileservices/Hosted/HistoricalImagery${yearConfig.year}/MapServer/WMTS/tile/1.0.0/HistoricalImagery${yearConfig.year}/default/default028mm/{z}/{y}/{x}`;

    const newTileLayer = L.tileLayer(proxyUrl, {
      maxZoom: imageryLayer.maxZoom,
      maxNativeZoom: imageryLayer.maxNativeZoom,
      tileSize: imageryLayer.tileSize,
      attribution: imageryLayer.attribution,
      className: imageryLayer.className,
      opacity: imageryLayer.opacity,
      pane: 'overlayPane',
      zIndex: 410
    });

    newTileLayer.addTo(map);
    setTileLayer(newTileLayer);

    return () => {
      if (newTileLayer) {
        map.removeLayer(newTileLayer);
      }
    };
  }, [map, imageryLayer?.enabled, imageryLayer?.timeIndex, imageryLayer?.years, availableYears]);

  // Check availability when map view changes
  useEffect(() => {
    if (!map || !imageryLayer?.years || !imageryLayer.enabled) {
      setAvailableYears([]);
      setIsChecking(false);
      return;
    }

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    setIsChecking(true);
    
    const checkAvailability = async () => {
      const available = [];
      for (const yearConfig of imageryLayer.years) {
        const isAvailable = await checkTileAvailability(yearConfig, bounds, zoom, map);
        if (isAvailable) {
          available.push(yearConfig.year);
        }
      }

      // If current year is not available, find the nearest available year
      if (available.length > 0 && !available.includes(imageryLayer.years[imageryLayer.timeIndex].year)) {
        const currentYear = imageryLayer.years[imageryLayer.timeIndex].year;
        const nearestYear = available.reduce((prev, curr) => 
          Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev
        );
        const nearestIndex = imageryLayer.years.findIndex(y => y.year === nearestYear);
        if (nearestIndex !== -1) {
          updateTimeIndex(imageryLayer.id, nearestIndex);
        }
      }

      setAvailableYears(available);
      setIsChecking(false);
    };

    const debouncedCheck = debounce(checkAvailability, 500);
    debouncedCheck();

    map.on('moveend', debouncedCheck);
    map.on('zoomend', debouncedCheck);

    return () => {
      debouncedCheck.cancel();
      map.off('moveend', debouncedCheck);
      map.off('zoomend', debouncedCheck);
    };
  }, [map, imageryLayer?.enabled, imageryLayer?.years, imageryLayer?.id, imageryLayer?.timeIndex, updateTimeIndex]);

  if (!imageryLayer?.enabled || !imageryLayer.years) {
    console.log('Historical imagery layer not visible:', { 
      enabled: imageryLayer?.enabled, 
      hasYears: Boolean(imageryLayer?.years)
    });
    return null;
  }

  const currentYear = imageryLayer.years[imageryLayer.timeIndex]?.year;
  const isCurrentYearAvailable = availableYears.includes(currentYear);

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] min-w-[300px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Historical Imagery Year</Label>
          {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <Slider
          value={[imageryLayer.timeIndex]}
          min={0}
          max={imageryLayer.years.length - 1}
          step={1}
          onValueChange={handleSliderChange}
          disabled={isChecking || availableYears.length === 0}
        />
        <div className="text-center text-sm">
          {isChecking 
            ? 'Checking available years...'
            : availableYears.length === 0 
              ? 'No imagery available for this location'
              : `Year: ${currentYear}${!isCurrentYearAvailable ? ' (not available)' : ''}`
          }
        </div>
        <div className="text-xs text-muted-foreground">
          Available years: {availableYears.sort((a, b) => a - b).join(', ')}
        </div>
      </div>
    </div>
  );
}