import { create } from 'zustand';

export interface MapLayer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  opacity?: number;
  attribution?: string;
  type?: 'tile' | 'dynamic' | 'geojson';
  layerId?: number;
  showLabels?: boolean;
  filter?: string;
  selectedZones?: string[];
  className?: string;
  hidden?: boolean;
  data?: GeoJSON.GeoJsonObject;
}

interface PropertyData {
  geometry: any;
  address?: string;
  propId?: string;
  lots?: Array<{
    attributes: {
      LotDescription: string;
    };
  }>;
}

interface MapState {
  layerGroups: LayerGroup[];
  selectedProperty: PropertyData | null;
  setSelectedProperty: (property: PropertyData | null) => void;
  toggleLayer: (id: string) => void;
  updateSelectedZones: (id: string, zones: string[]) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  updateLayerUrl: (id: string, url: string) => void;
  bufferGeometry: any | null;
  setBufferGeometry: (geometry: any) => void;
  zoneInfo: {
    zoneName: string | null;
    lgaName: string | null;
  } | null;
  setZoneInfo: (info: { zoneName: string; lgaName: string } | null) => void;
  setLayerGroups: (groups: LayerGroup[]) => void;
  mapInstance: L.Map | null;
  setMapInstance: (map: L.Map | null) => void;
}

export interface ZoneOption {
  code: string;
  description: string;
}

export const ZONE_OPTIONS: ZoneOption[] = [
  { code: '2(a)', description: '2(a) Residential (Low Density)' },
  { code: 'A', description: 'A Residential Zone - Medium Density Residential' },
  { code: 'AGB', description: 'AGB Agribusiness' },
  { code: 'B', description: 'B Business Zone - Local Centre' },
  { code: 'B1', description: 'B1 Neighbourhood Centre' },
  { code: 'B2', description: 'B2 Local Centre' },
  { code: 'B3', description: 'B3 Commercial Core' },
  { code: 'B4', description: 'B4 Mixed Use' },
  { code: 'B5', description: 'B5 Business Development' },
  { code: 'B6', description: 'B6 Enterprise Corridor' },
  { code: 'B7', description: 'B7 Business Park' },
  { code: 'C', description: 'C Business Zone - Business Park' },
  { code: 'C1', description: 'C1 National Parks and Nature Reserves' },
  { code: 'C2', description: 'C2 Environmental Conservation' },
  { code: 'C3', description: 'C3 Environmental Management' },
  { code: 'C4', description: 'C4 Environmental Living' },
  { code: 'CA', description: 'CA Complex Area' },
  { code: 'D', description: 'D Business Zone - Mixed Use' },
  { code: 'DM', description: 'DM Deferred Matter' },
  { code: 'DR', description: 'DR Drainage' },
  { code: 'E', description: 'E Environment' },
  { code: 'E1', description: 'E1 Local Centre' },
  { code: 'E2', description: 'E2 Commercial Centre' },
  { code: 'E3', description: 'E3 Productivity Support' },
  { code: 'E4', description: 'E4 General Industrial' },
  { code: 'E5', description: 'E5 Heavy Industrial' },
  { code: 'EM', description: 'EM Employment' },
  { code: 'ENP', description: 'ENP Environment Protection' },
  { code: 'ENT', description: 'ENT Enterprise' },
  { code: 'ENZ', description: 'ENZ Environment and Recreation' },
  { code: 'EP', description: 'EP Employment' },
  { code: 'F', description: 'F Special Purposes Zone - Community' },
  { code: 'G', description: 'G Special Purposes Zone - Infrastructure' },
  { code: 'H', description: 'H Recreation Zone - Public Recreation' },
  { code: 'I', description: 'I Recreation Zone - Private Recreation' },
  { code: 'IN1', description: 'IN1 General Industrial' },
  { code: 'IN2', description: 'IN2 Light Industrial' },
  { code: 'IN3', description: 'IN3 Heavy Industrial' },
  { code: 'MAP', description: 'MAP Marine Park' },
  { code: 'MU', description: 'MU Mixed Use' },
  { code: 'MU1', description: 'MU1 Mixed Use' },
  { code: 'P', description: 'P Parkland' },
  { code: 'PAE', description: 'PAE Port and Employment' },
  { code: 'PEP', description: 'PEP Permanent Park Preserve' },
  { code: 'PRC', description: 'PRC Public Recreation' },
  { code: 'R', description: 'R Residential' },
  { code: 'R1', description: 'R1 General Residential' },
  { code: 'R2', description: 'R2 Low Density Residential' },
  { code: 'R3', description: 'R3 Medium Density Residential' },
  { code: 'R4', description: 'R4 High Density Residential' },
  { code: 'R5', description: 'R5 Large Lot Residential' },
  { code: 'RAC', description: 'RAC Rural Activity Zone' },
  { code: 'RAZ', description: 'RAZ Rural Activity Zone' },
  { code: 'RE1', description: 'RE1 Public Recreation' },
  { code: 'RE2', description: 'RE2 Private Recreation' },
  { code: 'REC', description: 'REC Recreation' },
  { code: 'REZ', description: 'REZ Regional Enterprise Zone' },
  { code: 'RO', description: 'RO Regional Open Space' },
  { code: 'RP', description: 'RP Regional Park' },
  { code: 'RU1', description: 'RU1 Primary Production' },
  { code: 'RU2', description: 'RU2 Rural Landscape' },
  { code: 'RU3', description: 'RU3 Forestry' },
  { code: 'RU4', description: 'RU4 Primary Production Small Lots' },
  { code: 'RU5', description: 'RU5 Village' },
  { code: 'RU6', description: 'RU6 Transition' },
  { code: 'RUR', description: 'RUR Rural' },
  { code: 'RW', description: 'RW Road and Road Widening' },
  { code: 'SET', description: 'SET Settlement' },
  { code: 'SP1', description: 'SP1 Special Activities' },
  { code: 'SP2', description: 'SP2 Infrastructure' },
  { code: 'SP3', description: 'SP3 Tourist' },
  { code: 'SP4', description: 'SP4 Enterprise' },
  { code: 'SP5', description: 'SP5 Metropolitan Centre' },
  { code: 'SPU', description: 'SPU Special Uses' },
  { code: 'T', description: 'T Tourism' },
  { code: 'U', description: 'U Unzoned' },
  { code: 'UD', description: 'UD Urban Development' },
  { code: 'UL', description: 'UL Unzoned Land' },
  { code: 'UR', description: 'UR Urban' },
  { code: 'W', description: 'W Waterway' },
  { code: 'W1', description: 'W1 Natural Waterways' },
  { code: 'W2', description: 'W2 Recreational Waterways' },
  { code: 'W3', description: 'W3 Working Waterways' },
  { code: 'W4', description: 'W4 Working Waterfront' },
  { code: 'WFU', description: 'WFU Waterfront Use' }
];

