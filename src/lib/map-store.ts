import { create } from 'zustand';

export interface MapLayer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  opacity?: number;
  attribution?: string;
  type?: 'tile' | 'dynamic';
  layerId?: number;
  showLabels?: boolean;
  filter?: string;
  selectedZones?: string[];
  className?: string;
  hidden?: boolean;
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
  toggleLabels: (id: string) => void;
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
}

export interface ZoneOption {
  code: string;
  description: string;
}

export const ZONE_OPTIONS: ZoneOption[] = [
  { code: 'R2', description: 'R2 Low Density Residential' },
  { code: 'R3', description: 'R3 Medium Density Residential' },
  { code: 'R4', description: 'R4 High Density Residential' },
  { code: 'B1', description: 'B1 Neighbourhood Centre' },
  { code: 'B2', description: 'B2 Local Centre' },
  { code: 'B3', description: 'B3 Commercial Core' },
  { code: 'B4', description: 'B4 Mixed Use' },
  { code: 'B5', description: 'B5 Business Development' },
  { code: 'B6', description: 'B6 Enterprise Corridor' },
  { code: 'B7', description: 'B7 Business Park' },
  { code: 'IN1', description: 'IN1 General Industrial' },
  { code: 'IN2', description: 'IN2 Light Industrial' },
  { code: 'IN3', description: 'IN3 Heavy Industrial' },
  { code: 'SP1', description: 'SP1 Special Activities' },
  { code: 'SP2', description: 'SP2 Infrastructure' },
  { code: 'RE1', description: 'RE1 Public Recreation' },
  { code: 'RE2', description: 'RE2 Private Recreation' },
  { code: 'E1', description: 'E1 National Parks and Nature Reserves' },
  { code: 'E2', description: 'E2 Environmental Conservation' },
  { code: 'E3', description: 'E3 Environmental Management' },
  { code: 'E4', description: 'E4 Environmental Living' },
  { code: 'W1', description: 'W1 Natural Waterways' },
  { code: 'W2', description: 'W2 Recreational Waterways' },
  { code: 'RU1', description: 'RU1 Primary Production' },
  { code: 'RU2', description: 'RU2 Rural Landscape' },
  { code: 'RU3', description: 'RU3 Forestry' },
  { code: 'RU4', description: 'RU4 Primary Production Small Lots' },
  { code: 'RU5', description: 'RU5 Village' },
  { code: 'RU6', description: 'RU6 Transition' }
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
          id: 'nsw-imagery',
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
          url: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 9,
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

  toggleLabels: (id) =>
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? { ...layer, showLabels: !layer.showLabels } : layer
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
}));