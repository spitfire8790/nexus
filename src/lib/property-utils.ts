import { supabase } from './supabase';

export interface FieldDescription {
  name: string;
  description: string;
  source?: string;
}

export const fieldDescriptions: Record<string, FieldDescription> = {
  address: {
    name: "Address",
    description: "Official property address as registered with NSW Land Registry Services",
    source: "NSW Land Registry Services"
  },
  lga: {
    name: "Local Government Area",
    description: "The local council or administrative area that the property falls within",
    source: "NSW Department of Planning and Environment"
  },
  lot: {
    name: "Lot Description",
    description: "The legal lot and deposited plan (DP) or strata plan (SP) number that uniquely identifies the property",
    source: "NSW Land Registry Services"
  },
  area: {
    name: "Site Area",
    description: "Total land area of the property in square meters",
    source: "NSW Land Registry Services"
  },
  elevation: {
    name: "Elevation",
    description: "Height above sea level in meters, showing minimum, maximum, and average elevation across the property",
    source: "NSW Department of Customer Service (Spatial Services)"
  }
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchPopulationData(geometry: any) {
  try {
    const rings = geometry.rings[0];
    const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
    const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

    const longitude = (centerX * 180) / 20037508.34;
    const latitude = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);

    const response = await fetch(
      `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ASGS_2021_SA2/FeatureServer/0/query?` +
      `geometry=${longitude},${latitude}&` +
      `geometryType=esriGeometryPoint&` +
      `inSR=4326&` +
      `spatialRel=esriSpatialRelIntersects&` +
      `outFields=SA2_NAME_2021&` +
      `returnGeometry=false&` +
      `f=json`
    );

    const data = await response.json();
    const sa2Name = data.features?.[0]?.attributes?.SA2_NAME_2021;

    if (!sa2Name) {
      throw new Error('Could not find SA2 region');
    }

    const populationData = await loadPopulationData();
    const yearlyData = populationData[sa2Name];

    if (!yearlyData) {
      throw new Error('Could not find population projections for this area');
    }

    return {
      data: Object.entries(yearlyData)
        .map(([year, population]) => ({
          year: Number(year),
          population: Number(population)
        }))
        .sort((a, b) => a.year - b.year),
      sa2Name
    };
  } catch (error) {
    console.error('Error fetching population projections:', error);
    return {
      data: [],
      sa2Name: ''
    };
  }
}