interface LayerGroup {
  id: string;
  name: string;
  layers: MapLayer[];
}

export const useMapStore = create<MapState>((set) => ({
  layerGroups: [
    {
      id: 'basemaps',
      name: 'Base Maps',
      layers: [
        {
          id: 'metromap',
          name: 'Metro Map',
          url: '',
          enabled: false,
          type: 'tile',
          hidden: true,
          opacity: 0.7,
          attribution: '© Metromap'
        },
        {
          id: 'imagery',
          name: 'NSW Imagery',
          url: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}',
          enabled: false,
          type: 'tile',
          opacity: 1,
          attribution: '© NSW Government - Department of Customer Service',
          className: 'seamless-tiles'
        }
      ]
    },
    {
      id: 'cadastre',
      name: 'Cadastre',
      layers: [
        {
          id: 'cadastre',
          name: 'Lots',
          url: 'https://mapprod2.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 8,
          opacity: 1,
          showLabels: false,
          attribution: '© NSW Government - Department of Customer Service'
        }
      ]
    },
    {
      id: 'planning',
      name: 'Planning Controls',
      layers: [
        {
          id: 'zoning',
          name: 'Land Zoning',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 19,
          opacity: 0.7,
          selectedZones: [],
          attribution: '© NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'fsr',
          name: 'Floor Space Ratio',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 11,
          opacity: 0.7,
          attribution: '© NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'height',
          name: 'Height of Building',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 14,
          opacity: 0.7,
          attribution: '© NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'heritage',
          name: 'Heritage',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 16,
          opacity: 0.7,
          attribution: '© NSW Government - Department of Planning, Housing and Infrastructure'
        }
      ]
    },
    {
      id: 'constraints',
      name: 'Constraints',
      layers: [
        {
          id: 'bushfire',
          name: 'Bushfire Prone Land',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 229,
          opacity: 0.7,
          attribution: '© NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'contamination',
          name: 'Contaminated Land',
          url: 'https://maptest2.environment.nsw.gov.au/arcgis/rest/services/EPA/EPACS/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 1,
          opacity: 0.7,
          attribution: '© NSW Government - EPA'
        }
      ]
    }
  ],
  selectedProperty: null,
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  toggleLayer: (id) =>
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? { ...layer, enabled: !layer.enabled } : layer
        )
      }))
    })),

  updateSelectedZones: (id, zones) => {
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? {
            ...layer,
            selectedZones: zones,
            filter: zones.length > 0 ? `SYM_CODE IN ('${zones.join("','")}')` : ''
          } : layer
        )
      }))
    }));
  },

  updateLayerOpacity: (id, opacity) =>
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? { ...layer, opacity } : layer
        )
      }))
    })),

  updateLayerUrl: (id, url) =>
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? { ...layer, url } : layer
        )
      }))
    })),

  bufferGeometry: null,
  setBufferGeometry: (geometry) => set({ bufferGeometry: geometry }),
  zoneInfo: null,
  setZoneInfo: (info: { zoneName: string; lgaName: string } | null) => 
    set({ zoneInfo: info }),
  setLayerGroups: (groups) => set({ layerGroups: groups }),
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
}));