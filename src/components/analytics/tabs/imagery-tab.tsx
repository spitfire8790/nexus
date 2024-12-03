import { useEffect, useState, useCallback } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import * as L from 'leaflet';

interface ImageryLayer {
  year: number;
  url: string;
  available: boolean;
}

const IMAGERY_LAYERS: ImageryLayer[] = [
  { 
    year: 1947, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1947/MapServer/WMTS/tile/1.0.0/HistoricalImagery1947/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1951, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1951/MapServer/WMTS/tile/1.0.0/HistoricalImagery1951/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1955, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1955/MapServer/WMTS/tile/1.0.0/HistoricalImagery1955/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1965, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1965/MapServer/WMTS/tile/1.0.0/HistoricalImagery1965/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1966, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1966/MapServer/WMTS/tile/1.0.0/HistoricalImagery1966/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1971, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1971/MapServer/WMTS/tile/1.0.0/HistoricalImagery1971/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1975, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1975/MapServer/WMTS/tile/1.0.0/HistoricalImagery1975/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1976, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1976/MapServer/WMTS/tile/1.0.0/HistoricalImagery1976/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1978, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1978/MapServer/WMTS/tile/1.0.0/HistoricalImagery1978/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 1980, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery1980/MapServer/WMTS/tile/1.0.0/HistoricalImagery1980/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 2004, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery2004/MapServer/WMTS/tile/1.0.0/HistoricalImagery2004/default/default028mm/{z}/{y}/{x}', 
    available: true 
  },
  { 
    year: 2005, 
    url: '/nsw-spatial/tileservices/Hosted/HistoricalImagery2005/MapServer/WMTS/tile/1.0.0/HistoricalImagery2005/default/default028mm/{z}/{y}/{x}', 
    available: true 
  }
];

// Add this function at the top level
const ensureMapPanes = (map: L.Map) => {
  if (!map.getPane('imagery-pane')) {
    map.createPane('imagery-pane');
    map.getPane('imagery-pane')!.style.zIndex = '400';
  }
};

// Function to check layer availability
const checkLayerAvailability = async (layer: ImageryLayer): Promise<boolean> => {
  try {
    const baseUrl = layer.url.split('/WMTS')[0];
    const response = await fetch(`${baseUrl}?f=json`);
    const data = await response.json();
    return !data.error;
  } catch {
    return false;
  }
};

export function ImageryTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<L.TileLayer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageryMap, setImageryMap] = useState<L.Map | null>(null);
  const [availableLayers, setAvailableLayers] = useState<ImageryLayer[]>(IMAGERY_LAYERS);

  // Initialize map after component mounts
  useEffect(() => {
    // Wait for next tick to ensure container is mounted
    const container = document.getElementById('imagery-map');
    if (!container) return;

    const map = L.map(container, {
      center: [
        selectedProperty?.latitude || -33.8688,
        selectedProperty?.longitude || 151.2093
      ],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
      maxZoom: 18,
      minZoom: 10
    });

    // Add a base tile layer first
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap, CartoDB',
      maxZoom: 18
    }).addTo(map);

    // Force a resize and set state
    map.invalidateSize();
    setImageryMap(map);

    return () => {
      if (map) {
        map.eachLayer((layer) => map.removeLayer(layer));
        map.remove();
        setImageryMap(null);
      }
    };
  }, []);

  // Separate effect for updating view when property changes
  useEffect(() => {
    if (!imageryMap || !selectedProperty?.latitude || !selectedProperty?.longitude) return;
    
    imageryMap.setView(
      [selectedProperty.latitude, selectedProperty.longitude],
      16
    );
  }, [imageryMap, selectedProperty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentLayerIndex(current => 
          current === availableLayers.length - 1 ? 0 : current + 1
        );
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Query available layers on mount
  useEffect(() => {
    const queryLayers = async () => {
      setIsLoading(true);
      try {
        const checkedLayers = await Promise.all(
          IMAGERY_LAYERS.map(async (layer) => ({
            ...layer,
            available: await checkLayerAvailability(layer)
          }))
        );
        setAvailableLayers(checkedLayers.filter(l => l.available));
      } catch (error) {
        console.error('Error checking layer availability:', error);
        setAvailableLayers(IMAGERY_LAYERS);
      } finally {
        setIsLoading(false);
      }
    };
    queryLayers();
  }, []);

  useEffect(() => {
    if (!imageryMap) return;
    
    try {
      // Remove previous layer
      if (currentLayer && imageryMap.hasLayer(currentLayer)) {
        imageryMap.removeLayer(currentLayer);
      }

      const currentLayerData = availableLayers[currentLayerIndex];
      
      // Create and add new layer
      const layer = L.tileLayer(currentLayerData.url, {
        tileSize: 256,
        attribution: ' NSW Spatial Services'
      }).addTo(imageryMap);

      layer.on('loading', () => setIsLoading(true));
      layer.on('load', () => setIsLoading(false));
      layer.on('error', (error) => {
        console.error('Layer loading error:', error);
        setHasError(true);
        setIsLoading(false);
      });

      setCurrentLayer(layer);

      if (selectedProperty?.latitude && selectedProperty?.longitude) {
        imageryMap.setView(
          [selectedProperty.latitude, selectedProperty.longitude],
          16
        );
      }

    } catch (error) {
      console.error('Error creating layer:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [imageryMap, currentLayerIndex, availableLayers, selectedProperty]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view historical imagery</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div 
        id="imagery-map" 
        className="w-full h-[400px] rounded-lg border"
        style={{ 
          position: 'relative',
          backgroundColor: '#f5f5f5'
        }} 
      />
      
      <Card className="p-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Year: {availableLayers[currentLayerIndex]?.year || ''}
              </span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isLoading || hasError || availableLayers.length === 0}
            >
              {isPlaying ? (
                <><Pause className="h-4 w-4 mr-2" /> Pause</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Play</>
              )}
            </Button>
          </div>
          
          {hasError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load imagery. Please try again later.</AlertTitle>
            </Alert>
          )}

          {availableLayers.length === 0 && !isLoading && (
            <Alert>
              <AlertTitle>No historical imagery available for this location</AlertTitle>
            </Alert>
          )}
          
          <Slider
            value={[currentLayerIndex]}
            max={availableLayers.length - 1}
            step={1}
            onValueChange={(value) => {
              setCurrentLayerIndex(value[0]);
              setIsPlaying(false);
            }}
            disabled={isLoading || availableLayers.length === 0}
          />

          <div className="grid grid-cols-12 gap-1 text-xs text-muted-foreground mt-2">
            {availableLayers.map((layer, index) => (
              <div
                key={layer.year}
                className={`text-center ${index === currentLayerIndex ? 'font-bold text-primary' : ''}`}
                style={{ 
                  gridColumn: `span ${Math.floor(12 / availableLayers.length)} / span ${Math.floor(12 / availableLayers.length)}`
                }}
              >
                {layer.year}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}