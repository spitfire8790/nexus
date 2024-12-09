import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMapStore } from "@/lib/map-store";
import { Loader2, Home, Building2, Building, Hotel, Store, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { apiThrottle } from "@/lib/api-throttle";
import { calculateStreetFrontage } from "@/components/analytics/tabs/overview-tab";
import { Ruler } from "lucide-react";

interface DwellingType {
  name: string;
  icon: React.ReactNode;
  id: string;
  subTypes?: Array<{
    name: string;
    id: string;
  }>;
}

interface ConsentStatus {
  status: 'withConsent' | 'withoutConsent' | null;
}

const RESIDENTIAL_TYPES: DwellingType[] = [
  { name: "Dual Occupancies", icon: <Building2 className="h-5 w-5" />, id: "Dual Occupancies" },
  { name: "Dwelling Houses", icon: <Home className="h-5 w-5" />, id: "Dwelling Houses" },
  { 
    name: "Multi Dwelling Housing", 
    icon: <Building className="h-5 w-5" />, 
    id: "Multi Dwelling Housing",
    subTypes: [
      { name: "Manor Houses", id: "manor-houses" },
      { name: "Terraces", id: "terraces" },
      { name: "Townhouses", id: "townhouses" }
    ]
  },
  { name: "Residential Flat Buildings", icon: <Building className="h-5 w-5" />, id: "Residential Flat Buildings" },
  { name: "Shop Top Housing", icon: <Store className="h-5 w-5" />, id: "Shop Top Housing" }
];

// Add new custom status icons
function StatusIcon({ type }: { type: 'withConsent' | 'withoutConsent' | 'notPermitted' }) {
  if (type === 'withoutConsent') {
    return (
      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="h-3 w-3 text-white" />
      </div>
    );
  }
  if (type === 'withConsent') {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center">
        <Check className="h-3 w-3 text-green-500" />
      </div>
    );
  }
  return <X className="h-5 w-5 text-red-500" />;
}

// Add new interface for DCP requirements
interface DcpRequirement {
  dwellingType: string;
  subType: string | null;
  zone: string | null;
  streetFrontage: number;
}

export function HousingFeasibilityTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const permittedUses = useMapStore((state) => state.permittedUses);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const setPermittedUses = useMapStore((state) => state.setPermittedUses);
  
  // Move the DCP requirements state inside the component
  const [dcpRequirements, setDcpRequirements] = useState<DcpRequirement[]>([]);
  const [lepInfo, setLepInfo] = useState<{ name: string; url: string } | null>(null);
  const [streetFrontage, setStreetFrontage] = useState<{ total: number; roads: Array<{ name: string; length: number }> } | null>(null);

