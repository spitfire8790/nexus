import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/map-store";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Home, Building, Ruler, Layers, Map, Building2, Scan, Loader2 } from "lucide-react";
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import * as turf from '@turf/turf';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { usePropertyDataStore } from '@/lib/property-data-store';
import * as L from 'leaflet';
import pointToLineDistance from '@turf/point-to-line-distance';
import length from '@turf/length';
// @ts-ignore
import { getCoords } from '@turf/invariant';
import transformRotate from '@turf/transform-rotate';
import bearing from '@turf/bearing';
import destination from '@turf/destination';
import along from '@turf/along';
import midpoint from '@turf/midpoint';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, maxRetries = 3, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const waitTime = initialDelay * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(initialDelay * Math.pow(2, i));
    }
  }
  throw new Error('Max retries reached');
};

function LoadingState() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

interface HeritageItem {
  significance: string;
  name: string;
  class: string;
}

interface PropertyData {
  zoneInfo: string | null;
  lgaName: string | null;
  propertyAddress: string | null;
  area: number | null;
  maxHeight: string | null;
  minLotSize: string | null;
  floorSpaceRatio: string | null;
  width?: number | null;
  heritage: HeritageItem[] | null;
  streetFrontage: { 
    count: number; 
    total: number;
    roads: Array<{
      name: string;
      length: number;
    }>;
  } | null;
}

interface Lot {
  attributes: {
    LotDescription: string;
  };
}

interface BufferGeometry {
  spatialReference: { wkid: number };
  rings: number[][][];
}

