import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  School,
  GraduationCap,
  Building2,
  Hospital,
  Truck,
  Shield,
  Flame,
  LifeBuoy,
  Train,
  MapPin,
  Loader2,
  AlertTriangle,
  FileText,
  BarChart3,
  Layers,
  Map,
  Building,
  Home,
  Ruler,
  InfoIcon,
  DollarSign,
  Clock,
  Coffee,
  Users,
  Mountain
} from "lucide-react";
import { useMapStore, type MapState, type LayerGroup } from "@/lib/map-store";
import { useEffect, useState, useCallback, useRef } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ReactSpeedometer, { CustomSegmentLabelPosition, Transition } from "react-d3-speedometer";
import * as d3 from 'd3-ease';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { rpc } from "@/lib/rpc";
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import * as turf from '@turf/turf';
import { cn } from "@/lib/utils";
import React from "react";
import { buffer } from '@turf/buffer';
import { supabase } from '@/lib/supabase';
import { LineChart, Line } from 'recharts';


interface ZoningResult {
  title: string;
  "LGA Name": string;
  [key: string]: any;
}

interface LayerIntersectResult {
  id: string;
  layerName: string;
  results: ZoningResult[];
}

interface Lot {
  attributes: {
    LotDescription: string;
  };
}

type RiskCategory = 'None' | 'Vegetation Buffer' | 'Vegetation Category 3' | 'Vegetation Category 2' | 'Vegetation Category 1';

interface PermittedUses {
  withConsent: string | null;
  withoutConsent: string | null;
  loading: boolean;
  error: string | null;
}

interface ZoneInfo {
  zoneName: string | null;
  lgaName: string | null;
  maxHeight: number | null;
  minLotSize: number | null;
}

interface Sale {
  geometry: {
    x: number;
    y: number;
  };
  bp_address: string;
  sale_date: string;
  price: number;
  date: Date;
  distance?: number;
}

function LoadingPulse() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-muted rounded w-24"></div>
    </div>
  );
}

