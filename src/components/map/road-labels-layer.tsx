import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as EL from 'esri-leaflet';
import { useMapStore } from '@/lib/map-store';

export function RoadLabelsLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const layerRef = useRef<EL.DynamicMapLayer | null>(null);

  const isEnabled = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'road-labels')?.enabled || false;

  useEffect(() => {
    if (!map || !isEnabled) {
      if (layerRef.current) {
        layerRef.current.remove();
      }
      return;
    }

    const layer = EL.dynamicMapLayer({
      url: 'https://maps.six.nsw.gov.au/arcgis/rest/services/sixmaps/LPI_RasterLabels_1/MapServer',
      layers: [0],
      opacity: 1,
      f: 'image'
    }).addTo(map);

    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
      }
    };
  }, [map, isEnabled]);

  return null;
} 