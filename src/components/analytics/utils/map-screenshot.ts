import html2canvas from 'html2canvas';
import { useMapStore } from '@/lib/map-store';

export enum ScreenshotType {
  BASE = 'base',
  ZONING = 'zoning',
  FSR = 'fsr',
  HOB = 'hob',
  HERITAGE = 'heritage',
  CONTOUR = 'contour',
  AERIAL = 'aerial',
  STREET_VIEW = 'street-view',
  BUSHFIRE = 'bushfire',
  BIODIVERSITY = 'biodiversity',
  CONTAMINATION = 'contamination',
  SNAPSHOT = 'snapshot',
}

/**
 * Captures a screenshot of the map with optional customization
 * 
 * @param mapInstance The map instance to capture (from mapStore)
 * @param type The type of screenshot to capture
 * @param showBoundary Whether to show the property boundary
 * @param additionalOptions Additional options for the screenshot
 * @returns Promise resolving to a data URL of the screenshot
 */
export const captureMapScreenshot = async (
  mapInstance: any,
  type: ScreenshotType = ScreenshotType.BASE,
  showBoundary: boolean = true,
  additionalOptions: any = {}
): Promise<string> => {
  if (!mapInstance) {
    throw new Error('Map instance is required');
  }

  // Store current map state
  const currentLayers = mapInstance.getLayers();
  const currentCenter = mapInstance.getCenter();
  const currentZoom = mapInstance.getZoom();
  
  try {
    // Apply screenshot-specific settings
    switch (type) {
      case ScreenshotType.ZONING:
        // Show zoning layer and hide others
        toggleMapLayers(mapInstance, ['zoning'], true);
        toggleMapLayers(mapInstance, ['aerial', 'contour', 'heritage'], false);
        break;
      case ScreenshotType.FSR:
        // Show FSR layer and hide others
        toggleMapLayers(mapInstance, ['fsr'], true);
        toggleMapLayers(mapInstance, ['aerial', 'contour', 'heritage'], false);
        break;
      case ScreenshotType.HOB:
        // Show Height of Building layer and hide others
        toggleMapLayers(mapInstance, ['hob'], true);
        toggleMapLayers(mapInstance, ['aerial', 'contour', 'heritage'], false);
        break;
      case ScreenshotType.HERITAGE:
        // Show Heritage layer and hide others
        toggleMapLayers(mapInstance, ['heritage'], true);
        toggleMapLayers(mapInstance, ['aerial', 'contour', 'zoning'], false);
        break;
      case ScreenshotType.CONTOUR:
        // Show Contour layer and hide others
        toggleMapLayers(mapInstance, ['contour'], true);
        toggleMapLayers(mapInstance, ['aerial', 'heritage', 'zoning'], false);
        break;
      case ScreenshotType.AERIAL:
        // Show Aerial layer and hide others
        toggleMapLayers(mapInstance, ['aerial'], true);
        toggleMapLayers(mapInstance, ['contour', 'heritage', 'zoning'], false);
        break;
      case ScreenshotType.SNAPSHOT:
        // Show base and property boundary
        toggleMapLayers(mapInstance, ['base'], true);
        toggleMapLayers(mapInstance, ['zoning', 'fsr', 'hob', 'heritage'], false);
        break;
      // Add more screenshot types as needed
      default:
        // Default to showing base layer only
        toggleMapLayers(mapInstance, ['base'], true);
        toggleMapLayers(mapInstance, ['zoning', 'fsr', 'hob', 'heritage'], false);
    }

    // Always show/hide boundary based on showBoundary flag
    if (showBoundary) {
      showPropertyBoundary(mapInstance);
    } else {
      hidePropertyBoundary(mapInstance);
    }

    // Apply custom zoom and centering if needed
    if (additionalOptions.zoom) {
      mapInstance.setZoom(additionalOptions.zoom);
    }
    if (additionalOptions.center) {
      mapInstance.setCenter(additionalOptions.center);
    }

    // Wait for map to stabilize
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture the map
    const mapElement = document.getElementById('map-container');
    if (!mapElement) {
      throw new Error('Map container element not found');
    }

    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width: mapElement.offsetWidth,
      height: mapElement.offsetHeight
    });

    return canvas.toDataURL('image/png');
  } finally {
    // Restore original map state
    restoreMapState(mapInstance, currentLayers, currentCenter, currentZoom);
  }
};

/**
 * Toggle specific map layers on or off
 */
const toggleMapLayers = (mapInstance: any, layerIds: string[], visible: boolean) => {
  if (!mapInstance) return;
  
  // Implementation depends on the map library being used (Leaflet, Mapbox, etc.)
  // This is a placeholder for the actual implementation
  layerIds.forEach(layerId => {
    const layer = mapInstance.getLayer?.(layerId);
    if (layer) {
      if (visible) {
        layer.addTo?.(mapInstance);
      } else {
        mapInstance.removeLayer?.(layer);
      }
    }
  });
};

/**
 * Show the property boundary on the map
 */
const showPropertyBoundary = (mapInstance: any) => {
  if (!mapInstance) return;
  
  // Get the selected property from the store
  const selectedProperty = useMapStore.getState().selectedProperty;
  if (!selectedProperty) return;
  
  // Logic to show property boundary
  // Implementation depends on the map library
};

/**
 * Hide the property boundary on the map
 */
const hidePropertyBoundary = (mapInstance: any) => {
  if (!mapInstance) return;
  
  // Logic to hide property boundary
  // Implementation depends on the map library
};

/**
 * Restore the map to its original state
 */
const restoreMapState = (
  mapInstance: any,
  layers: any[],
  center: any,
  zoom: number
) => {
  if (!mapInstance) return;
  
  // Restore layers
  // Implementation depends on the map library
  
  // Restore center and zoom
  mapInstance.setView?.(center, zoom);
};

/**
 * Specialized capture function for zoning maps
 */
export const captureZoningMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.ZONING, showBoundary);
};

/**
 * Specialized capture function for FSR maps
 */
export const captureFSRMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.FSR, showBoundary);
};

/**
 * Specialized capture function for Height of Building maps
 */
export const captureHOBMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.HOB, showBoundary);
};

/**
 * Specialized capture function for Heritage maps
 */
export const captureHeritageMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.HERITAGE, showBoundary);
};

/**
 * Specialized capture function for Contour maps
 */
export const captureContourMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.CONTOUR, showBoundary);
};

/**
 * Specialized capture function for Aerial maps
 */
export const captureAerialMap = async (mapInstance: any, showBoundary: boolean = true) => {
  return captureMapScreenshot(mapInstance, ScreenshotType.AERIAL, showBoundary);
}; 