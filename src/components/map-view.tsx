import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, LayersControl, useMapEvents, ZoomControl } from 'react-leaflet';
import * as L from 'leaflet';
import * as EL from 'esri-leaflet';
import * as ELG from 'esri-leaflet-geocoder';
import 'leaflet/dist/leaflet.css';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import { useMapStore } from '@/lib/map-store';
import { MapLegends } from '@/components/map/map-legends';
import { AmenitiesLegend } from './analytics/tabs/amenities-tab';
import { TemperatureControls } from './map/temperature-controls';
import { TemperatureLegend } from './map/temperature-legend';
import { TrainStationsLayer } from './map/train-stations-layer';
import { LightRailStopsLayer } from './map/light-rail-stops-layer';
import { MetroStationsLayer } from './map/sydney-metro-station-layer';
import { MapMeasureControl } from './map/map-measure-control';
import { DevelopmentApplicationsLayer } from './map/development-applications-layer';
import { ImageryDateOverlay } from './map/imagery-date-overlay';
import { RoadsLayer } from './map/roads-layer';
import { Layers, Tag } from 'lucide-react';
import { RoadLabelsLayer } from './map/road-labels-layer';
import { throttle } from 'lodash';
import { initGeoman } from '@/lib/geoman';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.Icon.extend({
  options: {
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }
});

L.Marker.prototype.options.icon = new DefaultIcon();

// Add type declarations for Geoman
declare module 'leaflet' {
  interface Map {
    pm: PMMap;
  }
  
  interface PMMap {
    addControls: (options: PMControlOptions) => void;
    removeControls: () => void;
    initialize: (options: { optIn: boolean }) => void;
    Toolbar?: any;
    Keyboard?: any;
  }

  interface PMControlOptions {
    position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    drawCircle?: boolean;
    drawCircleMarker?: boolean;
    drawPolyline?: boolean;
    drawRectangle?: boolean;
    drawPolygon?: boolean;
    drawMarker?: boolean;
    cutPolygon?: boolean;
    rotateMode?: boolean;
  }
}

// Constants for pane management
const BASE_PANE = 'base-pane';
const BASE_PANE_Z_INDEX = 1;
const OVERLAY_PANE = 'overlay-pane';
const OVERLAY_PANE_Z_INDEX = 200;
const BOUNDARY_PANE = 'boundary';
const BOUNDARY_PANE_Z_INDEX = 300;
const RADIUS_PANE = 'radius-pane';
const RADIUS_PANE_Z_INDEX = 350;
const AMENITIES_PANE = 'amenities-pane';
const AMENITIES_PANE_Z_INDEX = 400;
export const AMENITIES_POPUP_PANE = 'amenities-popup-pane';
export const AMENITIES_POPUP_PANE_Z_INDEX = 450;
const WIKI_PANE = 'wiki-pane';
const WIKI_PANE_Z_INDEX = 1000;
export const WIKI_POPUP_PANE = 'wiki-popup-pane';
export const WIKI_POPUP_PANE_Z_INDEX = 1001;

