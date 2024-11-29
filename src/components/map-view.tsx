import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import * as EL from 'esri-leaflet';
import * as ELG from 'esri-leaflet-geocoder';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import { useMapStore } from '@/lib/map-store';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';

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

// Constants for pane management
const BASE_PANE = 'base-pane';
const BASE_PANE_Z_INDEX = 200;
const OVERLAY_PANE = 'overlay-pane';
const OVERLAY_PANE_Z_INDEX = 400;
const BOUNDARY_PANE = 'boundary';
const BOUNDARY_PANE_Z_INDEX = 600;
const RADIUS_PANE = 'radius-pane';

function MapClickHandler() {
  const { setSelectedProperty } = useMapStore();

  useMapEvents({
    click: async (e) => {
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
        console.log('Property ID:', propId);
        
        if (propId) {
          // Fetch both boundary and lots data
          const [boundaryResponse, lotsResponse] = await Promise.all([
            fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/boundary?id=${propId}&Type=property`),
            fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${propId}`)
          ]);

          if (!boundaryResponse.ok || !lotsResponse.ok) {
            throw new Error('Failed to fetch property details');
          }

          const [boundaryData] = await boundaryResponse.json();
          const lotsData = await lotsResponse.json();
          
          console.log('Boundary data:', boundaryData);
          console.log('Lots data:', lotsData);
          
          if (boundaryData?.geometry) {
            setSelectedProperty({
              ...boundaryData,
              propId,
              lots: lotsData || []
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

    // Initialize Leaflet.Geoman controls
    map.pm.addControls({
      position: 'topleft',
      drawControls: false,
      editControls: false,
      customControls: false,
    });

    // Add Esri Geocoder control
    const searchControl = (ELG as any).geosearch({
      position: 'topleft',
      placeholder: 'Search for places or addresses',
      useMapBounds: false,
      providers: [
        (ELG as any).arcgisOnlineProvider({
          nearby: {
            lat: -33.8688,
            lng: 151.2093
          }
        })
      ]
    }).addTo(map);

    searchControlRef.current = searchControl;

    // Add search result handler
    searchControl.on('results', (data: any) => {
      console.log('Search results:', data);
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('Selected search result:', result);
      }
    });

    // Add mousemove handler
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      setMousePosition(e.latlng);
    };

    map.on('mousemove', onMouseMove);

    // Trigger a resize event after the map is loaded
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(resizeTimer);
      map.pm.removeControls();
      if (searchControlRef.current) {
        searchControlRef.current.remove();
      }
      map.off('mousemove', onMouseMove);
      map.off('moveend', onMoveEnd);
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
  const layerRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    const allLayers = layerGroups.flatMap(group => group.layers);

    allLayers.forEach(layer => {
      if (layer.enabled) {
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
          } else if (layer.type === 'tile') {
            layerRefs.current[layer.id] = L.tileLayer(layer.url || '', {
              opacity: layer.opacity,
              attribution: layer.attribution,
              className: layer.className,
              pane: OVERLAY_PANE
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
        
        // Only try to set opacity for non-custom layers
        if (layerRefs.current[layer.id] && layer.type && layer.type !== 'custom') {
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
  }, [map, layerGroups]);

  return null;
}

function PropertyBoundary() {
  const map = useMap();
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const boundaryRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    console.log('PropertyBoundary effect triggered');
    console.log('Selected property:', selectedProperty);

    if (selectedProperty?.geometry) {
      console.log('Geometry found:', selectedProperty.geometry);
      
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

      console.log('Transformed coordinates:', transformedRings);

      const geoJsonFeature: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: transformedRings
        }
      };
      
      console.log('Created GeoJSON feature:', geoJsonFeature);

      try {
        boundaryRef.current = L.geoJSON(geoJsonFeature, {
          pane: BOUNDARY_PANE,
          style: {
            color: '#ef4444',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.1
          }
        }).addTo(map);
        console.log('Successfully added boundary layer to map');

        const bounds = boundaryRef.current.getBounds();
        console.log('Boundary bounds:', bounds);
        
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
        padding: [50, 50],
        duration: 1.2, // animation duration in seconds
        easeLinearity: 0.25
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

function Buildings3D() {
  const map = useMap();
  const layerGroups = useMapStore((state) => state.layerGroups);
  const buildings3dLayer = layerGroups
    .find(g => g.id === '3d')
    ?.layers.find(l => l.id === 'buildings3d');
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (!map || !buildings3dLayer?.enabled) return;

    deckRef.current = new Deck({
      canvas: 'deck-canvas',
      initialViewState: {
        latitude: map.getCenter().lat,
        longitude: map.getCenter().lng,
        zoom: map.getZoom(),
        pitch: 45,
        bearing: 0
      },
      controller: false,
      layers: [
        new GeoJsonLayer({
          id: 'buildings3d',
          // Provide initial empty GeoJSON structure with explicit typing
          data: {
            type: 'FeatureCollection' as const,
            features: [] as any[]
          },
          dataTransform: async (data: any) => {
            try {
              const response = await fetch(
                'https://services-ap1.arcgis.com/iA7fZQOnjY9D67Zx/arcgis/rest/services/OSM_AU_Buildings/FeatureServer/0/query?where=1%3D1&outFields=height,building_height&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson'
              );
              const jsonData = await response.json();
              
              // Check if response has the expected structure
              if (!jsonData || !jsonData.features) {
                console.error('Invalid response data:', jsonData);
                return {
                  type: 'FeatureCollection' as const,
                  features: []
                };
              }

              // Transform the data
              return {
                type: 'FeatureCollection' as const,
                features: Array.isArray(jsonData.features) ? jsonData.features.map((feature: any) => ({
                  type: 'Feature',
                  geometry: {
                    type: feature.geometry?.type || 'Polygon',
                    coordinates: feature.geometry?.coordinates || []
                  },
                  properties: feature.properties || {}
                })) : []
              };
            } catch (error) {
              console.error('Error loading GeoJSON data:', error);
              return {
                type: 'FeatureCollection' as const,
                features: []
              };
            }
          },
          getFillColor: [255, 255, 255, 255],
          getLineColor: [0, 0, 0, 255],
          getLineWidth: () => 1,
          lineWidthMinPixels: 1,
          getElevation: (d: any) => {
            if (!d?.properties) return 10;
            return Number(d.properties.height) || Number(d.properties.building_height) || 10;
          },
          elevationScale: 1,
          pickable: true,
          autoHighlight: true,
          wireframe: true,
          loadOptions: {
            fetch: {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            }
          },
          onDataLoad: (data: any) => {
            if (!data || !data.features) {
              console.error('Invalid GeoJSON data:', data);
            } else {
              console.log('Successfully loaded GeoJSON data with', data.features.length, 'features');
            }
          },
          updateTriggers: {
            getElevation: [],
            data: []
          }
        } as any)
      ],
      onError: (error) => {
        console.error('Deck.gl error:', error);
      },
      onViewStateChange: ({ viewState }) => {
        const { latitude, longitude, zoom } = viewState;
        map.setView([latitude, longitude], zoom, { animate: false });
      }
    });

    // Sync deck.gl view with Leaflet
    const onMapMove = () => {
      const center = map.getCenter();
      deckRef.current?.setProps({
        viewState: {
          latitude: center.lat,
          longitude: center.lng,
          zoom: map.getZoom(),
          pitch: 45,
          bearing: 0
        }
      });
    };

    map.on('move', onMapMove);

    return () => {
      map.off('move', onMapMove);
      deckRef.current?.finalize();
      deckRef.current = null;
    };
  }, [map, buildings3dLayer?.enabled]);

  return (
    <canvas
      id="deck-canvas"
      className={`deck-canvas ${buildings3dLayer?.enabled ? 'z-[1000]' : '-z-10'}`}
    />
  );
}

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  
  return (
    <MapContainer
      center={[-33.8688, 151.2093]}
      zoom={13}
      maxZoom={19}
      className="w-full h-full"
      ref={mapRef}
      style={{ background: '#f8f9fa' }}
    >
      <MapController />
      <MapClickHandler />
      <OverlayLayers />
      <PropertyBoundary />
      <MapLayerController />
      <Buildings3D />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Carto">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@3x.png"
            maxZoom={19}
            attribution='© OpenStreetMap contributors, © CARTO'
            maxNativeZoom={19}
            crossOrigin={true}
            pane={BASE_PANE}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="NSW Imagery">
          <TileLayer
            url="https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            maxNativeZoom={19}
            attribution='© NSW Government - Maps NSW'
            tileSize={256}
            crossOrigin={true}
            className="seamless-tiles"
            pane={BASE_PANE}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            pane={BASE_PANE}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
    </MapContainer>
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
