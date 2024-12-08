import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { supabase } from '@/lib/supabase-client';
import { useDebounce } from '@/hooks/useDebounce';

interface DevelopmentApplication {
  id: string;
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

  useEffect(() => {
    const fetchDevelopmentApplications = async () => {
      // Only fetch data if zoom is above a certain level to prevent overloading
      if (debouncedZoom < 12) {
        // Clear existing markers if zoom is too low
        markers.forEach(marker => marker.remove());
        setMarkers([]);
        return;
      }

      const sw = debouncedBounds.getSouthWest();
      const ne = debouncedBounds.getNorthEast();

      // Query Supabase with a raw SQL query to filter by coordinates
      const { data, error } = await supabase
        .from('development_applications')
        .select('*')
        .filter('location', 'cs', `[{"X":{"gte":"${sw.lng}","lte":"${ne.lng}"},"Y":{"gte":"${sw.lat}","lte":"${ne.lat}"}}]`);

      if (error) {
        console.error('Error fetching development applications:', error);
        return;
      }

      // Remove existing markers
      markers.forEach(marker => marker.remove());

      // Create new markers
      const newMarkers = (data || []).map((app: DevelopmentApplication) => {
        if (app.location && app.location[0]) {
          const { X, Y, FullAddress } = app.location[0];
          const marker = L.marker([parseFloat(Y), parseFloat(X)])
            .bindPopup(FullAddress);
          
          marker.addTo(map);
          return marker;
        }
        return null;
      }).filter(Boolean) as L.Marker[];

      setMarkers(newMarkers);
    };

    fetchDevelopmentApplications();

    // Cleanup function to remove markers when component unmounts
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [debouncedBounds, debouncedZoom, map]);

  return null;
}