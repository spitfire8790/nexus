// Utility functions for property-related operations

export async function fetchPropertyDetails(propId: string) {
  try {
    const response = await fetch(
      `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch property details');
    }
    
    const data = await response.text();
    return data.replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
}

export async function fetchZoningData(propId: string, geometry: any) {
  try {
    const zoningResponse = await fetch(
      `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${propId}&layers=epi`
    );

    if (!zoningResponse.ok) {
      throw new Error('Failed to fetch zoning data');
    }

    const zoningData = await zoningResponse.json();
    const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

    if (!zoningLayer?.results?.[0]) {
      throw new Error('No zoning data found');
    }

    return {
      zoneName: zoningLayer.results[0].title,
      lgaName: zoningLayer.results[0]["LGA Name"]
    };
  } catch (error) {
    console.error('Error fetching zoning data:', error);
    throw error;
  }
}

export function getPropertyBounds(geometry: any) {
  try {
    const rings = geometry.rings[0].map((coord: number[]) => {
      const point = L.point(coord[0], coord[1]);
      const latLng = L.CRS.EPSG3857.unproject(point);
      return [latLng.lat, latLng.lng];
    });
    return L.latLngBounds(rings);
  } catch (error) {
    console.error('Error calculating property bounds:', error);
    return null;
  }
}
