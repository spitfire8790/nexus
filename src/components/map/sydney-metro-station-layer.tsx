import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useMapStore } from '@/lib/map-store';

interface MetroStation {
  type: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  route_desc: string;
  route_type: string;
}

interface StationGroup {
  name: string;
  lat: number;
  lon: number;
  count: number;
}

export function MetroStationsLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'metro-stations')
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

    const fetchStations = async () => {
      try {
        const response = await fetch('/data/gtfs/metro.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch metro stations: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        if (!csvText.trim()) {
          throw new Error('Metro stations CSV file is empty');
        }

        // Split by either \n or \r\n to handle different line endings
        const lines = csvText
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length < 2) {
          throw new Error('Train stations CSV file has no data rows');
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

        const stations: MetroStation[] = lines.slice(1)
          .map(line => {
            const values = parseCSVLine(line);
            if (values.length !== headers.length) {
              console.warn(`Invalid line (wrong number of columns): ${line}`);
              return null;
            }
            
            const station = headers.reduce((obj: any, header, index) => {
              obj[header] = values[index];
              return obj;
            }, {});

            // Validate coordinates
            const lat = parseFloat(station.stop_lat);
            const lon = parseFloat(station.stop_lon);
            if (isNaN(lat) || isNaN(lon)) {
              console.warn(`Invalid coordinates for station: ${station.stop_name}`);
              return null;
            }

            return station;
          })
          .filter((station): station is MetroStation => 
            station !== null && 
            station.stop_name && 
            !isNaN(parseFloat(station.stop_lat)) && 
            !isNaN(parseFloat(station.stop_lon))
          );

        console.log(`Loaded ${stations.length} valid stations`);

        if (stations.length === 0) {
          throw new Error('No valid metro stations found in CSV');
        }

        // Group stations by name (excluding platform info)
        const stationGroups = stations.reduce((acc: { [key: string]: StationGroup }, station) => {
          // Extract base station name without platform info
          const baseName = station.stop_name.split(',')[0].trim();
          const lat = parseFloat(station.stop_lat);
          const lon = parseFloat(station.stop_lon);
          
          if (!acc[baseName]) {
            acc[baseName] = {
              name: baseName,
              lat: 0,
              lon: 0,
              count: 0
            };
          }
          
          acc[baseName].lat += lat;
          acc[baseName].lon += lon;
          acc[baseName].count++;
          
          return acc;
        }, {});

        console.log(`Grouped into ${Object.keys(stationGroups).length} unique stations`);

        // Create new layer group
        const newLayerGroup = L.layerGroup();

        // Create markers
        Object.values(stationGroups).forEach(station => {
          const avgLat = station.lat / station.count;
          const avgLon = station.lon / station.count;

          const createIcon = (showLabel: boolean) => L.divIcon({
            className: 'custom-station-icon',
            html: `
              <div class="flex flex-col items-center">
                <img src="/Metro.png" alt="Metro Station" class="w-6 h-6" />
                ${showLabel ? `
                  <div class="px-2 py-1 rounded-md mt-1 text-xs whitespace-nowrap bg-white/80 text-teal-500 font-semibold shadow-sm">
                    ${station.name}
                  </div>
                ` : ''}
              </div>
            `,
            iconSize: showLabel ? [40, 60] : [24, 24],
            iconAnchor: showLabel ? [20, 30] : [12, 12]
          });

          const marker = L.marker([avgLat, avgLon], { 
            icon: createIcon(currentZoom >= 14)
          })
          .bindPopup(`
            <div class="font-semibold">${station.name}</div>
            <div class="text-sm text-gray-600">${station.count} platform(s)</div>
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
        console.error('Error in MetroStationsLayer:', error);
      }
    };

    fetchStations();

    return () => {
      if (markersRef.current) {
        markersRef.current.clearLayers();
        map.removeLayer(markersRef.current);
      }
    };
  }, [map, isEnabled, currentZoom]);

  return null;
}