// Add function to check if street frontage meets requirement
function meetsStreetFrontageRequirement(
  type: string, 
  subType: string | null, 
  zoneCode: string | null, 
  currentFrontage: number | null
): { required: number | null; meets: boolean } {
  if (!currentFrontage) return { required: null, meets: false };

  // Clean up the zone code by removing any colons and trimming
  const cleanZoneCode = zoneCode?.split(':')[0]?.trim() || null;

  console.log('Looking up requirement for:', {
    type,
    subType,
    originalZoneCode: zoneCode,
    cleanZoneCode,
    currentFrontage
  });

  // First try to find a zone-specific requirement
  let requirement = dcpRequirements.find(req => 
    req.dwellingType === type && 
    (!req.subType || req.subType === subType) &&
    req.zone === cleanZoneCode // Use cleaned zone code
  );

  // If no zone-specific requirement found, look for a general requirement
  if (!requirement) {
    requirement = dcpRequirements.find(req => 
      req.dwellingType === type && 
      (!req.subType || req.subType === subType) &&
      !req.zone
    );
  }

  console.log('Found requirement:', requirement);

  if (!requirement) return { required: null, meets: false };
  return {
    required: requirement.streetFrontage,
    meets: currentFrontage >= requirement.streetFrontage
  };
}

  // Add useEffect to fetch DCP data
  useEffect(() => {
    async function loadDcpRequirements() {
      try {
        const response = await fetch('/data/dcp/dcp.csv');
        const csvText = await response.text();
        console.log('CSV Text:', csvText);
        
        // Filter out empty rows and parse CSV
        const rows = csvText
          .split('\n')
          .slice(1) // Skip header
          .filter(row => row.trim().length > 0); // Remove empty rows
        
        const requirements = rows
          .map(row => {
            const [dwellingType, subType, zone, streetFrontage] = row.split(',');
            if (!dwellingType || !streetFrontage) return null;
            
            return {
              dwellingType: dwellingType.trim(),
              subType: subType?.trim() || null,
              zone: zone?.trim() || null,
              streetFrontage: Number(streetFrontage)
            };
          })
          .filter((req): req is DcpRequirement => req !== null);
        
        console.log('Parsed Requirements:', requirements);
        setDcpRequirements(requirements);
      } catch (error) {
        console.error('Error loading DCP requirements:', error);
      }
    }
    
    loadDcpRequirements();
  }, []);

  useEffect(() => {
    async function fetchZoningAndPermittedUses() {
      if (!selectedProperty?.propId) return;

      setPermittedUses(prev => ({ ...prev, loading: true, error: null }));

      try {
        const zoningResponse = await apiThrottle.fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const zoningData = await zoningResponse.json();
        const landApplicationLayer = zoningData.find((l: any) => l.layerName === "Land Application Map");
        
        // Add console log to debug LEP info
        console.log('Land Application Layer:', landApplicationLayer);
        
        if (landApplicationLayer?.results?.[0]) {
          const lepInfo = {
            name: landApplicationLayer.results[0]["EPI Name"],
            url: landApplicationLayer.results[0].legislationUrl
          };
          console.log('Setting LEP Info:', lepInfo);
          setLepInfo(lepInfo);
        }

        const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

        if (!zoningLayer?.results?.[0]) {
          throw new Error('No zoning data found');
        }

        const zoneInfo = {
          zoneName: zoningLayer.results[0].title,
          lgaName: zoningLayer.results[0]["LGA Name"]
        };

        setZoneInfo(zoneInfo);

        // Fetch permitted uses
        const response = await apiThrottle.fetch(
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
        const zone = precinct?.Zone?.find((z: any) => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        const withConsentSet = new Set(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet = new Set(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        setPermittedUses({
          withConsent: [...withConsentSet].sort((a, b) => a.localeCompare(b)),
          withoutConsent: [...withoutConsentSet].sort((a, b) => a.localeCompare(b)),
          loading: false,
          error: null
        });

        // Add street frontage calculation
        if (selectedProperty.geometry) {
          const frontageData = await calculateStreetFrontage(selectedProperty.geometry);
          setStreetFrontage(frontageData);
        }

      } catch (error: any) {
        console.error('Error in housing feasibility tab:', error);
        setPermittedUses(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch planning data'
        }));
      }
    }

    fetchZoningAndPermittedUses();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo, setPermittedUses]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view housing feasibility</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (permittedUses.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (permittedUses.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{permittedUses.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {lepInfo ? (
              lepInfo.url ? (
                <a 
                  href={lepInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600 cursor-pointer transition-colors hover:text-blue-800"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(lepInfo.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  {lepInfo.name}
                </a>
              ) : (
                lepInfo.name
              )
            ) : (
              "Housing Feasibility"
            )}
          </CardTitle>
          <div className="space-y-1 text-muted-foreground">
            <p>Permitted residential development types in {zoneInfo?.zoneName}</p>
            {streetFrontage && (
              <p className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4" />
                Street frontage: {streetFrontage.total}m
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-green-700">With Consent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-green-700">Without Consent</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-700">Not Permitted</span>
            </div>
          </div>

          <div className="relative">
            {/* Header */}
            <div className="grid grid-cols-[200px_100px_150px_1fr] mb-4 border-b pb-2">
              <div>Dwelling Type</div>
              <div>Permissibility</div>
              <div>Min. Street Frontage</div>
              <div>{/* Reserved for future columns */}</div>
            </div>
            
            {/* Rows */}
            <div className="space-y-4">
              {RESIDENTIAL_TYPES.map((type) => {
                const isWithoutConsent = permittedUses.withoutConsent?.includes(type.id);
                const isWithConsent = permittedUses.withConsent?.includes(type.id);
                const status = isWithoutConsent ? 'withoutConsent' : isWithConsent ? 'withConsent' : 'notPermitted';

                // Check street frontage requirement for main type
                const frontageCheck = meetsStreetFrontageRequirement(
                  type.name,
                  null,
                  zoneInfo?.zoneName?.split(' ')[0] || null,
                  streetFrontage?.total || null
                );

                return (
                  <div key={type.id}>
                    <div className="grid grid-cols-[200px_100px_150px_1fr] items-center">
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span className="text-sm">{type.name}</span>
                      </div>
                      <div className="flex justify-center">
                        <StatusIcon type={status} />
                      </div>
                      <div className="text-sm">
                        {type.subTypes ? (
                          // Don't show anything for parent type if it has sub-types
                          null
                        ) : frontageCheck.required ? (
                          <span className={frontageCheck.meets ? 'text-green-600' : 'text-red-600'}>
                            {frontageCheck.required}m {frontageCheck.meets ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </div>
                      <div>{/* Reserved for future columns */}</div>
                    </div>
                    
                    {/* Sub-types */}
                    {type.subTypes && isWithConsent && (
                      <div className="mt-2 space-y-2">
                        {type.subTypes.map(subType => {
                          const subTypeFrontageCheck = meetsStreetFrontageRequirement(
                            type.name,
                            subType.name,
                            zoneInfo?.zoneName?.split(' ')[0] || null,
                            streetFrontage?.total || null
                          );

                          return (
                            <div key={subType.id} className="grid grid-cols-[200px_100px_150px_1fr] items-center">
                              <div className="ml-8 text-sm text-muted-foreground">
                                {subType.name}
                              </div>
                              <div className="flex justify-center">
                                {/* No status icon for subtypes */}
                              </div>
                              <div className="text-sm">
                                {subTypeFrontageCheck.required ? (
                                  <span className={subTypeFrontageCheck.meets ? 'text-green-600' : 'text-red-600'}>
                                    {subTypeFrontageCheck.required}m {subTypeFrontageCheck.meets ? '✓' : '✗'}
                                  </span>
                                ) : '-'}
                              </div>
                              <div>{/* Reserved for future columns */}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 