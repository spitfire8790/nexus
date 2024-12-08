import { useEffect, useRef, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { Button } from '@/components/ui/button';
import { Square, Ruler } from 'lucide-react';
import { useMapStore } from '@/lib/map-store';

// Extend the L.Map type to include the draw property
declare module 'leaflet' {
  interface Map {
    _toolbars?: any;
  }
}

export function MapMeasureControl() {
  const map = useMap();
  const featuresRef = useRef<L.FeatureGroup | null>(null);
  const controlRef = useRef<L.Control | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureMode = useMapStore((state) => state.measureMode);
  const setMeasureMode = useMapStore((state) => state.setMeasureMode);
  const [hasMeasurements, setHasMeasurements] = useState(false);

  // Refs for measurement state
  const tempLineRef = useRef<L.Polyline | null>(null);
  const drawingLineRef = useRef<L.Polyline | null>(null);
  const areaPolygonRef = useRef<L.Polygon | null>(null);
  const segmentTooltipsRef = useRef<L.Tooltip[]>([]);
  const pointsRef = useRef<L.LatLng[]>([]);
  const currentLatLngRef = useRef<L.LatLng | null>(null);
  const completedLinesRef = useRef<L.Polyline[]>([]);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const drawingTooltipsRef = useRef<L.Tooltip[]>([]);

  const clearMeasurements = () => {
    if (featuresRef.current) {
      featuresRef.current.clearLayers();
    }

    // Clear temp line
    if (tempLineRef.current) {
      map.removeLayer(tempLineRef.current);
      tempLineRef.current = null;
    }

    // Clear current drawing line
    if (drawingLineRef.current) {
      map.removeLayer(drawingLineRef.current);
      drawingLineRef.current = null;
    }

    // Clear area polygon
    if (areaPolygonRef.current) {
      map.removeLayer(areaPolygonRef.current);
      areaPolygonRef.current = null;
    }

    // Clear all completed lines
    completedLinesRef.current.forEach(line => {
      if (line) map.removeLayer(line);
    });
    completedLinesRef.current = [];

    // Clear all vertex markers
    vertexMarkersRef.current.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    vertexMarkersRef.current = [];

    // Clear all tooltips
    segmentTooltipsRef.current.forEach(tooltip => {
      if (tooltip) map.removeLayer(tooltip);
    });
    segmentTooltipsRef.current = [];

    // Clear drawing tooltips
    drawingTooltipsRef.current.forEach(tooltip => {
      if (tooltip) map.removeLayer(tooltip);
    });
    drawingTooltipsRef.current = [];

    pointsRef.current = [];
    currentLatLngRef.current = null;
    isDrawingRef.current = false;
    setHasMeasurements(false);
    setMeasureMode('none');
  };

  const renderContent = useCallback(() => {
    if (!rootRef.current) return;
    
    rootRef.current.render(
      <div className="flex items-center gap-2 p-0">
        {hasMeasurements && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs gap-2 whitespace-nowrap bg-white text-black hover:bg-gray-100"
            onClick={clearMeasurements}
          >
            Clear
          </Button>
        )}
        <Button
          variant={measureMode === 'distance' ? 'outline' : 'default'}
          size="sm"
          className={`h-8 px-3 text-xs gap-2 whitespace-nowrap ${
            measureMode === 'distance' 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          onClick={() => {
            setMeasureMode(measureMode === 'distance' ? 'none' : 'distance');
            if (featuresRef.current) {
              featuresRef.current.clearLayers();
            }
            if (map._toolbars?.draw) {
              Object.values(map._toolbars.draw._modes).forEach((mode: any) => {
                if (mode.handler?._enabled) {
                  mode.handler.disable();
                }
              });
            }
          }}
        >
          <Ruler className="h-4 w-4" />
          Distance
        </Button>

        <Button
          variant={measureMode === 'area' ? 'outline' : 'default'}
          size="sm"
          className={`h-8 px-3 text-xs gap-2 whitespace-nowrap ${
            measureMode === 'area' 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          onClick={() => {
            setMeasureMode(measureMode === 'area' ? 'none' : 'area');
            if (featuresRef.current) {
              featuresRef.current.clearLayers();
            }
            if (map._toolbars?.draw) {
              Object.values(map._toolbars.draw._modes).forEach((mode: any) => {
                if (mode.handler?._enabled) {
                  mode.handler.disable();
                }
              });
            }
          }}
        >
          <Square className="h-4 w-4" />
          Area
        </Button>
      </div>
    );
  }, [map, measureMode, setMeasureMode, hasMeasurements]);

  const updateSegmentLabels = (includeClosingSegment: boolean = false) => {
    // Clear existing drawing tooltips
    drawingTooltipsRef.current.forEach(tooltip => map.removeLayer(tooltip));
    drawingTooltipsRef.current = [];

    // Add distance label for each segment
    for (let i = 1; i < pointsRef.current.length; i++) {
      const distance = pointsRef.current[i-1].distanceTo(pointsRef.current[i]);
      const midPoint = L.latLng(
        (pointsRef.current[i-1].lat + pointsRef.current[i].lat) / 2,
        (pointsRef.current[i-1].lng + pointsRef.current[i].lng) / 2
      );
      const tooltip = createTooltip(formatNumber(distance), midPoint);
      drawingTooltipsRef.current.push(tooltip);
    }

    // Add closing segment if requested (for area mode)
    if (includeClosingSegment && pointsRef.current.length >= 3) {
      const distance = pointsRef.current[pointsRef.current.length - 1].distanceTo(pointsRef.current[0]);
      const midPoint = L.latLng(
        (pointsRef.current[pointsRef.current.length - 1].lat + pointsRef.current[0].lat) / 2,
        (pointsRef.current[pointsRef.current.length - 1].lng + pointsRef.current[0].lng) / 2
      );
      const tooltip = createTooltip(formatNumber(distance), midPoint);
      drawingTooltipsRef.current.push(tooltip);
    }
  };

  // Initialize the control
  useEffect(() => {
    if (!map) return;

    // Add measurement styles
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-draw-tooltip {
        display: none !important;
      }
      .measure-tooltip {
        background: rgba(0, 0, 0, 0.8) !important;
        border: none !important;
        color: white !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        padding: 4px 10px !important;
        border-radius: 4px !important;
        white-space: nowrap !important;
        pointer-events: none !important;
      }
      .area-tooltip {
        font-size: 14px !important;
        font-weight: 600 !important;
        background: rgba(0, 0, 0, 0.9) !important;
      }
      .measure-tooltip::before {
        display: none !important;
      }
      .leaflet-draw-guide-dash {
        display: none !important;
      }
      .leaflet-draw-draw-polyline,
      .leaflet-draw-draw-polygon {
        cursor: crosshair !important;
      }
      .leaflet-draw-guide {
        filter: drop-shadow(0 0 4px rgba(37, 99, 235, 0.5));
      }
      .measure-vertex-icon {
        background: transparent !important;
        border: none !important;
      }
      .measure-vertex {
        width: 8px !important;
        height: 8px !important;
        background: white !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 50% !important;
        box-shadow: 0 0 4px rgba(0,0,0,0.2) !important;
      }
      .leaflet-container,
      .leaflet-grab,
      .leaflet-marker-icon,
      .leaflet-marker-shadow,
      .leaflet-image-layer,
      .leaflet-pane > svg path,
      .leaflet-tile-container,
      .leaflet-zoom-box,
      .leaflet-overlay-pane path {
        cursor: ${measureMode !== 'none' ? 'crosshair !important' : 'grab'};
      }
      .leaflet-dragging .leaflet-grab {
        cursor: ${measureMode !== 'none' ? 'crosshair !important' : 'grabbing'} !important;
      }
    `;
    document.head.appendChild(style);

    // Initialize feature group and add to map
    featuresRef.current = new L.FeatureGroup();
    map.addLayer(featuresRef.current);

    // Create UI container
    const container = document.createElement('div');
    container.className = 'leaflet-control leaflet-bar';
    container.style.cssText = `
      background-color: transparent;
      padding: 0;
      margin: 10px;
      border-radius: 4px;
      display: flex;
      z-index: 1000;
      border: none;
    `;
    containerRef.current = container;
    
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const Control = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => container,
      onRemove: () => {
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }
      }
    });

    controlRef.current = new Control();
    controlRef.current.addTo(map);
    rootRef.current = createRoot(container);

    // Initial render
    renderContent();

    return () => {
      map.off('draw:created');
      map.off(L.Draw.Event.DRAWSTART);
      map.off('draw:drawvertex');
      document.head.removeChild(style);
      
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
      if (featuresRef.current) {
        map.removeLayer(featuresRef.current);
        featuresRef.current = null;
      }
      containerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    renderContent();
  }, [renderContent]);

  useEffect(() => {
    if (!map) return;

    // Update cursor style based on measure mode
    if (measureMode !== 'none') {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [map, measureMode]);

  // Handle measure mode changes
  useEffect(() => {
    if (!map || !featuresRef.current) return;

    // Clear existing handlers
    if (map._toolbars?.draw) {
      Object.values(map._toolbars.draw._modes).forEach((mode: any) => {
        if (mode.handler?._enabled) {
          mode.handler.disable();
        }
      });
    }

    // Remove existing event listeners
    map.off('draw:created');
    map.off(L.Draw.Event.DRAWSTART);
    map.off('mousemove');
    map.off('draw:drawvertex');

    if (measureMode === 'none') {
      return;
    }

    let lastClickTime = 0;

    const formatNumber = (num: number, isArea: boolean = false) => {
      const formatWithCommas = (n: number) => {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      if (isArea) {
        // For areas, convert to km² if over 1,000,000 m²
        if (num >= 1_000_000) {
          return `${(num / 1_000_000).toFixed(1)} km²`;
        }
        // Otherwise show as integer m² with commas
        return `${formatWithCommas(Math.round(num))} m²`;
      }

      // For distances, convert to km if over 1,000m
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)} km`;
      }
      // Otherwise show as integer meters
      return `${formatWithCommas(Math.round(num))} m`;
    };

    const createTooltip = (content: string, position: L.LatLng, permanent: boolean = true) => {
      const tooltip = L.tooltip({
        permanent: permanent,
        direction: 'center',
        className: 'measure-tooltip'
      })
      .setContent(content)
      .setLatLng(position);
      
      tooltip.addTo(map);
      return tooltip;
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const clickTime = new Date().getTime();
      // Prevent click if it's part of a double click
      if (clickTime - lastClickTime < 300) {
        return;
      }
      lastClickTime = clickTime;

      isDrawingRef.current = true;
      const latlng = e.latlng;
      pointsRef.current.push(latlng);
      
      // Create vertex marker
      const marker = L.marker(latlng, {
        icon: new L.DivIcon({
          className: 'measure-vertex-icon',
          html: '<div class="measure-vertex"></div>',
          iconSize: [10, 10],
        })
      }).addTo(map);
      
      vertexMarkersRef.current.push(marker);
      featuresRef.current?.addLayer(marker);

      // Create or update drawing line
      if (drawingLineRef.current) {
        drawingLineRef.current.setLatLngs(pointsRef.current);
      } else {
        drawingLineRef.current = L.polyline(pointsRef.current, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
        }).addTo(map);
        featuresRef.current?.addLayer(drawingLineRef.current);
      }

      // Update segment labels without closing segment while drawing
      updateSegmentLabels(false);
    };

    // Handle double click to finish measurement
    const handleDoubleClick = (e: L.LeafletMouseEvent) => {
      if (e) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      
      if (!isDrawingRef.current || pointsRef.current.length < 2) return;

      if (measureMode === 'area' && pointsRef.current.length >= 3) {
        // Close the polygon
        const closedPoints = [...pointsRef.current, pointsRef.current[0]];
        
        // Remove the line and create a filled polygon
        if (drawingLineRef.current) {
          map.removeLayer(drawingLineRef.current);
          drawingLineRef.current = null;
        }

        areaPolygonRef.current = L.polygon(closedPoints, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
          fillColor: '#3b82f6',
          fillOpacity: 0.1
        }).addTo(map);
        featuresRef.current?.addLayer(areaPolygonRef.current);

        const polygon = turf.polygon([[
          ...closedPoints.map(p => [p.lng, p.lat])
        ]]);
        const area = turf.area(polygon);
        
        // Calculate true centroid using turf
        const centroid = turf.centroid(polygon);
        const center = L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);

        // Create permanent tooltips for the completed shape
        const currentTooltips: L.Tooltip[] = [];
        
        // Add segment labels
        for (let i = 1; i < closedPoints.length; i++) {
          const distance = closedPoints[i-1].distanceTo(closedPoints[i]);
          const midPoint = L.latLng(
            (closedPoints[i-1].lat + closedPoints[i].lat) / 2,
            (closedPoints[i-1].lng + closedPoints[i].lng) / 2
          );
          const tooltip = createTooltip(formatNumber(distance), midPoint);
          currentTooltips.push(tooltip);
        }

        // Add the area label at centroid
        const areaTooltip = createTooltip(formatNumber(area, true), center, true);
        currentTooltips.push(areaTooltip);

        // Add all tooltips to our refs array
        segmentTooltipsRef.current.push(...currentTooltips);
        setHasMeasurements(true);
      } else if (measureMode === 'distance') {
        // Create permanent tooltips for the completed line
        const currentTooltips: L.Tooltip[] = [];
        for (let i = 1; i < pointsRef.current.length; i++) {
          const distance = pointsRef.current[i-1].distanceTo(pointsRef.current[i]);
          const midPoint = L.latLng(
            (pointsRef.current[i-1].lat + pointsRef.current[i].lat) / 2,
            (pointsRef.current[i-1].lng + pointsRef.current[i].lng) / 2
          );
          const tooltip = createTooltip(formatNumber(distance), midPoint);
          currentTooltips.push(tooltip);
        }

        // Save the completed line
        if (drawingLineRef.current) {
          const completedLine = L.polyline(pointsRef.current, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.8,
          }).addTo(map);
          
          completedLinesRef.current.push(completedLine);
          featuresRef.current?.addLayer(completedLine);

          // Remove the drawing line since we've created a permanent one
          map.removeLayer(drawingLineRef.current);
          drawingLineRef.current = null;
        }

        // Add the tooltips to our refs array
        segmentTooltipsRef.current.push(...currentTooltips);
        setHasMeasurements(true);
      }

      // Clean up temp elements
      if (tempLineRef.current) {
        map.removeLayer(tempLineRef.current);
        tempLineRef.current = null;
      }

      // Clear drawing tooltips
      drawingTooltipsRef.current.forEach(tooltip => map.removeLayer(tooltip));
      drawingTooltipsRef.current = [];

      // Reset for next measurement
      pointsRef.current = [];
      currentLatLngRef.current = null;
      isDrawingRef.current = false;
    };

    // Handle right click to finish measurement
    const handleRightClick = () => {
      handleDoubleClick(null);
    };

    // Handle mousemove for temp line preview
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (pointsRef.current.length === 0) return;
      
      const latlng = e.latlng;
      currentLatLngRef.current = latlng;

      if (tempLineRef.current) {
        if (measureMode === 'area' && pointsRef.current.length >= 2) {
          tempLineRef.current.setLatLngs([pointsRef.current[pointsRef.current.length - 1], latlng, pointsRef.current[0]]);
        } else {
          tempLineRef.current.setLatLngs([pointsRef.current[pointsRef.current.length - 1], latlng]);
        }
      } else {
        tempLineRef.current = L.polyline([pointsRef.current[pointsRef.current.length - 1], latlng], {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.5,
          dashArray: '5,10',
        }).addTo(map);
        featuresRef.current?.addLayer(tempLineRef.current);
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.on('contextmenu', handleRightClick);
    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('contextmenu', handleRightClick);
      map.off('dblclick', handleDoubleClick);
      
      if (tempLineRef.current) {
        map.removeLayer(tempLineRef.current);
      }
      if (drawingLineRef.current) {
        map.removeLayer(drawingLineRef.current);
      }
      if (areaPolygonRef.current) {
        map.removeLayer(areaPolygonRef.current);
      }
      if (segmentTooltipsRef.current.length > 0) {
        segmentTooltipsRef.current.forEach(tooltip => map.removeLayer(tooltip));
      }
      if (drawingTooltipsRef.current.length > 0) {
        drawingTooltipsRef.current.forEach(tooltip => map.removeLayer(tooltip));
      }
    };
  }, [map, measureMode]);

  return null;
}