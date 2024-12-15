import { useEffect, useState, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';

interface DevelopmentApplication {
  id: bigint;
  location: {
    X: string;
    Y: string;
    State: string;
    Suburb: string;
    Postcode: string;
    StreetName: string;
    StreetType: string;
    FullAddress: string;
  }[];
}

export function DevelopmentApplicationsLayer() {
  const map = useMap();
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [bounds, setBounds] = useState(map.getBounds());
  const [zoom, setZoom] = useState(map.getZoom());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounce the bounds and zoom updates to prevent too many queries
  const debouncedBounds = useDebounce(bounds, 500);
  const debouncedZoom = useDebounce(zoom, 500);

  // Update bounds and zoom when map moves
  useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
  });

  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const fetchDevelopmentApplications = async () => {
      if (debouncedZoom < 12) {
        if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();
          map.removeLayer(markersLayerRef.current);
        }
        return;
      }

      try {
        // Cancel any pending requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const sw = debouncedBounds.getSouthWest();
        const ne = debouncedBounds.getNorthEast();

        // Use RPC call for optimized spatial query
        const { data, error } = await supabase.rpc('get_development_applications_in_bounds', {
          min_lng: sw.lng,
          max_lng: ne.lng,
          min_lat: sw.lat,
          max_lat: ne.lat
        });

        if (error) {
          console.error('Error fetching development applications:', error);
          return;
        }

        // Create a new layer group
        const newLayerGroup = L.layerGroup();

        // Add markers to the layer group
        (data || []).forEach((app: DevelopmentApplication) => {
          if (app.location?.[0]) {
            const { X, Y, FullAddress } = app.location[0];
            const marker = L.marker([parseFloat(Y), parseFloat(X)])
              .bindPopup(FullAddress);
            marker.addTo(newLayerGroup);
          }
        });

        // Remove old layer group
        if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();
          map.removeLayer(markersLayerRef.current);
        }

        // Add new layer group
        newLayerGroup.addTo(map);
        markersLayerRef.current = newLayerGroup;

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error:', error);
        }
      }
    };

    fetchDevelopmentApplications();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        map.removeLayer(markersLayerRef.current);
      }
    };
  }, [debouncedBounds, debouncedZoom, map]);

  return null;
}