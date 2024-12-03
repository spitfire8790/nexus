import { create } from 'zustand';
import * as L from 'leaflet';
import { supabase } from '@/lib/supabase';

export interface MapLayer {
  id: string;
  name: string;
  url?: string;
  enabled: boolean;
  opacity?: number;
  attribution?: string;
  type?: 'tile' | 'wms' | 'geojson' | 'custom' | 'dynamic';
  wmsLayers?: string;
  layerId?: number;
  showLabels?: boolean;
  filter?: string;
  selectedZones?: string[];
  className?: string;
  hidden?: boolean;
  data?: GeoJSON.GeoJsonObject;
  tooltipKey?: string;
  selectedRanges?: string[];
  fsrRange?: {
    min: number;
    max: number;
  } | null;
  timeIndex?: number;
  emissionScenario?: 'low' | 'high';
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
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  mapSelectMode: boolean;
  setMapSelectMode: (enabled: boolean) => void;
  headerAddress: string | null;
  setHeaderAddress: (address: string | null) => void;
  updateSelectedRanges: (id: string, ranges: string[]) => void;
  updateFSRRange: (id: string, range: { min: number; max: number } | null) => void;
  isShowingAmenities: boolean;
  setIsShowingAmenities: (value: boolean) => void;
  showAmenityLabels: boolean;
  setShowAmenityLabels: (show: boolean) => void;
  measureMode: 'none' | 'distance' | 'area';
  setMeasureMode: (mode: 'none' | 'distance' | 'area') => void;
  updateTimeIndex: (id: string, index: number) => void;
  updateEmissionScenario: (id: string, scenario: 'low' | 'high') => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  savedProperties: SavedProperty[];
  setSavedProperties: (properties: SavedProperty[]) => void;
  addSavedProperty: (property: Omit<SavedProperty, 'id'>) => Promise<void>;
  removeSavedProperty: (id: string) => Promise<void>;
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

interface SavedProperty {
  id: string;
  address: string;
  geometry: GeoJSON.Feature;
}

export const useMapStore = create<MapState>((set, get) => ({
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
          attribution: ' Metromap'
        },
        {
          id: 'imagery',
          name: 'NSW Imagery',
          url: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}',
          enabled: false,
          type: 'tile',
          opacity: 1,
          attribution: ' NSW Government - Department of Customer Service',
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
          attribution: ' NSW Government - Department of Customer Service'
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
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'fsr',
          name: 'Floor Space Ratio',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 11,
          opacity: 0.7,
          fsrRange: null,
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'height',
          name: 'Height of Building',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 14,
          opacity: 0.7,
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'heritage',
          name: 'Heritage',
          url: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 16,
          opacity: 0.7,
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
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
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
        },
        {
          id: 'contamination',
          name: 'Contaminated Land',
          url: 'https://maptest2.environment.nsw.gov.au/arcgis/rest/services/EPA/EPACS/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 1,
          opacity: 0.7,
          attribution: ' NSW Government - EPA'
        },
        {
          id: 'epa-licenses',
          name: 'EPA Licensed Premises',
          url: 'https://maptest1.environment.nsw.gov.au/arcgis/rest/services/EPA/Environment_Protection_Licences/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 2,
          opacity: 0.7,
          attribution: ' NSW Government - EPA'
        }
      ]
    },
    {
      id: 'climate',
      name: 'Climate',
      layers: [
        {
          id: 'temperature',
          name: 'Average Temperature',
          url: 'https://mapprod.environment.nsw.gov.au/arcgis/rest/services/NARCliM2/Tas/MapServer',
          enabled: false,
          type: 'dynamic',
          layerId: 0,
          opacity: 0.7,
          timeIndex: 0,
          emissionScenario: 'low',
          attribution: ' NSW Government - Department of Planning, Housing and Infrastructure'
        }
      ]
    },
    {
      id: 'transport',
      name: 'Transport',
      layers: [
        {
          id: 'train-stations',
          name: 'Train Stations',
          url: 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_FOI_Transport_Facilities/FeatureServer/1',
          enabled: false,
          type: 'custom',
          opacity: 1,
          attribution: '© Transport for NSW',
          data: null
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
        layers: group.layers.map(layer => {
          if (layer.id === id) {
            if (!layer.enabled && layer.type === 'wms' && !layer.wmsLayers) {
              console.warn(`Layer ${id} is missing wmsLayers property`);
              return layer;
            }
            return { ...layer, enabled: !layer.enabled };
          }
          return layer;
        })
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
  currentTab: 'overview',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  searchRadius: 1.5,
  setSearchRadius: (radius) => set({ searchRadius: radius }),
  mapSelectMode: false,
  setMapSelectMode: (enabled) => set({ mapSelectMode: enabled }),
  headerAddress: null,
  setHeaderAddress: (address) => set({ headerAddress: address }),
  updateSelectedRanges: (id, ranges) => {
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? {
            ...layer,
            selectedRanges: ranges,
            filter: ranges.length > 0 ? `FSR_RANGE IN ('${ranges.join("','")}')` : ''
          } : layer
        )
      }))
    }));
  },
  updateFSRRange: (id, range) => {
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? {
            ...layer,
            fsrRange: range,
            filter: range ? `FSR >= ${range.min} AND FSR <= ${range.max}` : ''
          } : layer
        )
      }))
    }));
  },
  isShowingAmenities: false,
  setIsShowingAmenities: (value) => set({ isShowingAmenities: value }),
  showAmenityLabels: true,
  setShowAmenityLabels: (show) => set({ showAmenityLabels: show }),
  measureMode: 'none',
  setMeasureMode: (mode) => set({ measureMode: mode }),
  updateTimeIndex: (id, index) => {
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? {
            ...layer,
            layerId: layer.emissionScenario === 'low' ? index : index + 35
          } : layer
        )
      }))
    }));
  },
  updateEmissionScenario: (id, scenario) => {
    set((state) => ({
      layerGroups: state.layerGroups.map(group => ({
        ...group,
        layers: group.layers.map(layer =>
          layer.id === id ? {
            ...layer,
            emissionScenario: scenario,
            layerId: scenario === 'low' ? layer.timeIndex : layer.timeIndex + 35
          } : layer
        )
      }))
    }));
  },
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  savedProperties: [],
  setSavedProperties: (properties) => set({ savedProperties: properties }),
  
  addSavedProperty: async (property) => {
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .insert({
          address: property.address,
          geometry: property.geometry,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        savedProperties: [...state.savedProperties, data]
      }));
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  },

  removeSavedProperty: async (id) => {
    try {
      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        savedProperties: state.savedProperties.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Error removing property:', error);
      throw error;
    }
  }
}));