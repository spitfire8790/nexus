import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';

export function initGeoman(map: L.Map) {
  // Initialize Geoman drawing controls
  map.pm.addControls({
    position: 'topleft',
    drawCircle: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: false,
    drawPolygon: true,
    editMode: true,
    dragMode: false,
    cutPolygon: false,
    removalMode: true,
    rotateMode: false,
  });

  // Set global options
  map.pm.setGlobalOptions({
    snapDistance: 20,
    snapSegment: true,
    snapMiddle: false,
    snapVertex: true,
    allowSelfIntersection: false,
    preventMarkerRemoval: false,
    hideMiddleMarkers: false,
  });
} 