const calculateStreetFrontage = async (geometry: BufferGeometry): Promise<{ count: number; total: number; roads: Array<{ name: string; length: number }> }> => {
  try {
    const coordinates = geometry.rings[0];
    const frontageMap: { [key: string]: number } = {};
    
    // Small buffer distance for edge-specific queries
    const BUFFER_DISTANCE = 5; // meters

    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];

      // Create a small buffer around just this edge
      const edgeBuffer = {
        spatialReference: { wkid: 102100 },
        xmin: Math.min(start[0], end[0]) - BUFFER_DISTANCE,
        ymin: Math.min(start[1], end[1]) - BUFFER_DISTANCE,
        xmax: Math.max(start[0], end[0]) + BUFFER_DISTANCE,
        ymax: Math.max(start[1], end[1]) + BUFFER_DISTANCE
      };

      // Query roads only within this edge's buffer
      const roadsResponse = await fetch(
        `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/26/query?` +
        `geometry=${encodeURIComponent(JSON.stringify(edgeBuffer))}` +
        `&geometryType=esriGeometryEnvelope` +
        `&spatialRel=esriSpatialRelIntersects` +
        `&outFields=ROADNAMELABEL` +
        `&returnGeometry=true` +
        `&f=json`
      );

      const roadsData = await roadsResponse.json();
      
      if (!roadsData?.features?.length) continue;

      // Convert edge to GeoJSON format for length calculation
      const edgeLine = turf.lineString([
        [start[0] * 180 / 20037508.34, Math.atan(Math.exp(start[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90],
        [end[0] * 180 / 20037508.34, Math.atan(Math.exp(end[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90]
      ]);

      const edgeLength = length(edgeLine, { units: 'meters' });
      if (edgeLength < 2) continue;

      // Check if this edge is adjacent to any of the roads in its buffer
      for (const feature of roadsData.features) {
        const roadName = feature.attributes.ROADNAMELABEL?.trim() || 'Unnamed Road';
        
        const roadPolygon = {
          type: 'Polygon',
          coordinates: [feature.geometry.rings[0].map((coord: number[]) => [
            coord[0] * 180 / 20037508.34,
            Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
          ])]
        };

        // Check if edge midpoint is close to road
        const midpoint = along(edgeLine, edgeLength / 2, { units: 'meters' });
        const roadLine = turf.lineString(roadPolygon.coordinates[0]);
        const distance = pointToLineDistance(midpoint, roadLine, { units: 'meters' });

        if (distance <= BUFFER_DISTANCE) {
          frontageMap[roadName] = (frontageMap[roadName] || 0) + edgeLength;
          break;
        }
      }
    }

    const roads = Object.entries(frontageMap).map(([name, length]) => ({
      name,
      length: Math.round(length)
    }));

    const totalLength = Math.round(Object.values(frontageMap).reduce((sum, length) => sum + length, 0));

    return {
      count: roads.length,
      total: totalLength,
      roads: roads.sort((a, b) => b.length - a.length)
    };
  } catch (error) {
    console.error('Error in calculateStreetFrontage:', error);
    return { count: 0, total: 0, roads: [] };
  }
};

export function OverviewTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const { propertyData, setPropertyData, setLoading, setError } = usePropertyDataStore();

  const [highlightedFrontage, setHighlightedFrontage] = useState<L.Layer | null>(null);
  const map = useMapStore((state) => state.map);

  const handleFrontageClick = () => {
    if (!map) return;

    if (highlightedFrontage) {
      map.removeLayer(highlightedFrontage);
      setHighlightedFrontage(null);
      return;
    }

    if (!data.streetFrontage?.roads.length || !selectedProperty?.geometry) return;

    // Create a polyline for each edge that was detected as frontage
    const frontageGroup = L.layerGroup();
    
    // Get the coordinates from the property geometry
    const coordinates = selectedProperty.geometry.rings[0];
    
    // For each edge in the property boundary
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      // Convert to LatLng
      const startLatLng = L.CRS.EPSG3857.unproject(L.point(start[0], start[1]));
      const endLatLng = L.CRS.EPSG3857.unproject(L.point(end[0], end[1]));
      
      // Create a polyline for this edge
      const edge = L.polyline([startLatLng, endLatLng], {
        color: '#3b82f6', // blue-500
        weight: 6,
        opacity: 0.8
      });
      
      frontageGroup.addLayer(edge);
    }

    frontageGroup.addTo(map);
    setHighlightedFrontage(frontageGroup);
  };

  useEffect(() => {
    if (!selectedProperty) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const coordinates = selectedProperty.geometry.rings[0];

        // Convert coordinates to turf points
        const points = coordinates.map(coord => [
          coord[0] * 180 / 20037508.34,
          Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
        ]);

        // Create a turf polygon
        const polygon = turf.polygon([points]);

        // Calculate minimum width using rotating calipers method
        let minWidth = Infinity;

        // Check width at different angles
        for (let angle = 0; angle < 180; angle += 5) {
          const rotated = transformRotate(polygon, angle);
          const bbox = turf.bbox(rotated);
          const width = turf.distance(
            turf.point([bbox[0], bbox[1]]),
            turf.point([bbox[0], bbox[3]]),
            { units: 'meters' }
          );
          minWidth = Math.min(minWidth, width);
        }

        const data: PropertyData = {
          zoneInfo: null,
          lgaName: null,
          propertyAddress: null,
          area: null,
          maxHeight: null,
          minLotSize: null,
          floorSpaceRatio: null,
          width: minWidth,
          heritage: null,
          streetFrontage: null
        };

        const propId = selectedProperty.propId;

        const fetchAddress = async () => {
          try {
            const response = await fetchWithRetry(
              `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`
            );
            const address = await response.text();
            data.propertyAddress = address.replace(/^"|"$/g, '');
          } catch (error) {
            console.error('Address fetch error:', error);
            data.propertyAddress = 'Error loading address';
          }
        };

        const fetchSpatial = async () => {
          try {
            console.log('Calculating area from selected property geometry...');
            if (!selectedProperty?.geometry?.rings?.[0]) {
              throw new Error('No property geometry available');
            }

            // Convert Web Mercator coordinates to [longitude, latitude]
            const coordinates = selectedProperty.geometry.rings[0].map((coord: number[]) => [
              coord[0] * 180 / 20037508.34,
              Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
            ]);

            console.log('Converted coordinates:', coordinates);

            // Create a valid GeoJSON polygon (ensure it's closed)
            const firstCoord = coordinates[0];
            const lastCoord = coordinates[coordinates.length - 1];

            // Close the ring if it's not already closed
            if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
              coordinates.push([...firstCoord]);
            }

            // Create the polygon and calculate area
            const polygon = turf.polygon([coordinates]);
            const area = Math.round(turf.area(polygon));
            console.log('Calculated area:', area);

            data.area = area;
            data.streetFrontage = await calculateStreetFrontage(selectedProperty.geometry);
          } catch (error) {
            console.error('Spatial calculation error:', error);
            data.area = null;
          }
        };

        const fetchZoning = async () => {
          const setZoneInfo = useMapStore.getState().setZoneInfo;

          try {
            const response = await fetch(
              `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${propId}&layers=epi`
            );
            const zoningData = await response.json();

            const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

            if (zoningLayer?.results?.[0]) {
              const zoneInfo = {
                zoneName: zoningLayer.results[0].title,
                lgaName: zoningLayer.results[0]["LGA Name"]
              };
              setZoneInfo(zoneInfo);

              data.zoneInfo = zoneInfo.zoneName;
              data.lgaName = zoneInfo.lgaName;
            } else {
              setZoneInfo(null);
            }
          } catch (error) {
            console.error('Zoning fetch error:', error);
            setZoneInfo(null);
          }
        };

        const fetchZoningDetails = async () => {
          if (!selectedProperty?.geometry) return;

          try {
            const rings = selectedProperty.geometry.rings[0];
            const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
            const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

            const pointGeometry = {
              spatialReference: { wkid: 102100 },
              x: centerX,
              y: centerY
            };

            const [hobResponse, lotSizeResponse, fsrResponse, heritageResponse] = await Promise.all([
              fetch(
                `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer/7/query?` +
                `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
                `&geometryType=esriGeometryPoint` +
                `&spatialRel=esriSpatialRelIntersects` +
                `&outFields=MAX_B_H` +
                `&returnGeometry=false` +
                `&f=json`
              ),
              fetch(
                `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer/14/query?` +
                `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
                `&geometryType=esriGeometryPoint` +
                `&spatialRel=esriSpatialRelIntersects` +
                `&outFields=LOT_SIZE` +
                `&returnGeometry=false` +
                `&f=json`
              ),
              fetch(
                `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/1/query?` +
                `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
                `&geometryType=esriGeometryPoint` +
                `&spatialRel=esriSpatialRelIntersects` +
                `&outFields=FSR` +
                `&returnGeometry=false` +
                `&f=json`
              ),
              fetch(
                `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/0/query?` +
                `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
                `&geometryType=esriGeometryPoint` +
                `&spatialRel=esriSpatialRelIntersects` +
                `&outFields=LAY_CLASS,H_NAME,SIG` +
                `&returnGeometry=false` +
                `&f=json`
              )
            ]);

            const [hobData, lotSizeData, fsrData, heritageData] = await Promise.all([
              hobResponse.json(),
              lotSizeResponse.json(),
              fsrResponse.json(),
              heritageResponse.json()
            ]);

            const hob = hobData.features?.[0]?.attributes?.MAX_B_H;
            const lotSize = lotSizeData.features?.[0]?.attributes?.LOT_SIZE;
            const fsr = fsrData.features?.find(f => f.attributes?.FSR !== null)?.attributes?.FSR;
            console.log('Raw FSR value:', fsr);

            if (fsr !== undefined && fsr !== null) {
              const formattedFsr = fsr < 0.1 ? fsr.toFixed(2) : // For very small values
                                   fsr % 1 === 0 ? fsr.toFixed(0) : // For whole numbers
                                   fsr.toFixed(1); // For all other cases
              data.floorSpaceRatio = `${formattedFsr}:1`;
            } else {
              data.floorSpaceRatio = 'Not specified';
            }

            const heritageFeatures = heritageData.features;
            const heritageItems = heritageFeatures?.length
              ? heritageFeatures.map(feature => ({
                  significance: feature.attributes.SIG || 'Not specified',
                  name: feature.attributes.H_NAME || 'Not specified',
                  class: feature.attributes.LAY_CLASS || 'Not specified'
                }))
              : [];

            data.maxHeight = hob ? `${hob}m` : 'Not specified';
            data.minLotSize = lotSize ? `${lotSize}m²` : 'Not specified';
            data.heritage = heritageItems;
          } catch (error) {
            console.error('Error fetching zoning details:', error);
            data.maxHeight = 'Error loading';
            data.minLotSize = 'Error loading';
            data.heritage = null;
            data.floorSpaceRatio = 'Error loading';
          }
        };

        await Promise.all([fetchAddress(), fetchSpatial(), fetchZoning(), fetchZoningDetails()]);
        setPropertyData('overview', data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty, setPropertyData, setLoading, setError]);

  useEffect(() => {
    return () => {
      if (highlightedFrontage && map) {
        map.removeLayer(highlightedFrontage);
      }
    };
  }, [highlightedFrontage, map]);

  if (propertyData.loading) {
    return <LoadingState />;
  }

  if (propertyData.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{propertyData.error}</AlertDescription>
      </Alert>
    );
  }

  if (!propertyData.overview) {
    return null;
  }

  const data = propertyData.overview;

  return (
    <div className="p-4 space-y-6">
      {/* Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="font-semibold">Address</span>
              <TooltipWrapper tooltipKey="propertyAddress" showIcon />
            </div>
            <div className="text-right">
              {data.propertyAddress === null ? <LoadingState /> : data.propertyAddress}
            </div>
          </div>

          {/* Lots */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-shrink-0 w-[200px]">
              <Layers className="h-4 w-4" />
              <span className="font-semibold">Lots</span>
              <TooltipWrapper tooltipKey="lotsInfo" showIcon />
            </div>
            <div className="w-[300px] text-right">
              {selectedProperty?.lots && selectedProperty.lots.length > 0 ? (
                <span>
                  {selectedProperty.lots
                    .map((lot: Lot) => lot.attributes.LotDescription)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-muted-foreground">No lot information</span>
              )}
            </div>
          </div>

          {/* Local Government Area */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="font-semibold">Local Government Area</span>
              <TooltipWrapper tooltipKey="lgaInfo" showIcon />
            </div>
            <div>
              {data.lgaName === null ? <LoadingState /> : data.lgaName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimensions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Area */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              <span className="font-semibold">Property Area</span>
              <TooltipWrapper tooltipKey="propertyArea" showIcon />
            </div>
            <div>
              {data.area === null ? (
                <LoadingState />
              ) : (
                `${data.area.toLocaleString('en-AU', { maximumFractionDigits: 0 })} m²`
              )}
            </div>
          </div>

          {/* Property Width */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span className="font-semibold">Minimum Width</span>
              <TooltipWrapper tooltipKey="propertyWidth" showIcon />
            </div>
            <div>
              {data.width === null ? (
                <LoadingState />
              ) : (
                `${Math.round(data.width).toLocaleString('en-AU', { maximumFractionDigits: 0 })}m`
              )}
            </div>
          </div>

          {/* Street Frontage */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={handleFrontageClick}
            >
              <Ruler className="h-4 w-4" />
              <span className="font-semibold">Street Frontage</span>
              <TooltipWrapper tooltipKey="streetFrontage" showIcon />
            </div>
            <div>
              {data.streetFrontage === null ? (
                <LoadingState />
              ) : data.streetFrontage.roads.length === 0 ? (
                <div className="text-right text-muted-foreground">No street frontage detected</div>
              ) : (
                <div className="text-right">
                  {data.streetFrontage.roads.map((road, index) => (
                    <div key={road.name}>{road.name}: {road.length}m</div>
                  ))}
                  {data.streetFrontage.roads.length > 1 && (
                    <div className="mt-1 pt-1 border-t border-border">
                      Total: {data.streetFrontage.total}m
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Land Zone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="font-semibold">Land Zone</span>
              <TooltipWrapper tooltipKey="zoneInfo" showIcon />
            </div>
            <div>
              {data.zoneInfo === null ? <LoadingState /> : data.zoneInfo}
            </div>
          </div>

          {/* Floor Space Ratio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">Floor Space Ratio (FSR)</span>
              <TooltipWrapper tooltipKey="floorSpaceRatio" showIcon />
            </div>
            <div>
              {data.floorSpaceRatio === null ? <LoadingState /> : data.floorSpaceRatio}
            </div>
          </div>

          {/* Height of Building */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">Height of Building (HOB)</span>
              <TooltipWrapper tooltipKey="maxHeight" showIcon />
            </div>
            <div>
              {data.maxHeight === null ? <LoadingState /> : data.maxHeight}
            </div>
          </div>

          {/* Minimum Lot Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span className="font-semibold">Minimum Lot Size</span>
              <TooltipWrapper tooltipKey="minLotSize" showIcon />
            </div>
            <div>
              {data.minLotSize === null ? <LoadingState /> : data.minLotSize}
            </div>
          </div>

          {/* Heritage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">Heritage</span>
              <TooltipWrapper tooltipKey="heritage" showIcon />
            </div>
            <div className="text-right">
              {data.heritage === null ? (
                <LoadingState />
              ) : data.heritage.length > 0 ? (
                data.heritage.map((item, index) => (
                  <div key={index}>
                    {index > 0 && <div className="my-2 border-t border-gray-200" />}
                    <div>Class: {item.class}</div>
                    <div>Significance: {item.significance}</div>
                    <div>Name: {item.name}</div>
                  </div>
                ))
              ) : (
                'Not heritage listed'
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
