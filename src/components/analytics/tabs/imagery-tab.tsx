import { useEffect, useState, useCallback } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import * as L from 'leaflet';
import * as EL from 'esri-leaflet';

interface ImageryLayer {
  year: number;
  url: string;
  available: boolean;
}

const IMAGERY_LAYERS: ImageryLayer[] = [
  { year: 1947, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1947/MapServer', available: true },
  { year: 1951, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1951/MapServer', available: true },
  { year: 1955, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1955/MapServer', available: true },
  { year: 1965, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1965/MapServer', available: true },
  { year: 1966, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1966/MapServer', available: true },
  { year: 1971, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1971/MapServer', available: true },
  { year: 1975, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1975/MapServer', available: true },
  { year: 1976, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1976/MapServer', available: true },
  { year: 1978, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1978/MapServer', available: true },
  { year: 1980, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery1980/MapServer', available: true },
  { year: 2004, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery2004/MapServer', available: true },
  { year: 2005, url: 'https://portal.spatial.nsw.gov.au/tileservices/Hosted/HistoricalImagery2005/MapServer', available: true }
];

export function ImageryTab() {
  const map = useMapStore((state) => state.mapInstance);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<L.Layer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!selectedProperty || !map) return;

    try {
      const coordinates = selectedProperty.lots?.[0]?.geometry?.rings?.[0];
      
      if (!coordinates || !Array.isArray(coordinates)) {
        throw new Error('No valid coordinates found');
      }

      // Convert Web Mercator coordinates to LatLng
      const latLngs = coordinates.map((coord: number[]) => {
        const point = L.point(coord[0], coord[1]);
        return L.CRS.EPSG3857.unproject(point);
      });

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });

    } catch (error) {
      console.error('Error processing geometry:', error);
      
      if (selectedProperty.latitude && selectedProperty.longitude) {
        const center = L.latLng(selectedProperty.latitude, selectedProperty.longitude);
        map.setView(center, 18);
      }
    }
  }, [selectedProperty, map]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentLayerIndex(current => 
          current === IMAGERY_LAYERS.length - 1 ? 0 : current + 1
        );
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!map) return;

    setIsLoading(true);
    setHasError(false);

    // Remove current layer if it exists
    if (currentLayer && map.hasLayer(currentLayer)) {
      map.removeLayer(currentLayer);
    }

    try {
      // Create new layer using esri-leaflet tiledMapLayer
      const layer = EL.tiledMapLayer({
        url: IMAGERY_LAYERS[currentLayerIndex].url,
        opacity: 1,
        useCors: false
      }).addTo(map);

      // Handle load events
      layer.on('loading', () => setIsLoading(true));
      layer.on('load', () => setIsLoading(false));
      layer.on('error', (e) => {
        console.error('Layer load error:', e);
        setHasError(true);
        setIsLoading(false);
      });

      setCurrentLayer(layer);

      return () => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      };
    } catch (error) {
      console.error('Error creating layer:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [map, currentLayerIndex]);

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
      <Card className="p-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Year: {IMAGERY_LAYERS[currentLayerIndex].year}
              </span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isLoading || hasError}
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
              <AlertTitle>Failed to load imagery for this year</AlertTitle>
            </Alert>
          )}
          
          <Slider
            value={[currentLayerIndex]}
            max={IMAGERY_LAYERS.length - 1}
            step={1}
            onValueChange={(value) => {
              setCurrentLayerIndex(value[0]);
              setIsPlaying(false);
            }}
            disabled={isLoading}
          />

          <div className="flex justify-between text-sm text-muted-foreground">
            {IMAGERY_LAYERS.map((layer, index) => (
              <span
                key={layer.year}
                className={index === currentLayerIndex ? 'font-bold' : ''}
                style={{ 
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'top left'
                }}
              >
                {layer.year}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 