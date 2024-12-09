import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import * as EL from 'esri-leaflet';
import { useMapStore } from '@/lib/map-store';

const ROAD_STYLES = {
  1: {
    color: '#DC2626', // Red-600
    weight: 5,
    opacity: 0.9,
    label: 'Motorway'
  },
  2: {
    color: '#EA580C', // Orange-600
    weight: 4,
    opacity: 0.9,
    label: 'Primary Road'
  },
  3: {
    color: '#D97706', // Amber-600
    weight: 4,
    opacity: 0.8,
    label: 'Arterial Road'
  },
  4: {
    color: '#CA8A04', // Yellow-600
    weight: 3,
    opacity: 0.8,
    label: 'Sub-Arterial Road'
  },
  5: {
    color: '#65A30D', // Lime-600
    weight: 3,
    opacity: 0.8,
    label: 'Distributor Road'
  },
  6: {
    color: '#16A34A', // Green-600
    weight: 2,
    opacity: 0.7,
    label: 'Local Road'
  },
  7: {
    color: '#0D9488', // Teal-600
    weight: 2,
    opacity: 0.6,
    label: 'Urban Service Lane'
  },
  8: {
    color: '#0891B2', // Cyan-600
    weight: 1,
    opacity: 0.6,
    label: 'Vehicle Track'
  },
  9: {
    color: '#2563EB', // Blue-600
    weight: 1,
    opacity: 0.5,
    label: 'Path'
  },
  10: {
    color: '#9333EA', // Purple-600
    weight: 2,
    opacity: 0.7,
    label: 'Dedicated Busway'
  },
  11: {
    color: '#C026D3', // Fuchsia-600
    weight: 1,
    opacity: 0.5,
    label: 'Access Way'
  },
  default: {
    color: '#94A3B8', // Slate-400
    weight: 1,
    opacity: 0.5,
    label: 'Other'
  }
};

export function RoadsLayer() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const updateSelectedRoadTypes = useMapStore((state) => state.updateSelectedRoadTypes);
  const layerRef = useRef<EL.FeatureLayer | null>(null);

  const { isEnabled, selectedRoadTypes } = useMemo(() => {
    const layer = layerGroups
      .flatMap(group => group.layers)
      .find(layer => layer.id === 'roads');
    
    return { 
      isEnabled: layer?.enabled || false,
      selectedRoadTypes: layer?.selectedRoadTypes || []
    };
  }, [layerGroups]);

  useEffect(() => {
    if (!map || !isEnabled) {
      if (layerRef.current) {
        layerRef.current.remove();
      }
      return;
    }

    const whereClause = selectedRoadTypes.length > 0
      ? `functionhierarchy IN (${selectedRoadTypes.join(',')})`
      : "1=1";

    const layer = EL.featureLayer({
      url: 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5',
      where: whereClause,
      style: function(feature) {
        const functionHierarchy = feature?.properties?.functionhierarchy;
        return ROAD_STYLES[functionHierarchy] || ROAD_STYLES.default;
      }
    }).bindPopup(function(evt) {
      const props = evt.feature.properties;
      const hierarchyType = ROAD_STYLES[props.functionhierarchy]?.label || 'Unknown';
      const style = ROAD_STYLES[props.functionhierarchy] || ROAD_STYLES.default;
      
      return `
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div style="
              background-color: ${style.color}; 
              height: ${style.weight}px;
              width: 24px;
            "></div>
            <div>${hierarchyType}</div>
          </div>
          <div>${props.roadnamebase} ${props.roadnametype}</div>
          <div>Number of lanes: ${props.lanecount || 'Unknown'}</div>
        </div>
      `;
    }).addTo(map);

    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
      }
    };
  }, [map, isEnabled, selectedRoadTypes]);

  return isEnabled ? <RoadsLegend /> : null;
}

function RoadsLegend() {
  const map = useMap();
  const legendRef = useRef<L.Control>();
  const updateSelectedRoadTypes = useMapStore((state) => state.updateSelectedRoadTypes);
  const layerGroups = useMapStore((state) => state.layerGroups);
  
  const selectedRoadTypes = useMemo(() => {
    const layer = layerGroups
      .flatMap(group => group.layers)
      .find(layer => layer.id === 'roads');
    return layer?.selectedRoadTypes || [];
  }, [layerGroups]);

  const handleRoadTypeClick = useCallback((roadType: number) => {
    const newSelectedTypes = selectedRoadTypes.includes(roadType)
      ? selectedRoadTypes.filter(t => t !== roadType)
      : [...selectedRoadTypes, roadType];
    
    updateSelectedRoadTypes('roads', newSelectedTypes);
  }, [selectedRoadTypes, updateSelectedRoadTypes]);

  useEffect(() => {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'bg-white p-3 rounded-lg shadow-lg');
      div.innerHTML = `
        <div class="text-sm font-semibold mb-2">Road Types</div>
        ${Object.entries(ROAD_STYLES)
          .filter(([key]) => key !== 'default')
          .map(([key, style]) => `
            <div class="flex items-center gap-2 mb-1.5 cursor-pointer" 
                 data-road-type="${key}"
                 style="opacity: ${selectedRoadTypes.length === 0 || selectedRoadTypes.includes(Number(key)) ? '1' : '0.5'}">
              <div style="
                background-color: ${style.color}; 
                height: ${style.weight}px;
                width: 24px;
              "></div>
              <div class="text-xs">${style.label}</div>
            </div>
          `).join('')}
      `;

      // Add click handlers
      div.querySelectorAll('[data-road-type]').forEach(el => {
        el.addEventListener('click', (e) => {
          const roadType = Number((e.currentTarget as HTMLElement).dataset.roadType);
          handleRoadTypeClick(roadType);
        });
      });

      return div;
    };

    legend.addTo(map);
    legendRef.current = legend;

    return () => {
      if (legendRef.current) {
        legendRef.current.remove();
      }
    };
  }, [map, selectedRoadTypes, handleRoadTypeClick]);

  return null;
}