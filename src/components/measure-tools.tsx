import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { Ruler, Square } from 'lucide-react';
import { useMapStore } from '@/lib/map-store';

export function MeasureTools() {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const featuresRef = useRef<L.FeatureGroup | null>(null);
  const { mapSelectMode } = useMapStore();

  useEffect(() => {
    // Initialize feature group for drawn items
    featuresRef.current = new L.FeatureGroup();
    map.addLayer(featuresRef.current);

    // Initialize draw control
    drawControlRef.current = new L.Control.Draw({
      position: 'topleft',
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#2563eb',
            weight: 2,
            fillColor: '#2563eb',
            fillOpacity: 0.2
          }
        },
        polyline: {
          metric: true,
          shapeOptions: {
            color: '#2563eb',
            weight: 3
          }
        }
      }
    });

    // Handle created measurements
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      
      if (e.layerType === 'polygon') {
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const readableArea = area >= 10000 
          ? `${(area / 10000).toFixed(2)} ha` 
          : `${area.toFixed(2)} m²`;
        
        layer.bindTooltip(readableArea, {
          permanent: true,
          direction: 'center',
          className: 'measure-tooltip'
        });
      }
      
      if (e.layerType === 'polyline') {
        const length = layer.getLatLngs().reduce((total: number, latlng: any, i: number, arr: any[]) => {
          if (i === 0) return 0;
          return total + latlng.distanceTo(arr[i - 1]);
        }, 0);
        
        const readableLength = length >= 1000 
          ? `${(length / 1000).toFixed(2)} km` 
          : `${length.toFixed(2)} m`;
        
        layer.bindTooltip(readableLength, {
          permanent: true,
          direction: 'center',
          className: 'measure-tooltip'
        });
      }

      featuresRef.current?.addLayer(layer);
    });

    return () => {
      map.off(L.Draw.Event.CREATED);
      if (featuresRef.current) {
        map.removeLayer(featuresRef.current);
      }
    };
  }, [map]);

  const handleMeasureDistance = () => {
    if (!drawControlRef.current) return;
    new L.Draw.Polyline(map, drawControlRef.current.options.draw.polyline).enable();
  };

  const handleMeasureArea = () => {
    if (!drawControlRef.current) return;
    new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon).enable();
  };

  const clearMeasurements = () => {
    if (featuresRef.current) {
      featuresRef.current.clearLayers();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleMeasureDistance}
        disabled={mapSelectMode}
      >
        <Ruler className="h-4 w-4" />
        Measure Distance
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleMeasureArea}
        disabled={mapSelectMode}
      >
        <Square className="h-4 w-4" />
        Measure Area
      </Button>

      {featuresRef.current?.getLayers().length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={clearMeasurements}
        >
          Clear Measurements
        </Button>
      )}
    </>
  );
} 