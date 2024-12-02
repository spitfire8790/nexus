import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/map-store";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Home, Building, Ruler, Layers, Map, Building2, Scan, Loader2 } from "lucide-react";
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import * as turf from '@turf/turf';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { usePropertyDataStore } from '@/lib/property-data-store';

const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

function LoadingState() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

interface Coordinates {
  x: number;
  y: number;
}

interface LoadingStates {
  address: boolean;
  spatial: boolean;
  sales: boolean;
  zoning: boolean;
  hob: boolean;
  lotSize: boolean;
  width?: boolean;
  heritage: boolean;
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
}

interface Lot {
  attributes: {
    LotDescription: string;
  };
}

export function OverviewTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const { propertyData, setPropertyData, setLoading, setError } = usePropertyDataStore();

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
          const rotated = turf.transformRotate(polygon, angle);
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
        };

        const propId = selectedProperty.propId;

        const fetchAddress = async () => {
          try {
            const response = await fetchWithTimeout(
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

            const [hobResponse, lotSizeResponse, heritageResponse] = await Promise.all([
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
                `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/0/query?` +
                `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
                `&geometryType=esriGeometryPoint` +
                `&spatialRel=esriSpatialRelIntersects` +
                `&outFields=LAY_CLASS,H_NAME,SIG` +
                `&returnGeometry=false` +
                `&f=json`
              )
            ]);

            const [hobData, lotSizeData, heritageData] = await Promise.all([
              hobResponse.json(),
              lotSizeResponse.json(),
              heritageResponse.json()
            ]);

            const hob = hobData.features?.[0]?.attributes?.MAX_B_H;
            const lotSize = lotSizeData.features?.[0]?.attributes?.LOT_SIZE;
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
            <div>
              {data.propertyAddress === null ? <LoadingState /> : data.propertyAddress}
            </div>
          </div>

          {/* Lots */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="font-semibold">Lots</span>
              <TooltipWrapper tooltipKey="lotsInfo" showIcon />
            </div>
            <div>
              {selectedProperty?.lots && selectedProperty.lots.length > 0 ? (
                <div className="text-right">
                  {selectedProperty.lots.map((lot: Lot) => (
                    <div key={lot.attributes.LotDescription}>
                      {lot.attributes.LotDescription}
                    </div>
                  ))}
                </div>
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
