import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useMapStore } from '@/lib/map-store';
import { Train } from 'lucide-react';

export function TrainStationsLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'train-stations')
    ?.enabled || false;

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
        const url = new URL('https://portal.spatial.nsw.gov.au/server/rest/services/NSW_FOI_Transport_Facilities/MapServer/1/query');
        
        url.searchParams.append('f', 'json');
        url.searchParams.append('where', '1=1');
        url.searchParams.append('outFields', 'generalname');
        url.searchParams.append('returnGeometry', 'true');
        url.searchParams.append('outSR', '4326');

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API returned status: ${response.status}`);
        
        const data = await response.json();

        if (markersRef.current) {
          markersRef.current.clearLayers();
          map.removeLayer(markersRef.current);
        }

        markersRef.current = L.layerGroup().addTo(map);

        data.features.forEach((feature: any) => {
          // Handle both point and polygon geometries
          let lat, lng;
          
          if (feature.geometry.type === 'point') {
            [lng, lat] = feature.geometry.coordinates;
          } else if (feature.geometry.x && feature.geometry.y) {
            // Convert Web Mercator coordinates to Lat/Lng if needed
            lng = feature.geometry.x;
            lat = feature.geometry.y;
          } else {
            console.warn('Unsupported geometry type:', feature.geometry);
            return;
          }

          const name = feature.attributes.generalname;

          // Create custom icon
          const icon = L.divIcon({
            className: 'custom-station-icon',
            html: `
              <div class="flex flex-col items-center">
                <div class="bg-white p-1 rounded-full shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 15c0 2 2 4 4 4h8c2 0 4-2 4-4V5H4v10Z" />
                    <path d="M6.5 19L4 22" />
                    <path d="M17.5 19L20 22" />
                    <path d="M8 19L8 22" />
                    <path d="M16 19L16 22" />
                    <path d="M4 5L4 2h16v3" />
                    <circle cx="8" cy="13" r="1" />
                    <circle cx="16" cy="13" r="1" />
                    <path d="M4 9h16" />
                  </svg>
                </div>
                <div class="bg-white px-2 py-1 rounded-md shadow-md mt-1 text-xs whitespace-nowrap">
                  ${name}
                </div>
              </div>
            `,
            iconSize: [40, 60],
            iconAnchor: [20, 30]
          });

          L.marker([lat, lng], { icon })
            .addTo(markersRef.current!);
        });

      } catch (error) {
        console.error('Error fetching train stations:', error);
      }
    };

    fetchStations();

    return () => {
      if (markersRef.current) {
        markersRef.current.clearLayers();
        map.removeLayer(markersRef.current);
      }
    };
  }, [map, isEnabled]);

  return null;
} 