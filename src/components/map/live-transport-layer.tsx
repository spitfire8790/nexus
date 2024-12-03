import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useMapStore } from '@/lib/map-store';

interface VehiclePosition {
  id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  type: 'train' | 'metro';
}

export function LiveTransportLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'live-transport')
    ?.enabled || false;

  useEffect(() => {
    if (!map || !isEnabled) {
      // Clean up markers when disabled
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      return;
    }

    const fetchVehiclePositions = async () => {
      try {
        const [trainsResponse, metroResponse] = await Promise.all([
          fetch('/api/transport/sydneytrains?debug=true'),
          fetch('/api/transport/metro?debug=true')
        ]);

        const trainsData = await trainsResponse.text();
        const metroData = await metroResponse.text();

        // Parse the debug text format responses
        const positions: VehiclePosition[] = [
          ...parseGTFSDebugText(trainsData, 'train'),
          ...parseGTFSDebugText(metroData, 'metro')
        ];

        // Update markers
        updateMarkers(positions);
      } catch (error) {
        console.error('Error fetching vehicle positions:', error);
      }
    };

    // Initial fetch
    fetchVehiclePositions();

    // Set up interval for updates
    updateIntervalRef.current = setInterval(fetchVehiclePositions, 30000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map, isEnabled]);

  const updateMarkers = (positions: VehiclePosition[]) => {
    const existingIds = new Set(Object.keys(markersRef.current));
    
    positions.forEach(pos => {
      const markerId = `${pos.type}-${pos.id}`;
      existingIds.delete(markerId);

      if (markersRef.current[markerId]) {
        // Update existing marker
        markersRef.current[markerId].setLatLng([pos.latitude, pos.longitude]);
        markersRef.current[markerId].setRotationAngle(pos.bearing);
      } else {
        // Create new marker
        const icon = L.divIcon({
          className: 'custom-vehicle-icon',
          html: `<div style="transform: rotate(${pos.bearing}deg)">
                  ${pos.type === 'train' ? '🚂' : '🚇'}
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([pos.latitude, pos.longitude], { icon })
          .addTo(map);
        markersRef.current[markerId] = marker;
      }
    });

    // Remove stale markers
    existingIds.forEach(id => {
      if (markersRef.current[id]) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  };

  return null;
}

function parseGTFSDebugText(text: string, type: 'train' | 'metro'): VehiclePosition[] {
  const positions: VehiclePosition[] = [];
  const lines = text.split('\n');

  let currentVehicle: Partial<VehiclePosition> = {};

  lines.forEach(line => {
    const latMatch = line.match(/latitude: ([\d.-]+)/);
    const lonMatch = line.match(/longitude: ([\d.-]+)/);
    const idMatch = line.match(/vehicle_id: "([^"]+)"/);
    const bearingMatch = line.match(/bearing: ([\d.-]+)/);

    if (latMatch) currentVehicle.latitude = parseFloat(latMatch[1]);
    if (lonMatch) currentVehicle.longitude = parseFloat(lonMatch[1]);
    if (idMatch) currentVehicle.id = idMatch[1];
    if (bearingMatch) currentVehicle.bearing = parseFloat(bearingMatch[1]);

    if (line.trim() === '}' && currentVehicle.id && 
        currentVehicle.latitude && currentVehicle.longitude) {
      positions.push({
        ...currentVehicle as VehiclePosition,
        type
      });
      currentVehicle = {};
    }
  });

  return positions;
}