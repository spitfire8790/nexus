import { useEffect } from 'react';
import { LayersControl, TileLayer, useMap } from 'react-leaflet';
import { useMapStore } from '@/lib/map-store';

const BASE_PANE = 'tilePane';

export function BasemapControl() {
  const map = useMap();
  const setSelectedBasemap = useMapStore((state) => state.setSelectedBasemap);

  useEffect(() => {
    if (!map) return;

    // Listen for basemap changes
    const handleBasemapChange = (e: any) => {
      const layerName = e.name;
      setSelectedBasemap(layerName);
    };

    map.on('baselayerchange', handleBasemapChange);

    return () => {
      map.off('baselayerchange', handleBasemapChange);
    };
  }, [map, setSelectedBasemap]);

  return (
    <LayersControl 
      position="topright"
      collapsed={true}
    >
      <LayersControl.BaseLayer checked name="Carto">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maxZoom={21}
          attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
          maxNativeZoom={19}
          crossOrigin={true}
          className="seamless-tiles"
          pane={BASE_PANE}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="NSW Imagery">
        <TileLayer
          url="https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={21}
          maxNativeZoom={19}
          attribution='&copy; NSW Government - Maps NSW'
          tileSize={256}
          crossOrigin={true}
          className="seamless-tiles"
          pane={BASE_PANE}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="OpenStreetMap">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={21}
          pane={BASE_PANE}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}
