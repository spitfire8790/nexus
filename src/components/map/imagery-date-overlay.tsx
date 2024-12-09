import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/lib/map-store';
import * as L from 'leaflet';

export function ImageryDateOverlay() {
  const map = useMap();
  const [dateText, setDateText] = useState<string | null>(null);
  const layerGroups = useMapStore((state) => state.layerGroups);

  // Check if NSW Imagery is enabled either as base layer or overlay
  const isNSWImageryEnabled = () => {
    // Check overlay layer
    const overlayEnabled = layerGroups
      .flatMap(group => group.layers)
      .some(layer => 
        (layer.id === 'nsw-imagery' || layer.url?.includes('NSW_Imagery')) && 
        layer.enabled
      );

    // Check base layer by looking at all tiles
    const tiles = document.getElementsByClassName('leaflet-tile');
    const baseLayerEnabled = Array.from(tiles).some(
      tile => (tile as HTMLImageElement).src?.includes('NSW_Imagery')
    );

    return overlayEnabled || baseLayerEnabled;
  };

  useEffect(() => {
    if (!map) return;

    const fetchImageryDate = async () => {
      if (!isNSWImageryEnabled()) {
        setDateText(null);
        return;
      }

      try {
        const center = map.getCenter();
        const url = new URL('https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery_Dates/MapServer/0/query');
        url.searchParams.append('geometry', `{"x":${center.lng},"y":${center.lat},"spatialReference":{"wkid":4326}}`);
        url.searchParams.append('geometryType', 'esriGeometryPoint');
        url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
        url.searchParams.append('outFields', '*');
        url.searchParams.append('returnGeometry', 'false');
        url.searchParams.append('f', 'json');
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.features?.[0]?.attributes?.BlockStartDate) {
          const timestamp = data.features[0].attributes.BlockStartDate;
          const date = new Date(timestamp);
          setDateText(date.toLocaleDateString('en-AU', {
            month: 'long',
            year: 'numeric'
          }));
        }
      } catch (error) {
        setDateText(null);
      }
    };

    fetchImageryDate();
    const interval = setInterval(fetchImageryDate, 1000);
    map.on('moveend', fetchImageryDate);

    return () => {
      clearInterval(interval);
      map.off('moveend', fetchImageryDate);
    };
  }, [map, layerGroups]);

  if (!dateText || !isNSWImageryEnabled()) return null;

  return (
    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 rounded-md shadow-sm z-[1000] text-sm">
      <span className="font-medium">Imagery Date: {dateText}</span>
    </div>
  );
} 