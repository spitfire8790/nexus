import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import area from '@turf/area';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Ruler, Square } from 'lucide-react';
import { useMapStore } from '@/lib/map-store';

export function MapMeasureControl() {
  const map = useMap();
  const drawControlRef = useRef<any>(null);
  const featuresRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<L.Control | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const { mapSelectMode } = useMapStore();

  useEffect(() => {
    if (!map) return;

    // Initialize feature group for drawn items if not already initialized
    if (!featuresRef.current) {
      featuresRef.current = new L.FeatureGroup();
      map.addLayer(featuresRef.current);
    }

    // Initialize draw control with specific options
    drawControlRef.current = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: {
          shapeOptions: {
            color: '#2563eb',
            weight: 3
          },
          metric: true,
          feet: false,
          showLength: true
        },
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
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: false
    });

    // Create custom control container with proper styling
    const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar measure-control');
    container.style.backgroundColor = 'white';
    container.style.padding = '4px';
    container.style.margin = '10px';
    container.style.borderRadius = '4px';
    container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.2)';
    
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    // Create and add custom control
    const Control = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: () => container
    });

    controlRef.current = new Control();
    controlRef.current.addTo(map);

    // Create root for React rendering
    rootRef.current = createRoot(container);

    const renderContent = () => {
      if (!rootRef.current) return;
      
      rootRef.current.render(
        <div className="flex items-center gap-2 bg-white p-1">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap h-8 px-3"
              onClick={() => {
                if (drawControlRef.current) {
                  new L.Draw.Polyline(map, drawControlRef.current.options.draw.polyline).enable();
                }
              }}
              disabled={mapSelectMode}
            >
              <Ruler className="h-4 w-4" />
              <span>Distance</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap h-8 px-3"
              onClick={() => {
                if (drawControlRef.current) {
                  new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon).enable();
                }
              }}
              disabled={mapSelectMode}
            >
              <Square className="h-4 w-4" />
              <span>Area</span>
            </Button>
          </div>

          {featuresRef.current?.getLayers().length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8 px-3"
              onClick={() => {
                if (featuresRef.current) {
                  featuresRef.current.clearLayers();
                  renderContent(); // Re-render after clearing
                }
              }}
            >
              Clear
            </Button>
          )}
        </div>
      );
    };

    renderContent();

    // Handle measurement creation
    const handleMeasurementCreated = (e: any) => {
      const layer = e.layer;
      featuresRef.current?.addLayer(layer);
      
      if (e.layerType === 'polygon') {
        const areaInSquareMeters = area({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [layer.getLatLngs()[0].map(ll => [ll.lng, ll.lat])]
          }
        });
        
        const readableArea = areaInSquareMeters >= 10000 
          ? `${(areaInSquareMeters / 10000).toFixed(2)} ha` 
          : `${areaInSquareMeters.toFixed(2)} m²`;
        
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
          : `${Math.round(length)} m`;
        
        layer.bindTooltip(readableLength, {
          permanent: true,
          direction: 'center',
          className: 'measure-tooltip'
        });
      }
      
      renderContent();
    };

    map.on(L.Draw.Event.CREATED, handleMeasurementCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleMeasurementCreated);
      
      // Use requestAnimationFrame for cleanup to ensure it happens after rendering
      requestAnimationFrame(() => {
        if (rootRef.current) {
          rootRef.current.unmount();
        }
        if (controlRef.current) {
          map.removeControl(controlRef.current);
        }
        if (featuresRef.current) {
          map.removeLayer(featuresRef.current);
        }
      });
    };
  }, [map, mapSelectMode]);

  return null;
} 