async function fetchWithTimeout(url: string, timeout = 10000) {
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

// The rest of your code remains the same, with the width calculation now happening
// in the useEffect hook we added in the SiteOverviewTab component

function SiteOverviewTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loadingStates, setLoadingStates] = useState({
    address: false,
    spatial: false,
    sales: false,
    zoning: false,
    hob: false,
    lotSize: false
  });
  const [data, setData] = useState<{
    zoneInfo: string | null;
    lgaName: string | null;
    propertyAddress: string | null;
    area: number | null;
    maxHeight: string | null;
    minLotSize: string | null;
    floorSpaceRatio: string | null;  // Add this line
    elevation: {
      min: number | null;
      max: number | null;
      avg: number | null;
    };
  }>({
    zoneInfo: null,
    lgaName: null,
    propertyAddress: null,
    area: null,
    maxHeight: null,
    minLotSize: null,
    floorSpaceRatio: null,  // Add this line
    elevation: {
      min: null,
      max: null,
      avg: null
    }
  });

  // Separate effect for width calculation
  useEffect(() => {
    if (!selectedProperty?.geometry) return;
    
    setLoadingStates(prev => ({ ...prev, width: true }));
    
    try {
      const coordinates = selectedProperty.geometry.rings[0];
      let maxWidth = 0;
      
      // Convert to turf points for accurate calculations
      const points = coordinates.map(coord => point([
        (coord[0] * 180) / 20037508.34, // Convert Web Mercator X to longitude
        (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90) // Convert Web Mercator Y to latitude
      ]));
      
      // Calculate distance between each pair of points
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dist = distance(points[i], points[j], { units: 'meters' });
          maxWidth = Math.max(maxWidth, dist);
        }
      }

      console.log('Calculated width:', maxWidth);
      setData(prev => ({
        ...prev,
        width: maxWidth
      }));
    } catch (error) {
      console.error('Error calculating width:', error);
      setData(prev => ({ ...prev, width: null }));
    } finally {
      setLoadingStates(prev => ({ ...prev, width: false }));
    }
  }, [selectedProperty?.geometry]);

  useEffect(() => {
    async function fetchPropertyData() {
      if (!selectedProperty?.propId) return;
      
      // Reset all loading states
      setLoadingStates({
        address: true,
        spatial: true,
        sales: true,
        zoning: true,
        width: false,
        hob: false,
        lotSize: false
      });

      const propId = selectedProperty.propId;

      // Fetch data independently to avoid one slow request blocking others
      const fetchAddress = async () => {
        try {
          const response = await fetchWithTimeout(
            `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`
          );
          const address = await response.text();
          setData(prev => ({ ...prev, propertyAddress: address.replace(/^"|"$/g, '') }));
        } catch (error) {
          console.error('Address fetch error:', error);
          setData(prev => ({ ...prev, propertyAddress: 'Error loading address' }));
        } finally {
          setLoadingStates(prev => ({ ...prev, address: false }));
        }
      };

      const fetchSpatial = async () => {
        try {
          console.log('Fetching spatial data...');
          const response = await fetchWithTimeout(
            `https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/MapServer/12/query?where=propid=${propId}&outFields=shape_Area&returnGeometry=true&f=json`
          );
          const data = await response.json();
          console.log('Spatial data received:', data);
          
          const feature = data.features?.[0];
          if (feature?.geometry) {
            // Convert Web Mercator coordinates to WGS84
            const coordinates = feature.geometry.rings[0].map((coord: number[]) => [
              (coord[0] * 180) / 20037508.34, // Convert X to longitude
              (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90) // Convert Y to latitude
            ]);

            // Create a turf polygon and calculate its area
            const polygon = turf.polygon([coordinates]);
            const area = turf.area(polygon);

            setData(prev => ({
              ...prev,
              area: area
            }));
          }
        } catch (error) {
          console.error('Spatial fetch error:', error);
          setData(prev => ({ ...prev, area: null }));
        } finally {
          setLoadingStates(prev => ({ ...prev, spatial: false }));
        }
      };

      const fetchZoning = async () => {
        const setZoneInfo = useMapStore.getState().setZoneInfo;
        
        try {
          const url = `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${propId}&layers=epi`;
          console.log('🔍 Fetching zoning data:', { propId, url });
          
          const response = await fetch(url);
          console.log('📥 Zoning response status:', response.status);
          
          const data = await response.json();
          console.log('📦 Raw zoning data:', data);

          const zoningLayer = data.find((l: any) => l.layerName === "Land Zoning Map");
          console.log('🏷️ Found zoning layer:', zoningLayer);

          if (zoningLayer?.results?.[0]) {
            const zoneInfo = {
              zoneName: zoningLayer.results[0].title,
              lgaName: zoningLayer.results[0]["LGA Name"]
            };
            console.log('✨ Setting zone info:', zoneInfo);
            setZoneInfo(zoneInfo);
            
            // Also update local state for the overview tab
            setData(prev => ({
              ...prev,
              zoneInfo: zoneInfo.zoneName,
              lgaName: zoneInfo.lgaName
            }));
          } else {
            setZoneInfo(null);
          }
        } catch (error) {
          console.error('❌ Zoning fetch error:', error);
          setZoneInfo(null);
        } finally {
          setLoadingStates(prev => ({ ...prev, zoning: false }));
        }
      };

      const fetchElevationInfo = async () => {
        if (!selectedProperty?.geometry) {
          console.log('⚠️ No property geometry available for elevation fetch');
          return;
        }
        
        console.log('🏔️ Starting elevation info fetch for property:', selectedProperty);
        try {
          const elevationData = await fetchElevationData(selectedProperty.geometry);
          console.log('📈 Setting elevation data:', elevationData);
          setData(prev => ({
            ...prev,
            elevation: elevationData
          }));
        } catch (error) {
          console.error('❌ Elevation fetch error:', error);
          setData(prev => ({
            ...prev,
            elevation: { min: null, max: null, avg: null }
          }));
        }
      };

      const fetchZoningDetails = async () => {
        if (!selectedProperty?.geometry) return;
        
        try {
          setLoadingStates(prev => ({ ...prev, hob: true, lotSize: true }));
          
          // Get centroid of the property
          const rings = selectedProperty.geometry.rings[0];
          const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
          const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

          // Create point geometry in proper format
          const pointGeometry = {
            spatialReference: { wkid: 102100 },
            x: centerX,
            y: centerY
          };

          // Fetch HOB
          const hobResponse = await fetch(
            `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer/7/query?` +
            `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
            `&geometryType=esriGeometryPoint` +
            `&spatialRel=esriSpatialRelIntersects` +
            `&outFields=MAX_B_H` +
            `&returnGeometry=false` +
            `&f=json`
          );

          // Fetch Minimum Lot Size
          const lotSizeResponse = await fetch(
            `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Principal_Planning_Layers/MapServer/14/query?` +
            `geometry=${encodeURIComponent(JSON.stringify(pointGeometry))}` +
            `&geometryType=esriGeometryPoint` +
            `&spatialRel=esriSpatialRelIntersects` +
            `&outFields=LOT_SIZE` +
            `&returnGeometry=false` +
            `&f=json`
          );

          const [hobData, lotSizeData] = await Promise.all([
            hobResponse.json(),
            lotSizeResponse.json()
          ]);

          const hob = hobData.features?.[0]?.attributes?.MAX_B_H;
          const lotSize = lotSizeData.features?.[0]?.attributes?.LOT_SIZE;

          setData(prev => ({
            ...prev,
            maxHeight: hob ? `${hob}m` : 'Not specified',
            minLotSize: lotSize ? `${lotSize}m²` : 'Not specified'
          }));

        } catch (error) {
          console.error('Error fetching zoning details:', error);
          setData(prev => ({
            ...prev,
            maxHeight: 'Error loading',
            minLotSize: 'Error loading'
          }));
        } finally {
          setLoadingStates(prev => ({ ...prev, hob: false, lotSize: false }));
        }
      };

      // Start all fetches concurrently
      fetchAddress();
      fetchSpatial();
      fetchZoning();
      fetchElevationInfo();
      fetchZoningDetails();
    }

    fetchPropertyData();
  }, [selectedProperty?.propId]);

  if (!selectedProperty) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a property to view site overview
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-x-4">
        {/* Address */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2">
          <Home className="h-4 w-4" />
          Address
        </div>
        <div className="border-b pb-2">
          {data.propertyAddress === null ? <LoadingPulse /> : data.propertyAddress}
        </div>

        {/* LGA - Moved up */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Building className="h-4 w-4" />
          LGA
        </div>
        <div className="border-b pb-2 pt-4">
          {data.lgaName === null ? <LoadingPulse /> : data.lgaName}
        </div>

        {/* Area */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Ruler className="h-4 w-4" />
          Area
        </div>
        <div className="border-b pb-2 pt-4">
          {data.area === null ? (
            <LoadingPulse />
          ) : (
            `${data.area.toLocaleString('en-AU', { maximumFractionDigits: 0 })} m²`
          )}
        </div>

        {/* Lots */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Layers className="h-4 w-4" />
          Lots
        </div>
        <div className="border-b pb-2 pt-4">
          {selectedProperty.lots && selectedProperty.lots.length > 0 ? (
            <div className="space-y-1">
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

        {/* Land Zone */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Map className="h-4 w-4" />
          Land Zone
        </div>
        <div className="border-b pb-2 pt-4">
          {data.zoneInfo === null ? <LoadingPulse /> : data.zoneInfo}
        </div>

        {/* Height of Building */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Building2 className="h-4 w-4" />
          Height of Building (HOB)
        </div>
        <div className="border-b pb-2 pt-4">
          {data.maxHeight === null ? <LoadingPulse /> : data.maxHeight}
        </div>

        {/* Minimum Lot Size */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Ruler className="h-4 w-4" />
          Minimum Lot Size
        </div>
        <div className="border-b pb-2 pt-4">
          {data.minLotSize === null ? <LoadingPulse /> : data.minLotSize}
        </div>

        {/* Elevation */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Mountain className="h-4 w-4" />
          Elevation
        </div>
        <div className="border-b pb-2 pt-4">
          {data.elevation.min === null ? (
            <LoadingPulse />
          ) : (
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Min: </span>
                {data.elevation.min}m
              </div>
              <div className="text-sm">
                <span className="font-medium">Max: </span>
                {data.elevation.max}m
              </div>
              <div className="text-sm">
                <span className="font-medium">Avg: </span>
                {data.elevation.avg?.toFixed(1)}m
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BushfireRiskDial({ risk = 'None' }: { risk: RiskCategory }) {
  const riskLevels: RiskCategory[] = [
    'None', 
    'Vegetation Buffer',
    'Vegetation Category 3', 
    'Vegetation Category 2', 
    'Vegetation Category 1'
  ];
  const riskIndex = riskLevels.indexOf(risk);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Bushfire Risk</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[500px] max-h-[400px] p-4 overflow-auto text-sm">
                <p>Data Sourced from the NSW Bush Fire Prone Land dataset map prepared in accordance with the Guide for Bush Fire Prone Land Mapping (BFPL Mapping Guide) and certified by the Commissioner of NSW RFS under section 146(2) of the Environmental Planning and Assessment Act 1979. Over time there has been various releases of the BFPL Mapping Guide, in which the categories and types of vegetation included in the BFPL map have changed. The version of the guide under which, each polygon or LGA was certified is contained in the data.</p>
                
                <p className="mt-2">An area of land that can support a bush fire or is likely to be subject to bush fire attack, as designated on a bush fire prone land map.</p>
                
                <p className="mt-2">The definition of bushfire vegetation categories under guideline version 5b:</p>
                
                <p className="mt-2">Vegetation Category 1 consists of: &gt; Areas of forest, woodlands, heaths (tall and short), forested wetlands and timber plantations.</p>
                
                <p className="mt-2">Vegetation Category 2 consists of: &gt;Rainforests. &gt;Lower risk vegetation parcels. These vegetation parcels represent a lower bush fire risk to surrounding development and consist of: - Remnant vegetation; - Land with ongoing land management practices that actively reduces bush fire risk.</p>
                
                <p className="mt-2">Vegetation Category 3 consists of: &gt; Grasslands, freshwater wetlands, semi-arid woodlands, alpine complex and arid shrublands.</p>
                
                <p className="mt-2">Buffers are created based on the bushfire vegetation, with buffering distance being 100 metres for vegetation category 1 and 30 metres for vegetation category 2 and 3.</p>
                
                <p className="mt-2">Vegetation excluded from the bushfire vegetation categories include isolated areas of vegetation less than one hectare, managed lands and some agricultural lands. Please refer to BFPL Mapping Guide for a full list of exclusions.</p>
                
                <p className="mt-2">The legislative context of this dataset is as follows: On 1 August 2002, the Rural Fires and Environmental Assessment Legislation Amendment Act 2002 (Amendment Act) came into effect. The Act amended both the Environmental Planning and Assessment Act 1979 and the Rural Fire Services Act 1997 to ensure that people, property and the environment are more fully protected against the dangers that may arise from bushfires. Councils are required to map bushfire prone land within their local government area, which becomes the trigger for the consideration of bushfire protection measures when developing land. BFPL Mapping Guidelines are available from www.rfs.nsw.gov.au</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Highest bushfire prone risk category on selected property</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="w-full max-w-[300px] flex flex-col items-center -mb-4">
          <ReactSpeedometer
            maxValue={5}
            value={riskIndex + 0.5}
            currentValueText=""
            customSegmentLabels={[
              { text: "None", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Buffer", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 3", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 2", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 1", position: CustomSegmentLabelPosition.Outside, color: "#666" }
            ]}
            ringWidth={55}
            needleHeightRatio={0.7}
            needleTransition={Transition.easeElasticIn}
            needleTransitionDuration={2000}
            needleColor="#000000"
            textColor="#666666"
            valueFormat=""
            segmentColors={[
              "#e5e5e5",          // None
              "rgb(255,255,115)", // Buffer
              "rgb(255,128,0)",   // Cat 3
              "rgb(255,210,0)",   // Cat 2
              "rgb(255,0,0)"      // Cat 1
            ]}
            labelFontSize="12px"
            height={160}
            paddingVertical={0}
          />
          <div className="text-center text-xl font-semibold -mt-0">{risk}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BushfireRiskDial;

function BushfireRisk() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [risk, setRisk] = useState<RiskCategory>('None');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBushfireRisk() {
      if (!selectedProperty?.geometry) {
        setRisk('None');
        return;
      }
      
      setLoading(true);
      console.log('Fetching bushfire data for property:', selectedProperty);
      
      try {
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer/229/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=Category` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) throw new Error('Failed to fetch bushfire risk data');
        
        const data = await response.json();
        console.log('Bushfire risk data received:', data);
        
        if (data.features && data.features.length > 0) {
          const categories = data.features.map((f: any) => f.attributes.Category);
          console.log('Risk categories found:', categories);
          
          const categoryToRisk: Record<number, RiskCategory> = {
            0: 'Vegetation Buffer',    // Lowest risk
            3: 'Vegetation Category 3', // Second lowest risk
            2: 'Vegetation Category 2', // Second highest risk
            1: 'Vegetation Category 1'  // Highest risk
          };
          
          // If we have a buffer zone (0), that's the lowest risk
          // Otherwise, find the lowest number (highest risk) excluding 0
          const riskLevel = categories.includes(0) && categories.length === 1 ? 
            'Vegetation Buffer' : 
            categoryToRisk[Math.min(...categories.filter((c: number) => c !== 0))];
          
          console.log('Risk categories found:', categories, '-> Mapped to:', riskLevel);
          setRisk(riskLevel || 'None');
        } else {
          console.log('No bushfire risk features found for property');
          setRisk('None');
        }
      } catch (error) {
        console.error('Error fetching bushfire risk:', error);
        setError('Failed to fetch bushfire risk data');
      } finally {
        setLoading(false);
      }
    }

    fetchBushfireRisk();
  }, [selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view bushfire risk assessment</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <BushfireRiskDial risk={risk} />
      )}
    </div>
  );
}

