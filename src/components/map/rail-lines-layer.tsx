import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useMapStore } from '@/lib/map-store';

interface RailStop {
  type: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  route_desc: string;
  route_type: string;
  route_color: string;
}

function orderStopsByDistance(stops: RailStop[]): RailStop[] {
  if (stops.length <= 2) return stops;

  const ordered: RailStop[] = [stops[0]];
  const remaining = new Set(stops.slice(1));

  while (remaining.size > 0) {
    const current = ordered[ordered.length - 1];
    let nearest: RailStop | null = null;
    let minDistance = Infinity;

    remaining.forEach(stop => {
      const distance = Math.pow(stop.stop_lat - current.stop_lat, 2) + 
                      Math.pow(stop.stop_lon - current.stop_lon, 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = stop;
      }
    });

    if (nearest) {
      ordered.push(nearest);
      remaining.delete(nearest);
    }
  }

  return ordered;
}

export function RailLinesLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'rail-lines')
    ?.enabled || false;

  useEffect(() => {
    if (!map || !isEnabled) {
      if (layerRef.current) {
        layerRef.current.clearLayers();
        map?.removeLayer(layerRef.current);
      }
      return;
    }

    const fetchAndDrawRoutes = async () => {
      try {
        const response = await fetch('/data/gtfs/rail_routes.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch rail routes: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        if (!csvText.trim()) {
          throw new Error('Rail routes CSV file is empty');
        }

        const lines = csvText
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length < 2) {
          throw new Error('Rail routes CSV file has no data rows');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['stop_name', 'stop_lat', 'stop_lon', 'route_desc', 'route_color'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const parseCSVLine = (line: string): string[] => {
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          values.push(currentValue.trim());
          return values.map(v => v.replace(/^"|"$/g, '').trim());
        };

        // Parse stops from CSV
        const stops: RailStop[] = lines.slice(1)
          .map(line => {
            const values = parseCSVLine(line);
            if (values.length !== headers.length) {
              console.warn(`Invalid line (wrong number of columns): ${line}`);
              return null;
            }
            
            const stop = headers.reduce((obj: any, header, index) => {
              obj[header] = values[index];
              return obj;
            }, {}) as RailStop;

            // Validate coordinates
            const lat = parseFloat(stop.stop_lat);
            const lon = parseFloat(stop.stop_lon);
            if (isNaN(lat) || isNaN(lon)) {
              console.warn(`Invalid coordinates for stop: ${stop.stop_name}`);
              return null;
            }

            return {
              ...stop,
              stop_lat: lat,
              stop_lon: lon
            };
          })
          .filter((stop): stop is RailStop => 
            stop !== null && 
            stop.stop_name && 
            !isNaN(parseFloat(stop.stop_lat.toString())) && 
            !isNaN(parseFloat(stop.stop_lon.toString()))
          );

        // Group stops by route description and color
        const routeGroups = stops.reduce((groups: { [key: string]: RailStop[] }, stop) => {
          const key = `${stop.route_desc}-${stop.route_color}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(stop);
          return groups;
        }, {});

        // Create new layer group
        const newLayerGroup = L.layerGroup();

        // Draw lines for each route
        Object.entries(routeGroups).forEach(([key, routeStops]) => {
          const color = `#${routeStops[0].route_color}`;
          
          // Order the stops to create a smoother route
          const orderedStops = orderStopsByDistance(routeStops);
          
          // Create coordinates array for the route
          const coordinates = orderedStops.map(stop => 
            [stop.stop_lat, stop.stop_lon] as L.LatLngExpression
          );
          
          // Create polyline with route color
          const polyline = L.polyline(coordinates, {
            color: color,
            weight: 3,
            opacity: 0.7,
            smoothFactor: 1.5
          });

          polyline.addTo(newLayerGroup);
        });

        // Remove old layer group if it exists
        if (layerRef.current) {
          layerRef.current.clearLayers();
          map.removeLayer(layerRef.current);
        }

        // Add new layer group to map and store reference
        newLayerGroup.addTo(map);
        layerRef.current = newLayerGroup;

      } catch (error) {
        console.error('Error in RailLinesLayer:', error);
      }
    };

    fetchAndDrawRoutes();

    return () => {
      if (layerRef.current) {
        layerRef.current.clearLayers();
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, isEnabled]);

  return null;
} 