function MapClickHandler() {
  const { setSelectedProperty } = useMapStore();
  const mapSelectMode = useMapStore((state) => state.mapSelectMode);

  useMapEvents({
    click: async (e) => {
      if (!mapSelectMode) return;
      
      try {
        // Convert clicked point to Web Mercator coordinates
        const point = L.CRS.EPSG3857.project(e.latlng);
        
        const geometry = {
          spatialReference: {
            latestWkid: 3857,
            wkid: 102100
          },
          x: point.x,
          y: point.y
        };
        
        const response = await fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/property?geometry=${encodeURIComponent(JSON.stringify(geometry))}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const propId = await response.text();
        
        if (propId) {
          const [boundaryResponse, lotsResponse, addressResponse] = await Promise.all([
            fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/boundary?id=${propId}&Type=property`),
            fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${propId}`),
            fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`)
          ]);

          if (!boundaryResponse.ok || !lotsResponse.ok || !addressResponse.ok) {
            throw new Error('Failed to fetch property details');
          }

          const [boundaryData] = await boundaryResponse.json();
          const lotsData = await lotsResponse.json();
          const address = await addressResponse.text();
          
          if (boundaryData?.geometry) {
            setSelectedProperty({
              ...boundaryData,
              propId,
              lots: lotsData || [],
              address: address.replace(/^"|"$/g, '')
            });
          }
        }
      } catch (error) {
        console.error("Error identifying property:", error);
      }
    }
  });

  return null;
}

function MapController() {
  const map = useMap();
  const [mousePosition, setMousePosition] = useState<L.LatLng | null>(null);
  const searchControlRef = useRef<any>(null);
  
  useEffect(() => {
    console.log('Initial map center:', map.getCenter());
    
    // Add a moveend event listener to track center changes
    const onMoveEnd = () => {
      console.log('Map moved to:', map.getCenter());
      console.log('Move triggered by:', new Error().stack);
    };
    
    map.on('moveend', onMoveEnd);
    
    // Create custom panes with proper z-index ordering
    if (!map.getPane(BASE_PANE)) {
      map.createPane(BASE_PANE);
      map.getPane(BASE_PANE)!.style.zIndex = BASE_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(OVERLAY_PANE)) {
      map.createPane(OVERLAY_PANE);
      map.getPane(OVERLAY_PANE)!.style.zIndex = OVERLAY_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(BOUNDARY_PANE)) {
      map.createPane(BOUNDARY_PANE);
      map.getPane(BOUNDARY_PANE)!.style.zIndex = BOUNDARY_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(RADIUS_PANE)) {
      map.createPane(RADIUS_PANE);
      map.getPane(RADIUS_PANE)!.style.zIndex = '399';
    }

    if (!map.getPane(AMENITIES_PANE)) {
      map.createPane(AMENITIES_PANE);
      map.getPane(AMENITIES_PANE)!.style.zIndex = AMENITIES_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(AMENITIES_POPUP_PANE)) {
      map.createPane(AMENITIES_POPUP_PANE);
      map.getPane(AMENITIES_POPUP_PANE)!.style.zIndex = AMENITIES_POPUP_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(WIKI_PANE)) {
      map.createPane(WIKI_PANE);
      map.getPane(WIKI_PANE)!.style.zIndex = WIKI_PANE_Z_INDEX.toString();
    }

    if (!map.getPane(WIKI_POPUP_PANE)) {
      map.createPane(WIKI_POPUP_PANE);
      map.getPane(WIKI_POPUP_PANE)!.style.zIndex = WIKI_POPUP_PANE_Z_INDEX.toString();
    }

    // Initialize Leaflet.Geoman controls
    let isGeomanInitialized = false;

    const initializeGeoman = async () => {
      try {
        await initGeoman(map);
        isGeomanInitialized = true;
      } catch (error) {
        console.error('Error initializing Geoman:', error);
      }
    };

    initializeGeoman();

    return () => {
      if (isGeomanInitialized && map.pm) {
        map.pm.removeControls();
      }
    };
  }, [map]);

  return <CoordinateDisplay position={mousePosition} />;
}

function CoordinateDisplay({ position }: { position: L.LatLng | null }) {
  if (!position) return null;
  
  return (
    <div className="absolute bottom-1 left-1 z-[400] bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono border shadow-sm">
      {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
    </div>
  );
}

function OverlayLayers() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const groupEnabledStates = useMapStore((state) => state.groupEnabledStates);
  const layerRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    const allLayers = layerGroups.flatMap(group => ({
      ...group,
      layers: group.layers.map(layer => ({
        ...layer,
        effectivelyEnabled: layer.enabled && groupEnabledStates[group.id]
      }))
    })).flatMap(group => group.layers);

    allLayers.forEach(layer => {
      if (layer.effectivelyEnabled) {
        // Skip custom layers as they're handled by their own components
        if (layer.type === 'custom') {
          return;
        }

        if (!layerRefs.current[layer.id]) {
          if (layer.type === 'dynamic') {
            const layerOptions: any = {
              url: layer.url,
              layers: [layer.layerId],
              opacity: layer.opacity,
              pane: OVERLAY_PANE,
            };

            if (layer.filter) {
              layerOptions.layerDefs = {
                [layer.layerId!]: layer.filter
              };
            }

            layerRefs.current[layer.id] = EL.dynamicMapLayer(layerOptions).addTo(map);
          } else if (layer.type === 'wms') {
            const wmsOptions: L.WMSOptions = {
              layers: layer.wmsLayers,
              format: layer.wmsParams?.format || 'image/jpeg',
              transparent: layer.wmsParams?.transparent || true,
              version: layer.wmsParams?.version || '1.1.1',
              opacity: layer.opacity,
              attribution: layer.attribution,
              pane: OVERLAY_PANE,
              maxZoom: 21,
              maxNativeZoom: 21,
              tileSize: 256,
              className: layer.className || 'seamless-tiles',
              updateInterval: 150,
              keepBuffer: 4,
              updateWhenZooming: true,
              updateWhenIdle: true,
              zIndex: 410,
              noWrap: true
            };

            if (layer.id === 'nearmap') {
              // Additional optimizations for Nearmap layer
              Object.assign(wmsOptions, {
                dpi: 96,
                bounds: map.getBounds().pad(1)
              });
            }

            layerRefs.current[layer.id] = L.tileLayer.wms(layer.url || '', wmsOptions).addTo(map);
          } else if (layer.type === 'tile') {
            layerRefs.current[layer.id] = L.tileLayer(layer.url || '', {
              opacity: layer.opacity,
              attribution: layer.attribution,
              className: layer.className,
              pane: OVERLAY_PANE,
              maxZoom: 21,
              maxNativeZoom: 19,
              tileSize: 256,
              crossOrigin: true
            }).addTo(map);
          } else if (layer.type === 'geojson') {
            layerRefs.current[layer.id] = L.geoJSON(layer.data, {
              pane: OVERLAY_PANE,
              pointToLayer: (_feature, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 8,
                  fillColor: "#2563eb",
                  color: "#fff",
                  weight: 1,
                  opacity: layer.opacity,
                  fillOpacity: 0.8
                });
              }
            }).addTo(map);
          }
        }
        
        // Only try to set opacity for layers with setOpacity method
        if (layerRefs.current[layer.id] && 'setOpacity' in layerRefs.current[layer.id]) {
          layerRefs.current[layer.id].setOpacity(layer.opacity || 1);
        }
      } else {
        if (layerRefs.current[layer.id]) {
          map.removeLayer(layerRefs.current[layer.id]);
          delete layerRefs.current[layer.id];
        }
      }
    });

    return () => {
      Object.values(layerRefs.current).forEach(layer => {
        if (layer) map.removeLayer(layer);
      });
      layerRefs.current = {};
    };
  }, [map, layerGroups, groupEnabledStates]);

  return (
    <>
      <LayersControl.Overlay name="Development Applications" checked>
        <DevelopmentApplicationsLayer />
      </LayersControl.Overlay>
      <LayersControl.Overlay name="Roads" checked>
        <RoadsLayer />
      </LayersControl.Overlay>
      <LayersControl.Overlay name="Road Labels" checked>
        <RoadLabelsLayer />
      </LayersControl.Overlay>
    </>
  );
}

function PropertyBoundary() {
  const map = useMap();
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const boundaryRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (selectedProperty?.geometry) {
      if (boundaryRef.current) {
        map.removeLayer(boundaryRef.current);
      }

      // Transform coordinates from Web Mercator to WGS84
      const transformedRings = selectedProperty.geometry.rings.map((ring: number[][]) => {
        return ring.map((coord: number[]) => {
          const point = L.point(coord[0], coord[1]);
          const latLng = L.CRS.EPSG3857.unproject(point);
          return [latLng.lng, latLng.lat];
        });
      });

      const geoJsonFeature: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: transformedRings
        }
      };

      try {
        boundaryRef.current = L.geoJSON(geoJsonFeature, {
          pane: BOUNDARY_PANE,
          style: {
            color: '#ef4444',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.1
          }
        }).addTo(map);

        const bounds = boundaryRef.current.getBounds();
        map.fitBounds(bounds, {
          padding: [50, 50]
        });
      } catch (error) {
        console.error('Error creating/adding boundary layer:', error);
      }
    } else {
      if (boundaryRef.current) {
        map.removeLayer(boundaryRef.current);
        boundaryRef.current = null;
      }
    }

    return () => {
      if (boundaryRef.current) {
        map.removeLayer(boundaryRef.current);
      }
    };
  }, [map, selectedProperty]);

  return null;
}

interface SearchRadiusCircleProps {
  radius?: number;
}

export function SearchRadiusCircle({ radius = 2000 }: SearchRadiusCircleProps) {
  const map = useMap();
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (selectedProperty?.geometry) {
      // Remove existing circle if it exists
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }

      // Calculate centroid from property geometry
      const rings = selectedProperty.geometry.rings[0];
      const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
      const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

      // Convert to WGS84
      const point = L.point(centerX, centerY);
      const latLng = L.CRS.EPSG3857.unproject(point);

      // Create circle
      circleRef.current = L.circle(latLng, {
        radius: radius,
        pane: RADIUS_PANE,
        color: '#000000', // black outline
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#e5e7eb', // gray-200
        fillOpacity: 0.15
      }).addTo(map);

      // Calculate bounds that include both the property and the circle
      const circleBounds = circleRef.current.getBounds();
      const propertyBounds = L.latLngBounds(
        selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const pt = L.point(coord[0], coord[1]);
          return L.CRS.EPSG3857.unproject(pt);
        })
      );

      // Fit map to combined bounds with smooth animation
      const bounds = circleBounds.extend(propertyBounds);
      map.fitBounds(bounds, {
        padding: [100, 100],
        duration: 0.8
      });
    }

    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [map, selectedProperty, radius]);

  return null;
}

function MapLayerController() {
  const map = useMap();
  const currentTab = useMapStore((state) => state.currentTab);
  const searchRadius = useMapStore((state) => state.searchRadius);
  const circleRef = useRef<L.Circle | null>(null);
  const selectedProperty = useMapStore((state) => state.selectedProperty);

  useEffect(() => {
    if (currentTab === 'amenities' && selectedProperty?.geometry) {
      // Calculate centroid from property geometry
      const rings = selectedProperty.geometry.rings[0];
      const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
      const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

      // Convert to WGS84
      const point = L.point(centerX, centerY);
      const latLng = L.CRS.EPSG3857.unproject(point);

      // Create circle
      circleRef.current = L.circle(latLng, {
        radius: searchRadius * 1000,
        pane: RADIUS_PANE,
        color: '#22c55e', // green-500
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1
      }).addTo(map);

      // Calculate bounds that include both the property and the circle
      const circleBounds = circleRef.current.getBounds();
      const propertyBounds = L.latLngBounds(
        selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const pt = L.point(coord[0], coord[1]);
          return L.CRS.EPSG3857.unproject(pt);
        })
      );

      // Fit map to combined bounds
      const bounds = circleBounds.extend(propertyBounds);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    };
  }, [map, currentTab, searchRadius, selectedProperty]);

  return null;
}

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const savedLayersRef = useRef<{ [key: string]: L.GeoJSON }>({});
  const markerLayersRef = useRef<{ [key: string]: L.Marker }>({});
  const isShowingAmenities = useMapStore((state) => state.isShowingAmenities);
  const savedProperties = useMapStore((state) => state.savedProperties);
  const measureMode = useMapStore((state) => state.measureMode);
  const showSavedProperties = useMapStore((state) => state.showSavedPropertyMarkers);

  // Move the throttled update inside the component
  const throttledUpdate = useCallback(
    throttle(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const currentZoom = map.getZoom();

      // Update existing layers instead of removing/re-adding
      Object.entries(savedLayersRef.current).forEach(([id, layer]) => {
        const shouldBeVisible = showSavedProperties && currentZoom <= 16;
        if (shouldBeVisible && !map.hasLayer(layer)) {
          map.addLayer(layer);
        } else if (!shouldBeVisible && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    }, 250),
    [showSavedProperties]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    map.on('moveend', throttledUpdate);
    map.on('zoomend', throttledUpdate);
    
    return () => {
      map.off('moveend', throttledUpdate);
      map.off('zoomend', throttledUpdate);
      throttledUpdate.cancel(); // Clean up the throttled function
    };
  }, [throttledUpdate]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[-33.8688, 151.2093]}
        zoom={13}
        maxZoom={21}
        minZoom={4}
        className="w-full h-full"
        ref={mapRef}
        style={{ background: '#f8f9fa' }}
        touchZoom={true}
        dragging={true}
        zoomControl={false}
      >
        <MapController />
        <MapClickHandler />
        <OverlayLayers />
        <PropertyBoundary />
        <MapLayerController />
        <MapMeasureControl />
        <ImageryDateOverlay />
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="leaflet-control-container">
            <div className="leaflet-control-zoom leaflet-bar leaflet-control">
              <ZoomControl position="bottomright" />
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 z-[1000] flex items-center">
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
        </div>
        <TrainStationsLayer />
        <LightRailStopsLayer />
        <MetroStationsLayer />
        <MapInitializer />
        <MapLegends />
        <AmenitiesLegend visible={isShowingAmenities} />
        <TemperatureControls />
        <TemperatureLegend />
      </MapContainer>
    </div>
  );
}

function getLayerDescription(layerId: string): { name: string; description: string; source: string; link: string } {
  const descriptions: Record<string, { name: string; description: string; source: string; link: string }> = {
    // ... existing descriptions ...
    'buildings3d': {
      name: '3D Buildings',
      description: 'OpenStreetMap 3D building models showing building footprints and heights',
      source: 'OpenStreetMap Contributors',
      link: 'https://osmbuildings.org/'
    }
  };
  
  return descriptions[layerId] || {
    name: 'Unknown Layer',
    description: 'No description available',
    source: 'Unknown',
    link: ''
  };
}

function MapInitializer() {
  const map = useMap();
  const setMapInstance = useMapStore((state) => state.setMapInstance);

  useEffect(() => {
    console.log('Map initialized:', map);
    setMapInstance(map);
    return () => setMapInstance(null);
  }, [map, setMapInstance]);

  return null;
}