function ContaminationRisk() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contaminationData, setContaminationData] = useState<Array<{
    SiteName: string;
  }> | null>(null);

  useEffect(() => {
    async function fetchContaminationData() {
      if (!selectedProperty?.geometry) {
        setContaminationData(null);
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch('/api/proxy/spatial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service: 'EPA/EPACS/MapServer/1',
            params: {
              geometry: JSON.stringify(selectedProperty.geometry),
              geometryType: 'esriGeometryPolygon',
              spatialRel: 'esriSpatialRelIntersects',
              outFields: 'SiteName',
              returnGeometry: 'false',
              f: 'json'
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Contamination data received:', data);
        
        if (data.features && data.features.length > 0) {
          setContaminationData(data.features.map((f: any) => ({
            SiteName: f.attributes.SiteName
          })));
        } else {
          setContaminationData(null);
        }
      } catch (error) {
        console.error('Error fetching contamination data:', error);
        setError('Failed to fetch contamination data');
      } finally {
        setLoading(false);
      }
    }

    fetchContaminationData();
  }, [selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view contamination assessment</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Contamination Risk</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[500px] max-h-[400px] p-4 overflow-auto text-sm">
                <p>The list of notified sites contain land that has been notified to the EPA as being potentially contaminated. The list states whether the land is regulated under the CLM Act.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>EPA contaminated land notifications for selected property</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contaminationData && contaminationData.length > 0 ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>EPA Contaminated Sites Found</AlertTitle>
            </Alert>
            {contaminationData.map((site, index) => (
              <div key={index} className="space-y-2">
                <div className="font-medium">Site {index + 1}</div>
                <div className="text-sm">Site Name: {site.SiteName}</div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTitle>No EPA Contaminated Sites Found</AlertTitle>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

function SaleCard({ sale, index }: { sale: Sale; index: number }) {
  const [streetAddress, locality] = sale.bp_address.split(',').map(s => s.trim());
  
  return (
    <div className="flex items-center py-1.5">
      <div className="w-6 h-6 flex-shrink-0 border border-red-500 rounded-full flex items-center justify-center text-xs font-medium text-red-500">
        {index + 1}
      </div>
      <div className="grid grid-cols-12 flex-1 gap-0 min-w-0 ml-2">
        <div className="col-span-6">
          <div className="text-xs truncate" title={streetAddress}>
            {streetAddress}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={locality}>
            {locality}
          </div>
        </div>
        <div className="col-span-3 text-xs">
          {new Date(sale.sale_date).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
        <div className="col-span-2 text-xs font-semibold text-blue-600">
          {formatPrice(sale.price)}
        </div>
        <div className="col-span-1 text-xs text-muted-foreground text-right">
          {Math.round(sale.distance)}m
        </div>
      </div>
    </div>
  );
}

function SalesTab() {
  const map = useMapStore((state) => state.mapInstance);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [isShowingOnMap, setIsShowingOnMap] = useState(false);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const salesLayerRef = useRef<L.LayerGroup | null>(null);
  const [salesData, setSalesData] = useState({
    loading: false,
    error: null,
    propertyData: {
      lastSaleDate: null,
      lastSalePrice: null
    },
    nearbySales: null
  });

  // Reset state when property changes
  useEffect(() => {
    if (salesLayerRef.current) {
      map?.removeLayer(salesLayerRef.current);
      salesLayerRef.current = null;
    }
    setIsShowingOnMap(false);
  }, [selectedProperty, map]);

  const handleToggleOnMap = async () => {
    if (!salesData.nearbySales?.length || !map) return;
    
    setIsLayerLoading(true);
    try {
      // Remove existing markers if they exist
      if (salesLayerRef.current) {
        map.removeLayer(salesLayerRef.current);
        salesLayerRef.current = null;
        setIsShowingOnMap(false);
        return;
      }

      // Create a layer group only after ensuring map is ready
      await new Promise(resolve => {
        if (map.getContainer()) {
          resolve(true);
        } else {
          map.once('load', () => resolve(true));
        }
      });

      salesLayerRef.current = L.layerGroup();
      const bounds = L.latLngBounds([]);

      // Add markers for each sale
      salesData.nearbySales.forEach((sale, index) => {
        const point = L.point(sale.coordinates[0], sale.coordinates[1]);
        const latLng = L.CRS.EPSG3857.unproject(point);
        bounds.extend(latLng);

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-red-500 text-red-500 text-xs font-medium">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        const marker = L.marker(latLng, { icon })
          .bindPopup(`
            <div class="text-sm">
              <div class="font-medium">${sale.bp_address}</div>
              <div>${new Date(sale.sale_date).toLocaleDateString()}</div>
              <div class="font-semibold text-blue-600">$${sale.price.toLocaleString()}</div>
              <div>${(sale.distance/1000).toFixed(1)}km away</div>
            </div>
          `);
        
        salesLayerRef.current?.addLayer(marker);
      });

      // Add selected property to bounds
      if (selectedProperty?.geometry) {
        const propertyBounds = getPropertyBounds(selectedProperty.geometry);
        if (propertyBounds) {
          bounds.extend(propertyBounds);
        }
      }

      // Add layer to map
      if (salesLayerRef.current) {
        salesLayerRef.current.addTo(map);
        map.fitBounds(bounds, { padding: [50, 50] });
        setIsShowingOnMap(true);
      }

    } catch (error) {
      console.error('Error showing sales on map:', error);
    } finally {
      setIsLayerLoading(false);
    }
  };

  // Helper function to get bounds from property geometry
  const getPropertyBounds = (geometry: any) => {
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
  };

  // Cleanup on unmount or tab change
  useEffect(() => {
    return () => {
      if (map && salesLayerRef.current) {
        map.removeLayer(salesLayerRef.current);
        salesLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSalesData() {
      if (!selectedProperty?.geometry || !selectedProperty?.propId) {
        console.log('⚠️ No property geometry or ID available');
        return;
      }

      console.log('🔄 Starting sales data fetch for property:', selectedProperty.propId);
      
      if (isMounted) {
        setSalesData(prev => ({
          ...prev,
          loading: true,
          error: null,
          propertyData: {
            lastSaleDate: null,
            lastSalePrice: null
          },
          nearbySales: null
        }));
      }

      try {
        // First fetch the selected property's sale data using propId
        console.log('🎯 Fetching selected property sale data for propId:', selectedProperty.propId);
        const propertyResponse = await fetch(
          `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?where=propid=${selectedProperty.propId}&outFields=sale_date,price&f=json`,
          { signal: controller.signal }
        );

        if (!propertyResponse.ok) {
          console.error('❌ Property sales API error:', propertyResponse.status, propertyResponse.statusText);
          throw new Error(`HTTP error! status: ${propertyResponse.status}`);
        }

        const propertyData = await propertyResponse.json();
        console.log('🏠 Raw property sale data:', propertyData);

        // Parse the property sale data
        const propertyFeature = propertyData.features?.[0]?.attributes;
        if (propertyFeature) {
          setSalesData(prev => ({
            ...prev,
            propertyData: {
              lastSaleDate: propertyFeature.sale_date,
              lastSalePrice: propertyFeature.price
            }
          }));
        }

        // Then fetch nearby sales using geometry
        const rings = selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const x = (coord[0] * 180) / 20037508.34;
          const y = (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);
          return [x, y];
        });

        const centerX = rings.reduce((sum, coord) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum, coord) => sum + coord[1], 0) / rings.length;
        
        console.log('📍 Calculated center point:', { centerX, centerY });
        
        const bufferDegrees = 0.01; // roughly 1km
        const bbox = `${centerX-bufferDegrees},${centerY-bufferDegrees},${centerX+bufferDegrees},${centerY+bufferDegrees}`;
        
        console.log('🔍 Fetching nearby sales with bbox:', bbox);

        const nearbyResponse = await fetch(
          `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?` +
          `where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&` +
          `spatialRel=esriSpatialRelIntersects&outFields=sale_date,price,bp_address&` +
          `returnGeometry=true&outSR=4326&f=json`,
          { signal: controller.signal }
        );

        if (!nearbyResponse.ok) {
          console.error('❌ Nearby sales API error:', nearbyResponse.status, nearbyResponse.statusText);
          throw new Error(`HTTP error! status: ${nearbyResponse.status}`);
        }

        const nearbyData = await nearbyResponse.json();
        console.log('📊 Raw nearby sales data:', nearbyData);

        // Calculate date 12 months ago
        const today = new Date();
        const twelveMonthsAgo = new Date(today.setMonth(today.getMonth() - 12));
        console.log('📅 Filtering sales after:', twelveMonthsAgo);

        // Process nearby sales
        const nearbySalesFiltered = nearbyData.features
          ?.filter((f: any) => {
            const sale = {
              ...f.attributes,
              date: new Date(f.attributes.sale_date)
            };
            return sale.date >= twelveMonthsAgo && f.attributes.propid !== selectedProperty.propId;
          })
          .map((f: any) => {
            return {
              sale_date: f.attributes.sale_date,
              price: f.attributes.price,
              bp_address: f.attributes.bp_address,
              distance: turf.distance(
                turf.point([centerX, centerY]),
                turf.point([f.geometry.x, f.geometry.y]),
                { units: 'meters' }
              ),
              coordinates: [f.geometry.x, f.geometry.y]
            };
          })
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, 10);

        console.log('🏘️ Filtered nearby sales:', nearbySalesFiltered);

        if (isMounted) {
          setSalesData(prev => ({
            ...prev,
            loading: false,
            propertyData: prev.propertyData, // Keep the property data from earlier update
            nearbySales: nearbySalesFiltered
          }));
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('🚫 Request aborted');
          return;
        }
        
        console.error('❌ Sales fetch error:', error);
        if (isMounted) {
          setSalesData(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            propertyData: {
              lastSaleDate: null,
              lastSalePrice: null
            },
            nearbySales: null
          }));
        }
      }
    }

    fetchSalesData();

    return () => {
      console.log('🧹 Cleaning up sales fetch');
      isMounted = false;
      controller.abort();
    };
  }, [selectedProperty?.propId, selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view sales history</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (salesData.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{salesData.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Property Sales History</CardTitle>
          <CardDescription>Last recorded sale for this property</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.loading ? (
            <LoadingPulse />
          ) : salesData.propertyData.lastSaleDate ? (
            <div className="space-y-2">
              <p>
                <strong>Last Sale Date:</strong>{' '}
                {new Date(salesData.propertyData.lastSaleDate).toLocaleDateString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p>
                <strong>Sale Price:</strong>{' '}
                {salesData.propertyData.lastSalePrice
                  ? formatPrice(salesData.propertyData.lastSalePrice)
                  : 'Not available'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No sales history found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nearby Sales</CardTitle>
          <CardDescription>Recent sales within 1km radius</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.loading ? (
            <LoadingPulse />
          ) : salesData.nearbySales && salesData.nearbySales.length > 0 ? (
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground mb-2">
                  <div className="col-span-6 pl-8">Address</div>
                  <div className="col-span-3 pl-[32px]">Date</div>
                  <div className="col-span-2 pl-[16px]">Price</div>
                  <div className="col-span-1 text-right">Dist.</div>
                </div>
                {salesData.nearbySales.map((sale, index) => (
                  <SaleCard key={index} sale={sale} index={index} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No nearby sales found</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleToggleOnMap}
            className="w-full"
            disabled={isLayerLoading || !salesData.nearbySales?.length}
            variant={isShowingOnMap ? "secondary" : "default"}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isShowingOnMap ? "Removing from map..." : "Adding to map..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                {isShowingOnMap ? "Hide on Map" : "Show on Map"}
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function PlanningTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  const [permittedUses, setPermittedUses] = useState<PermittedUses>({
    withConsent: null,
    withoutConsent: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    async function fetchZoningAndPermittedUses() {
      if (!selectedProperty?.propId) return;

      setPermittedUses({
        withConsent: null,
        withoutConsent: null,
        loading: true,
        error: null
      });

      try {
        // First fetch zoning information
        const zoningResponse = await fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const zoningData = await zoningResponse.json();
        const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

        if (!zoningLayer?.results?.[0]) {
          throw new Error('No zoning data found');
        }

        const zoneInfo = {
          zoneName: zoningLayer.results[0].title,
          lgaName: zoningLayer.results[0]["LGA Name"]
        };

        // Update global store
        setZoneInfo(zoneInfo);

        // Now fetch permitted uses with the zoning information
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/19/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=*` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const data = await response.json();
        
        if (!data.features?.[0]?.attributes) {
          throw new Error('No zoning data found');
        }

        const zoneData = data.features[0].attributes;
        const epiName = zoneData.EPI_NAME;
        const zoneCode = zoneData.SYM_CODE;

        const API_BASE_URL = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5173'
          : '';

        const permittedResponse = await fetch(`${API_BASE_URL}/api/proxy`, {
          headers: {
            'EPINAME': epiName,
            'ZONECODE': zoneCode,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!permittedResponse.ok) {
          throw new Error('Failed to fetch permitted uses');
        }

        const jsonData = await permittedResponse.json();
        const precinct = jsonData?.[0]?.Precinct?.[0];
        const zone = precinct?.Zone?.find(z => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        // Remove duplicates using Set and sort alphabetically
        const withConsentSet = new Set(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet = new Set(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        setPermittedUses({
          withConsent: Array.from(withConsentSet)
            .sort((a, b) => a.localeCompare(b))
            .join(", "),
          withoutConsent: Array.from(withoutConsentSet)
            .sort((a, b) => a.localeCompare(b))
            .join(", "),
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching zoning and permitted uses:', error);
        setPermittedUses(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }));
        setZoneInfo(null);
      }
    }

    fetchZoningAndPermittedUses();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo]);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Zoning</CardTitle>
          <CardDescription>Current planning controls for this property</CardDescription>
        </CardHeader>
        <CardContent>
          {zoneInfo ? (
            <div className="space-y-2">
              <p><strong>Zone:</strong> {zoneInfo.zoneName}</p>
              <p><strong>LGA:</strong> {zoneInfo.lgaName}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No zoning information available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permitted Uses</CardTitle>
          <CardDescription>Land uses permitted in this zone</CardDescription>
        </CardHeader>
        <CardContent>
          {permittedUses.loading ? (
            <LoadingPulse />
          ) : permittedUses.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{permittedUses.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permitted Without Consent</h4>
                {permittedUses.withoutConsent ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {permittedUses.withoutConsent.split(', ').map((use, index) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Permitted With Consent</h4>
                {permittedUses.withConsent ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {permittedUses.withConsent.split(', ').map((use, index) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Define amenity types and their configurations
const AMENITY_CONFIGS = {
  primarySchool: {
    type: 'Primary School',
    url: 'NSW_FOI_Education_Facilities/MapServer/0',
    icon: School,
    nameField: 'generalname'
  },
  highSchool: {
    type: 'High School',
    url: 'NSW_FOI_Education_Facilities/MapServer/2',
    icon: School,
    nameField: 'generalname'
  },
  technicalCollege: {
    type: 'Technical College',
    url: 'NSW_FOI_Education_Facilities/MapServer/4',
    icon: GraduationCap,
    nameField: 'generalname'
  },
  university: {
    type: 'University',
    url: 'NSW_FOI_Education_Facilities/MapServer/5',
    icon: Building2,
    nameField: 'generalname'
  },
  hospital: {
    type: 'Hospital',
    url: 'NSW_FOI_Health_Facilities/MapServer/1',
    icon: Hospital,
    nameField: 'generalname'
  },
  ambulanceStation: {
    type: 'Ambulance Station',
    url: 'NSW_FOI_Health_Facilities/MapServer/0',
    icon: Truck,
    nameField: 'generalname'
  },
  policeStation: {
    type: 'Police Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/1',
    icon: LifeBuoy,
    nameField: 'generalname'
  },
  fireStation: {
    type: 'Fire Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/0',
    icon: Flame,
    nameField: 'generalname'
  },
  sesStation: {
    type: 'SES Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/3',
    icon: Shield,
    nameField: 'generalname'
  },
  railStation: {
    type: 'Rail Station',
    url: 'NSW_FOI_Transport_Facilities/MapServer/1',
    icon: Train,
    nameField: 'generalname'
  }
};

function AmenitiesTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setBufferGeometry = useMapStore((state) => state.setBufferGeometry);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(2);
  const [amenities, setAmenities] = useState<Array<{
    type: string;
    name: string;
    distance: number;
    icon?: React.ElementType;
    geometry: {
      x: number;
      y: number;
    };
  }> | null>(null);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const setLayerGroups = useMapStore((state) => state.setLayerGroups);

  const updateBufferGeometry = useCallback((radius: number) => {
    if (!selectedProperty?.geometry) return;

    const rings = selectedProperty.geometry.rings[0];
    const coordinates = rings.map((coord: number[]) => [
            (coord[0] * 180) / 20037508.34,
            (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90)
    ]);

    const center = turf.center(turf.polygon([coordinates]));
    const buffered = buffer(center, radius, { units: 'kilometers' });
    
    const bufferCoords = buffered.geometry.coordinates[0].map((coord: [number, number]) => [
      (coord[0] * 20037508.34) / 180,
      Math.log(Math.tan((90 + coord[1]) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180
    ]) || [];

    setBufferGeometry({
      rings: [bufferCoords],
      spatialReference: { wkid: 102100 }
    });
  }, [selectedProperty?.geometry, setBufferGeometry]);

  useEffect(() => {
    updateBufferGeometry(searchRadius);
  }, [searchRadius, updateBufferGeometry]);

  useEffect(() => {
    return () => {
      setBufferGeometry(null);
    };
  }, [setBufferGeometry]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProperty?.geometry) return;
      setLoading(true);

      try {
        // Get center point from the property geometry
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

        // Create a simple square buffer (searchRadius in km converted to meters)
        const bufferDistance = searchRadius * 1000;
        const bufferGeometry = {
          rings: [[
            [centerX - bufferDistance, centerY - bufferDistance],
            [centerX + bufferDistance, centerY - bufferDistance],
            [centerX + bufferDistance, centerY + bufferDistance],
            [centerX - bufferDistance, centerY + bufferDistance],
            [centerX - bufferDistance, centerY - bufferDistance]
          ]],
          spatialReference: { wkid: 102100 }
        };

        const amenityPromises = Object.entries(AMENITY_CONFIGS).map(async ([key, config]) => {
          try {
            console.log(`🔍 Fetching ${config.type} amenities...`);
            const url = new URL(`https://portal.spatial.nsw.gov.au/server/rest/services/${config.url}/query`);
            
            url.searchParams.append('f', 'json');
            url.searchParams.append('geometry', JSON.stringify(bufferGeometry));
            url.searchParams.append('geometryType', 'esriGeometryPolygon');
            url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
            url.searchParams.append('outFields', '*');
            url.searchParams.append('returnGeometry', 'true');
            url.searchParams.append('inSR', '102100');
            url.searchParams.append('outSR', '102100');

            const response = await fetch(url);

        if (!response.ok) {
              throw new Error(`${config.type} API returned status: ${response.status}`);
        }
        
        const data = await response.json();
            console.log(`📍 ${config.type} data:`, {
              features: data.features?.length || 0,
              firstFeature: data.features?.[0],
              url: config.url
            });
            return { key, config, data };
          } catch (error) {
            console.error(`❌ Error fetching ${config.type}:`, error);
            return { key, config, data: { features: [] } };
          }
        });

        const results = await Promise.all(amenityPromises);
        console.log('🎯 All amenity results:', results.map(r => ({
          type: r.config.type,
          count: r.data.features?.length || 0
        })));

        const allAmenities = results.flatMap(({ config, data }) => {
          if (!data.features?.length) return [];

          const amenities = data.features
            .map((feature: any) => {
              const dx = feature.geometry.x - centerX;
              const dy = feature.geometry.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              const amenity = {
                type: config.type,
                name: feature.attributes[config.nameField],
                distance: Math.round(distance),
                icon: config.icon,
                geometry: feature.geometry
              };
              
              console.log(`📌 Found ${config.type}:`, {
                name: amenity.name,
                distance: `${(amenity.distance/1000).toFixed(1)}km`,
                attributes: feature.attributes
              });
              
              return amenity;
            })
            .filter((amenity: any) => amenity.distance <= searchRadius * 1000)
            .sort((a: any, b: any) => a.distance - b.distance);

          console.log(`✨ Processed ${config.type}:`, {
            total: data.features.length,
            withinRadius: amenities.length,
            radius: `${searchRadius}km`
          });

          return amenities;
        });

        setAmenities(allAmenities);
      } catch (error) {
        console.error('Error in amenities tab:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty?.geometry, searchRadius]);

  const handleAddToMap = async () => {
    if (!amenities?.length) return;
    
    setIsLayerLoading(true);
    try {
      const features = amenities.map(amenity => {
        // Convert from Web Mercator to WGS84
        const x = (amenity.geometry.x * 180) / 20037508.34;
        const y = (Math.atan(Math.exp((amenity.geometry.y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
        
        return {
          type: "Feature",
          properties: {
            type: amenity.type,
            name: amenity.name,
            distance: (amenity.distance / 1000).toFixed(1) + 'km'
          },
          geometry: {
            type: "Point",
            coordinates: [x, y]  // [longitude, latitude]
          }
        };
      });

      const geojsonData = {
        type: "FeatureCollection",
        features: features
      };

      setLayerGroups([{
        id: 'amenities',
        name: 'Analysis',
        layers: [{
          id: 'nearby_amenities',
          name: 'Nearby Amenities',
          type: 'geojson' as const,
          data: geojsonData,
          enabled: true,
          opacity: 1
        }]
      } as LayerGroup]);

    } catch (error) {
      console.error('Error creating amenities layer:', error);
    } finally {
      setIsLayerLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Nearby Amenities</CardTitle>
          <div className="mt-2">
            <div className="text-sm text-muted-foreground">
              Search radius: {searchRadius}km
            </div>
            <Slider
              value={[searchRadius]}
              onValueChange={([value]) => setSearchRadius(value)}
              min={0.5}
              max={10}
              step={0.5}
              className="mt-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : amenities && amenities.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(AMENITY_CONFIGS).map(([key, config]) => {
                const amenitiesOfType = amenities.filter(a => a.type === config.type);
                const Icon = config.icon;
                
                if (amenitiesOfType.length === 0) return null;
                
                const nearest = amenitiesOfType[0];
                
                return (
                  <div key={key} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <div>
                        <div className="font-medium">{config.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {nearest.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(nearest.distance / 1000).toFixed(1)}km away
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground mt-4 italic">
                Closest amenity for each is listed with total counts shown for completeness.
              </p>
            </div>
          ) : (
            <Alert>
              <AlertTitle>No amenities found within {searchRadius}km</AlertTitle>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAddToMap}
            className="w-full"
            disabled={isLayerLoading || !amenities?.length}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding to map...
              </span>
            ) : (
              'Add to Map'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function DemographicsTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loading, setLoading] = useState(true);
  const [genderData, setGenderData] = useState<Array<{ name: string; value: number }>>([]);
  const [ageData, setAgeData] = useState<Array<{ name: string; value: number }>>([]);
  const [populationData, setPopulationData] = useState<Array<{ year: number; population: number }>>([]);

  useEffect(() => {
    async function fetchCensusData() {
      if (!selectedProperty?.geometry) return;
      setLoading(true);

      try {
        // Convert Web Mercator to WGS84 coordinates
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

        // Convert to WGS84
        const longitude = (centerX * 180) / 20037508.34;
        const latitude = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

        // Fetch both demographic and population data
        const [censusResponse, populationResponse] = await Promise.all([
          fetch(
            `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ABS_2021_Census_G01_Selected_person_characteristics_by_sex_Beta/FeatureServer/5/query?` +
            `geometry=${longitude},${latitude}&` +
            `geometryType=esriGeometryPoint&` +
            `inSR=4326&` +
            `spatialRel=esriSpatialRelIntersects&` +
            `outFields=*&` +
            `returnGeometry=false&` +
            `f=json`
          ),
          fetch(
            `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ABS_Estimated_resident_population_2001_2021_Beta/FeatureServer/0/query?` +
            `geometry=${longitude},${latitude}&` +
            `geometryType=esriGeometryPoint&` +
            `inSR=4326&` +
            `spatialRel=esriSpatialRelIntersects&` +
            `outFields=*&` +
            `returnGeometry=false&` +
            `f=json`
          )
        ]);

        if (!censusResponse.ok || !populationResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [censusData, populationData] = await Promise.all([
          censusResponse.json(),
          populationResponse.json()
        ]);

        // Process census data (existing code)
        if (censusData.features?.[0]?.attributes) {
          const attributes = censusData.features[0].attributes;
          
          const total = (attributes.Tot_P_F || 0) + (attributes.Tot_P_M || 0);
          setGenderData([
            { name: 'Female', value: total ? (attributes.Tot_P_F || 0) / total : 0 },
            { name: 'Male', value: total ? (attributes.Tot_P_M || 0) / total : 0 }
          ]);

          setAgeData([
            { name: '0-4', value: attributes.Age_0_4_yr_P || 0 },
            { name: '5-14', value: attributes.Age_5_14_yr_P || 0 },
            { name: '15-19', value: attributes.Age_15_19_yr_P || 0 },
            { name: '20-24', value: attributes.Age_20_24_yr_P || 0 },
            { name: '25-34', value: attributes.Age_25_34_yr_P || 0 },
            { name: '35-44', value: attributes.Age_35_44_yr_P || 0 },
            { name: '45-54', value: attributes.Age_45_54_yr_P || 0 },
            { name: '55-64', value: attributes.Age_55_64_yr_P || 0 },
            { name: '65-74', value: attributes.Age_65_74_yr_P || 0 },
            { name: '75-84', value: attributes.Age_75_84_yr_P || 0 },
            { name: '85+', value: attributes.Age_85ov_P || 0 }
          ]);
        }

        // Process population data
        if (populationData.features?.[0]?.attributes) {
          const attributes = populationData.features[0].attributes;
          const timeSeriesData = Array.from({ length: 21 }, (_, i) => {
            const year = 2001 + i;
            return {
              year,
              population: attributes[`ERP_no_${year}`] || 0
            };
          }).filter(d => d.population > 0);

          setPopulationData(timeSeriesData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setGenderData([]);
        setAgeData([]);
        setPopulationData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCensusData();
  }, [selectedProperty?.geometry]);

  const COLORS = ['#C084FC', '#44B9FF'];

  return (
    <div className="p-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[60px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : genderData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex h-8">
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${genderData[0].value * 100}%`,
                    backgroundColor: COLORS[0]
                  }} 
                />
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${genderData[1].value * 100}%`,
                    backgroundColor: COLORS[1]
                  }} 
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: COLORS[0] }}></div>
                  Female {(genderData[0].value * 100).toFixed(1)}%
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: COLORS[1] }}></div>
                  Male {(genderData[1].value * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No demographic data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ageData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={ageData}
                  layout="horizontal"
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  barSize={35}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    axisLine={true}
                    interval={0}
                  />
                  <YAxis hide />
                  <RechartsTooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#1E4FD9"
                    label={{ 
                      position: 'top',
                      formatter: (value) => `${((value / ageData.reduce((acc, cur) => acc + cur.value, 0)) * 100).toFixed(1)}%`,
                      fontSize: 11,
                      dy: -5
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No age data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Population Over Time</CardTitle>
          <CardDescription>Historical population trends (2001-2021)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : populationData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={populationData}
                  margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => value.toString()}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Population']}
                    labelFormatter={(year) => `Year: ${year}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="population"
                    stroke="#1E4FD9"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No population data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchElevationData(geometry: any) {
  console.log('🗺️ Starting elevation data fetch...');
  try {
    // Convert Web Mercator to WGS84 coordinates
    const rings = geometry.rings[0].map((coord: number[]) => [
      (coord[0] * 180) / 20037508.34,
      (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90)
    ]);
    
    console.log('🔄 Converted coordinates:', rings);

    const queryGeometry = {
      rings: [rings],
          spatialReference: { wkid: 4326 }
        };

    console.log('📍 Query geometry:', queryGeometry);

    const url = `https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Elevation_and_Depth_Theme/FeatureServer/2/query?` +
      `geometry=${encodeURIComponent(JSON.stringify(queryGeometry))}` +
      `&geometryType=esriGeometryPolygon` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=elevation` +
      `&returnGeometry=false` +
      `&inSR=4326` +
      `&f=json`;

    console.log('🌐 Fetching from URL:', url);

    const response = await fetch(url);
    console.log('📥 Response status:', response.status);

    if (!response.ok) throw new Error(`Failed to fetch elevation data: ${response.status}`);
    
    const data = await response.json();
    console.log('📦 Raw elevation data:', data);
        
        if (data.features && data.features.length > 0) {
      // Extract elevation values from contour lines that intersect with the property
      const elevations = data.features.map((f: any) => f.attributes.elevation);
      console.log('📊 Elevation values:', elevations);
      
      const result = {
        min: Math.min(...elevations),
        max: Math.max(...elevations),
        avg: elevations.reduce((a: number, b: number) => a + b, 0) / elevations.length
      };
      
      console.log('✨ Processed elevation data:', result);
      return result;
    }
    
    console.log('⚠️ No elevation features found');
    return { min: null, max: null, avg: null };
  } catch (error) {
    console.error('❌ Error fetching elevation data:', error);
    return { min: null, max: null, avg: null };
  }
}

export function AnalyticsPanel() {
  const selectedProperty = useMapStore((state: any) => state.selectedProperty);
  const [headerAddress, setHeaderAddress] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("overview");

  const getHeaderText = (tab: string) => {
    const headerMap: { [key: string]: string } = {
      overview: "Property Details",
      development: "Development Applications",
      planning: "Planning Controls",
      constraints: "Site Constraints",
      sales: "Sales History",
      amenities: "Nearby Amenities",
      demographics: "Local Demographics"
    };
    return headerMap[tab] || "Property Details";
  };

  useEffect(() => {
    async function fetchAddress() {
      if (selectedProperty?.propId) {
        try {
          const response = await fetch(
            `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${selectedProperty.propId}&Type=property`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }
          
          const addressData = await response.text();
          setHeaderAddress(addressData.replace(/^"|"$/g, ''));
        } catch (error) {
          console.error('Error fetching address:', error);
          setHeaderAddress(null);
        }
      }
    }

    fetchAddress();
  }, [selectedProperty?.propId]);

  return (
    <div className="h-full bg-card shadow-lg">
      <Tabs 
        defaultValue="overview" 
        orientation="vertical" 
        className="h-full flex"
        onValueChange={setCurrentTab}
      >
        <div className="border-r w-[60px] flex flex-col">
          <div className="h-[175px] border-b"></div>
          <TabsList className="flex flex-col gap-6 p-4">
            <TabsTrigger value="overview" className="w-10 h-10 p-0 relative group">
              <MapPin className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="development" className="w-10 h-10 p-0 relative group">
              <Building2 className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Development
              </span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="w-10 h-10 p-0 relative group">
              <FileText className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Planning
              </span>
            </TabsTrigger>
            <TabsTrigger value="constraints" className="w-10 h-10 p-0 relative group">
              <AlertTriangle className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Constraints
              </span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="w-10 h-10 p-0 relative group">
              <DollarSign className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Sales
              </span>
            </TabsTrigger>
            <TabsTrigger value="amenities" className="w-10 h-10 p-0 relative group">
              <Coffee className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Amenities
              </span>
            </TabsTrigger>
            <TabsTrigger value="demographics" className="w-10 h-10 p-0 relative group">
              <Users className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Demographics
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              {selectedProperty?.propId ? (
                <div className="space-y-1">
                  <h2 className="font-semibold text-lg">{headerAddress || 'Loading...'}</h2>
                  <p className="text-sm text-muted-foreground">{getHeaderText(currentTab)}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <h2 className="font-semibold text-left">Analytics</h2>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full">
                <ScrollArea className="h-full">
                  <SiteOverviewTab />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="development" className="h-full">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">Development applications coming soon</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="planning" className="h-full">
                <ScrollArea className="h-full">
                  <PlanningTab />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="constraints" className="h-full">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <BushfireRisk />
                    <ContaminationRisk />
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="sales" className="h-full">
                <ScrollArea className="h-full">
                  <SalesTab />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="amenities" className="h-full">
                <ScrollArea className="h-full">
                  <AmenitiesTab />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="demographics" className="h-full">
                <ScrollArea className="h-full">
                  <div className="px-4 text-xs text-muted-foreground">
                    Data based on ABS Census 2021 using the SA1 the selected property is within
                  </div>
                  <DemographicsTab />
                </ScrollArea>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

export function useOnlineUsers(channel: string) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const presence = supabase.channel(`presence_${channel}`, {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      presence.unsubscribe();
    };
  }, [channel]);

  return onlineCount;
}
