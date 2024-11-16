import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Coffee
} from "lucide-react";
import { useMapStore } from "@/lib/map-store";
import { useEffect, useState, useCallback } from "react";
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
import * as turf from '@turf/turf';

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

function SiteOverviewTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loadingStates, setLoadingStates] = useState({
    address: false,
    spatial: false,
    sales: false,
    zoning: false
  });
  const [data, setData] = useState<{
    zoneInfo: string | null;
    lgaName: string | null;
    propertyAddress: string | null;
    area: number | null;
    lastSaleDate: string | null;
    lastSalePrice: number | null;
    maxHeight: string | null;
    minLotSize: string | null;
  }>({
    zoneInfo: null,
    lgaName: null,
    propertyAddress: null,
    area: null,
    lastSaleDate: null,
    lastSalePrice: null,
    maxHeight: null,
    minLotSize: null
  });

  useEffect(() => {
    async function fetchPropertyData() {
      if (!selectedProperty?.propId) return;
      
      // Reset all loading states
      setLoadingStates({
        address: true,
        spatial: true,
        sales: true,
        zoning: true
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
          const response = await fetchWithTimeout(
            `https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/MapServer/12/query?where=propid=${propId}&outFields=shape_Area&returnGeometry=false&f=json`
          );
          const data = await response.json();
          setData(prev => ({ ...prev, area: data.features?.[0]?.attributes?.shape_Area ?? null }));
        } catch (error) {
          console.error('Spatial fetch error:', error);
          setData(prev => ({ ...prev, area: null }));
        } finally {
          setLoadingStates(prev => ({ ...prev, spatial: false }));
        }
      };

      const fetchSales = async () => {
        try {
          console.time('sales-fetch');
          console.log('Fetching sales for propId:', propId);
          
          // First check if the property exists with a count query
          const countResponse = await fetchWithTimeout(
            `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?` +
            `where=propid=${propId.toLowerCase()}&` +
            `returnCountOnly=true&` +
            `f=json`,
            5000
          );
          
          const countData = await countResponse.json();
          
          // Only fetch details if we found a matching property
          if (countData.count > 0) {
            const response = await fetchWithTimeout(
              `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?` +
              `where=propid=${propId.toLowerCase()}&` +
              `outFields=sale_date,price&` +
              `f=json`,
              5000
            );
            
            const data = await response.json();
            console.log('Sales data:', data);
            
            setData(prev => ({
              ...prev,
              lastSaleDate: data.features?.[0]?.attributes?.sale_date ?? null,
              lastSalePrice: data.features?.[0]?.attributes?.price ?? null
            }));
          } else {
            // No sales data found
            setData(prev => ({
              ...prev,
              lastSaleDate: null,
              lastSalePrice: null
            }));
          }
          
          console.timeEnd('sales-fetch');
        } catch (error) {
          console.error('Sales fetch error:', error);
          setData(prev => ({ ...prev, lastSaleDate: null, lastSalePrice: null }));
        } finally {
          setLoadingStates(prev => ({ ...prev, sales: false }));
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

      // Start all fetches concurrently
      fetchAddress();
      fetchSpatial();
      fetchSales();
      fetchZoning();
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

        {/* LGA */}
        <div className="font-semibold border-b pb-2 flex items-center gap-2 pt-4">
          <Building className="h-4 w-4" />
          LGA
        </div>
        <div className="border-b pb-2 pt-4">
          {data.lgaName === null ? <LoadingPulse /> : data.lgaName}
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
      console.log('Fetching contamination data for property:', selectedProperty);
      
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://maptest2.environment.nsw.gov.au/arcgis/rest/services/EPA/EPACS/MapServer/1/query`,
            params: {
              geometry: JSON.stringify(selectedProperty.geometry),
              geometryType: 'esriGeometryPolygon',
              spatialRel: 'esriSpatialRelIntersects',
              outFields: 'SiteName',
              returnGeometry: false,
              f: 'json'
            }
          })
        });

        if (!response.ok) throw new Error('Failed to fetch contamination data');
        
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
  return (
    <div className="flex items-center py-1.5">
      <div className="w-6 h-6 flex-shrink-0 border border-red-500 rounded-full flex items-center justify-center text-xs font-medium text-red-500">
        {index + 1}
      </div>
      <div className="grid grid-cols-12 flex-1 gap-0 min-w-0 ml-2">
        <div className="col-span-8 text-sm truncate pr-2" title={sale.bp_address}>
          {sale.bp_address}
        </div>
        <div className="col-span-2 text-sm text-center">
          {new Date(sale.sale_date).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
        <div className="col-span-1 text-sm font-semibold text-blue-600 text-center">
          {formatPrice(sale.price)}
        </div>
        <div className="col-span-1 text-sm text-muted-foreground text-right pr-4">
          {Math.round(sale.distance)}m
        </div>
      </div>
    </div>
  );
}

function SalesTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState<{
    lastSaleDate: string | null;
    lastSalePrice: number | null;
  }>({
    lastSaleDate: null,
    lastSalePrice: null
  });
  const [nearbySales, setNearbySales] = useState<Array<{
    sale_date: string;
    price: number;
    distance: number;
    bp_address: string;
  }> | null>(null);

  // Helper function to parse date string from REST server
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split(' ');
    const months: { [key: string]: number } = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    return new Date(parseInt(year), months[month], parseInt(day));
  };

  // Helper function to calculate time since sale
  const getTimeSinceSale = (saleDate: string) => {
    const sale = new Date(saleDate);
    const today = new Date();
    
    let years = today.getFullYear() - sale.getFullYear();
    let months = today.getMonth() - sale.getMonth();
    let days = today.getDate() - sale.getDate();

    // Adjust for negative months or days
    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    // Build the display string
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    
    return parts.join(', ');
  };

  useEffect(() => {
    async function fetchSalesData() {
      if (!selectedProperty?.geometry) return;
      
      setLoading(true);
      
      try {
        // Convert Web Mercator coordinates to WGS84 for the center calculation
        const rings = selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const x = (coord[0] * 180) / 20037508.34;
          const y = (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
          return [x, y];
        });

        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;
        
        const bufferDegrees = 0.01; // roughly 1km
        const bbox = `${centerX-bufferDegrees},${centerY-bufferDegrees},${centerX+bufferDegrees},${centerY+bufferDegrees}`;

        // Update URL to include bp_address in outFields
        const url = new URL('https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query');
        url.searchParams.append('where', "1=1");
        url.searchParams.append('geometry', bbox);
        url.searchParams.append('geometryType', 'esriGeometryEnvelope');
        url.searchParams.append('inSR', '4326');
        url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
        url.searchParams.append('outFields', 'sale_date,price,bp_address'); // Added bp_address
        url.searchParams.append('returnGeometry', 'true');
        url.searchParams.append('outSR', '4326');
        url.searchParams.append('f', 'json');

        console.log('Fetching sales from URL:', url.toString());
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch sales data');
        }

        // Process all sales with address included
        const allSales = data.features?.map((f: any) => ({
          ...f.attributes,
          geometry: f.geometry,
          date: parseDate(f.attributes.sale_date)
        })) as Sale[];

        // Find the selected property's latest sale (closest to centroid)
        const selectedPropertySale = allSales.find((sale: Sale) => {
          const dx = sale.geometry.x - centerX;
          const dy = sale.geometry.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < 0.0001; // Small threshold for matching
        });

        if (selectedPropertySale) {
          setPropertyData({
            lastSaleDate: selectedPropertySale.sale_date,
            lastSalePrice: selectedPropertySale.price
          });
        }

        // Filter nearby sales (excluding selected property)
        const today = new Date();
        const twelveMonthsAgo = new Date(today.setMonth(today.getMonth() - 12));

        const nearbySalesFiltered = allSales
          .filter((sale: Sale) => {
            const dx = sale.geometry.x - centerX;
            const dy = sale.geometry.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance > 0.0001 && sale.date && sale.date >= twelveMonthsAgo;
          })
          .map((sale: Sale) => {
            const dx = sale.geometry.x - centerX;
            const dy = sale.geometry.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters
            return {
              sale_date: sale.sale_date,
              price: sale.price,
              distance,
              bp_address: sale.bp_address || 'Address not available'
            };
          })
          .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
          .slice(0, 10);

        setNearbySales(nearbySalesFiltered);
      } catch (error) {
        console.error('Sales fetch error:', error);
        setPropertyData({ lastSaleDate: null, lastSalePrice: null });
        setNearbySales(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view sales history</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : propertyData.lastSaleDate ? (
              <div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">
                    Last Sale Date: {new Date(propertyData.lastSaleDate).toLocaleDateString('en-AU', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getTimeSinceSale(propertyData.lastSaleDate)}
                  </div>
                </div>
                <div className="text-lg font-bold mt-1">
                  ${propertyData.lastSalePrice?.toLocaleString('en-AU')}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No sales data available for this property
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Nearby Sales</CardTitle>
            <CardDescription>Last 12 months - 10 closest properties</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : nearbySales && nearbySales.length > 0 ? (
              <div>
                <div className="grid grid-cols-12 gap-0 pb-1 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-8 pl-8 pr-2">Address</div>
                  <div className="col-span-2 text-center">Sale Date</div>
                  <div className="col-span-1 text-center">Price</div>
                  <div className="col-span-1 text-right pr-4">Distance</div>
                </div>
                <div className="divide-y divide-border/30">
                  {nearbySales.map((sale, index) => (
                    <SaleCard key={index} sale={sale} index={index} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No recent sales found in this area
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
    nameField: 'FACILITY_NAME'
  },
  ambulanceStation: {
    type: 'Ambulance Station',
    url: 'NSW_FOI_Health_Facilities/MapServer/0',
    icon: Truck,
    nameField: 'FACILITY_NAME'
  },
  policeStation: {
    type: 'Police Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/1',
    icon: LifeBuoy,
    nameField: 'FACILITY_NAME'
  },
  fireStation: {
    type: 'Fire Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/0',
    icon: Flame,
    nameField: 'FACILITY_NAME'
  },
  sesStation: {
    type: 'SES Station',
    url: 'NSW_FOI_Emergency_Service_Facilities/MapServer/3',
    icon: Shield,
    nameField: 'FACILITY_NAME'
  },
  railStation: {
    type: 'Rail Station',
    url: 'NSW_FOI_Transport_Facilities/MapServer/1',
    icon: Train,
    nameField: 'FACILITY_NAME'
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
  }> | null>(null);

  const updateBufferGeometry = useCallback((radius: number) => {
    if (!selectedProperty?.geometry) return;

    const rings = selectedProperty.geometry.rings[0];
    const coordinates = rings.map((coord: number[]) => [
      (coord[0] * 180) / 20037508.34,
      (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90)
    ]);

    const center = turf.center(turf.polygon([coordinates]));
    const buffered = turf.buffer(center, radius, { units: 'kilometers' });
    
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
    async function fetchAmenities() {
      if (!selectedProperty?.geometry) {
        console.log('No property geometry available');
        return;
      }
      
      setLoading(true);
      
      try {
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

        const bufferGeometry = {
          rings: [[]] as number[][],
          spatialReference: { wkid: 102100 }
        };

        const points = 64;
        const radius = searchRadius * 1000;
        for (let i = 0; i < points; i++) {
          const angle = (i * 2 * Math.PI) / points;
          bufferGeometry.rings[0].push([
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          ]);
        }
        bufferGeometry.rings[0].push(bufferGeometry.rings[0][0]);

        const params = {
          f: 'json',
          geometry: JSON.stringify(bufferGeometry),
          geometryType: 'esriGeometryPolygon',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: 'true',
          inSR: '102100',
          outSR: '102100'
        };

        const amenityPromises = Object.entries(AMENITY_CONFIGS).map(async ([key, config]) => {
          try {
            const response = await fetch(
              `https://portal.spatial.nsw.gov.au/server/rest/services/${config.url}/query?${new URLSearchParams(params)}`
            );
            
            if (!response.ok) {
              throw new Error(`${config.type} API returned status: ${response.status}`);
            }

            const data = await response.json();
            return { key, config, data };
          } catch (error) {
            console.error(`Error fetching ${config.type}:`, error);
            return { key, config, data: { features: [] } };
          }
        });

        const results = await Promise.all(amenityPromises);
        
        const allAmenities = results.flatMap(({ config, data }) => {
          if (!data.features?.length) return [];

          return data.features
            .map((feature: any) => {
              const dx = feature.geometry.x - centerX;
              const dy = feature.geometry.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              return {
                type: config.type,
                name: feature.attributes[config.nameField],
                distance: Math.round(distance),
                icon: config.icon
              };
            })
            .filter((amenity: any) => amenity.distance <= searchRadius * 1000)
            .sort((a: any, b: any) => a.distance - b.distance);
        });

        setAmenities(allAmenities);
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setAmenities(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAmenities();
  }, [selectedProperty?.geometry, searchRadius]);

  useEffect(() => {
    return () => {
      setBufferGeometry(null);
    };
  }, [setBufferGeometry]);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Nearby Amenities</CardTitle>
          <CardDescription className="space-y-4">
            <div>
              Search radius: {searchRadius}km
              <Slider
                value={[searchRadius]}
                onValueChange={([value]) => setSearchRadius(value)}
                min={0.5}
                max={10}
                step={0.5}
                className="mt-2"
              />
            </div>
          </CardDescription>
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
                        <div className="text-sm text-muted-foreground">{nearest.name}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(nearest.distance / 1000).toFixed(1)}km away
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No amenities found within {searchRadius}km</AlertTitle>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
      analytics: "Property Analytics",
      constraints: "Site Constraints",
      sales: "Sales History",
      amenities: "Nearby Amenities"
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
          <div className="h-[150px] border-b"></div>
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
            <TabsTrigger value="analytics" className="w-10 h-10 p-0 relative group">
              <BarChart3 className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Analytics
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
              
              <TabsContent value="analytics" className="h-full">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">Analytics coming soon</p>
                  </div>
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
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
