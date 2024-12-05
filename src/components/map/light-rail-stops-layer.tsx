import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useMapStore } from '@/lib/map-store';

interface LightRailStop {
  type: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  route_desc: string;
  route_type: string;
}

interface StopGroup {
  name: string;
  lat: number;
  lon: number;
  count: number;
}

export function LightRailStopsLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'light-rail-stops')
    ?.enabled || false;

  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !isEnabled) {
      if (markersRef.current) {
        markersRef.current.clearLayers();
        map?.removeLayer(markersRef.current);
      }
      return;
    }

    const fetchStops = async () => {
      try {
        const response = await fetch('/data/gtfs/lightrail.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch light rail stops: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        if (!csvText.trim()) {
          throw new Error('Light rail stops CSV file is empty');
        }

        // Split by either \n or \r\n to handle different line endings
        const lines = csvText
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length < 2) {
          throw new Error('Light rail stops CSV file has no data rows');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['stop_name', 'stop_lat', 'stop_lon'];
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

        const stops: LightRailStop[] = lines.slice(1)
          .map(line => {
            const values = parseCSVLine(line);
            if (values.length !== headers.length) {
              console.warn(`Invalid line (wrong number of columns): ${line}`);
              return null;
            }
            
            const stop = headers.reduce((obj: any, header, index) => {
              obj[header] = values[index];
              return obj;
            }, {});

            // Validate coordinates
            const lat = parseFloat(stop.stop_lat);
            const lon = parseFloat(stop.stop_lon);
            if (isNaN(lat) || isNaN(lon)) {
              console.warn(`Invalid coordinates for stop: ${stop.stop_name}`);
              return null;
            }

            return stop;
          })
          .filter((stop): stop is LightRailStop => 
            stop !== null && 
            stop.stop_name && 
            !isNaN(parseFloat(stop.stop_lat)) && 
            !isNaN(parseFloat(stop.stop_lon))
          );

        console.log(`Loaded ${stops.length} valid light rail stops`);

        if (stops.length === 0) {
          throw new Error('No valid light rail stops found in CSV');
        }

        // Group stops by name (excluding platform info)
        const stopGroups = stops.reduce((acc: { [key: string]: StopGroup }, stop) => {
          // Extract base stop name without platform info
          const baseName = stop.stop_name
            .split(',')[0]
            .trim()
            .replace(/ Light Rail$/, '');  // Remove "Light Rail" suffix
          
          if (!acc[baseName]) {
            acc[baseName] = {
              name: baseName,
              lat: 0,
              lon: 0,
              count: 0
            };
          }
          
          acc[baseName].lat += parseFloat(stop.stop_lat);
          acc[baseName].lon += parseFloat(stop.stop_lon);
          acc[baseName].count++;
          
          return acc;
        }, {});

        console.log(`Grouped into ${Object.keys(stopGroups).length} unique stops`);

        // Create new layer group
        const newLayerGroup = L.layerGroup();

        // Create markers
        Object.values(stopGroups).forEach(stop => {
          const avgLat = stop.lat / stop.count;
          const avgLon = stop.lon / stop.count;

          const createIcon = (showLabel: boolean) => L.divIcon({
            className: 'custom-station-icon',
            html: `
              <div class="flex flex-col items-center">
                <img src="/LightRail.png" alt="Light Rail Stop" class="w-6 h-6" />
                ${showLabel ? `
                  <div class="px-2 py-1 rounded-md mt-1 text-xs whitespace-nowrap bg-white/80 text-red-500 font-semibold shadow-sm">
                    ${stop.name}
                  </div>
                ` : ''}
              </div>
            `,
            iconSize: [24, 24],  // Fixed size for the icon
            iconAnchor: [12, 12],  // Exact center of the icon
            popupAnchor: [0, -12]  // Popup appears just above the icon
          });

          const marker = L.marker([avgLat, avgLon], { 
            icon: createIcon(currentZoom >= 14)
          })
          .bindPopup(`
            <div class="font-semibold">${stop.name}</div>
            <div class="text-sm text-gray-600">${stop.count} platform(s)</div>
          `);
            
          marker.addTo(newLayerGroup);

          // Update marker icon when zoom changes
          map.on('zoomend', () => {
            const zoom = map.getZoom();
            marker.setIcon(createIcon(zoom >= 14));
          });
        });

        // Remove old layer group if it exists
        if (markersRef.current) {
          markersRef.current.clearLayers();
          map.removeLayer(markersRef.current);
        }

        // Add new layer group to map and store reference
        newLayerGroup.addTo(map);
        markersRef.current = newLayerGroup;

      } catch (error) {
        console.error('Error in LightRailStopsLayer:', error);
      }
    };

    fetchStops();

    return () => {
      if (markersRef.current) {
        markersRef.current.clearLayers();
        map.removeLayer(markersRef.current);
      }
    };
  }, [map, isEnabled, currentZoom]);

  return null;
}
