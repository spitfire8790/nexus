export const convertToGeoJSON = (geometry: any) => {
    if (!geometry?.rings?.[0]) return null;
    
    // Convert Web Mercator coordinates to [longitude, latitude]
    const coordinates = geometry.rings[0].map((coord: number[]) => [
      coord[0] * 180 / 20037508.34,
      Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
    ]);
  
    // Ensure the polygon is closed
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
      coordinates.push([...coordinates[0]]);
    }
  
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {}
    };
  };