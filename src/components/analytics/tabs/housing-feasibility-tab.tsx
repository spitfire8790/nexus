import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMapStore } from "@/lib/map-store";
import { Loader2, Home, Building2, Building, Hotel, Store, Check, X, House } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { apiThrottle } from "@/lib/api-throttle";
import { calculateStreetFrontage } from "@/components/analytics/tabs/overview-tab";
import { Ruler } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface DwellingType {
  name: string;
  icon: React.ReactNode;
  id: string;
  averageGFA?: number;
  medianStoreys?: number;
  medianCostPerSqm?: number;
  medianCostPerDwelling?: number;
  subTypes?: Array<{
    name: string;
    id: string;
    averageGFA?: number;
    medianStoreys?: number;
    medianCostPerSqm?: number;
    medianCostPerDwelling?: number;
  }>;
  builderInfo?: string;
}

interface ConsentStatus {
  status: 'withConsent' | 'withoutConsent' | null;
}

interface DcpRequirement {
  dwellingType: string;
  subType: string | null;
  zone: string | null;
  streetFrontage: number;
}

interface ConstructionCertificate {
  council_name: string;
  development_type: Array<{ DevelopmentType: string }>;
  proposed_gfa: number;
  units_proposed: number;
  storeys_proposed: number;
  matched_da_id: string;
  builder_legal_name: string;
  development_applications: {
    cost_of_development: number;
    number_of_new_dwellings: number;
  } | null;
}

const RESIDENTIAL_TYPES: DwellingType[] = [
  {
    name: "Dual Occupancies",
    icon: <House className="h-5 w-5" />,
    id: "dual-occupancies"
  },
  {
    name: "Dwelling Houses",
    icon: <Home className="h-5 w-5" />,
    id: "Dwelling Houses"
  },
  { 
    name: "Multi Dwelling Housing", 
    icon: <Building2 className="h-5 w-5" />, 
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
  const [residentialTypes, setResidentialTypes] = useState<DwellingType[]>(RESIDENTIAL_TYPES);

  // Add useEffect to fetch construction certificate data
  useEffect(() => {
    async function fetchConstructionData() {
      if (!selectedProperty || !zoneInfo?.lgaName) {
        console.log('No property or LGA name found:', { selectedProperty, zoneInfo });
        return;
      }

      const councilName = zoneInfo.lgaName;
      console.log('Current zoneInfo:', zoneInfo);
      console.log('Using council name:', councilName);

      try {
        // First, let's check what councils are available
        const { data: allCouncils, error: councilError } = await supabase
          .from('construction_certificates')
          .select('council_name')
          .limit(10);

        console.log('Available councils in database:', allCouncils?.map(c => c.council_name));
        
        // Use ilike for case-insensitive matching and handle variations of the name
        const { data, error } = await supabase
          .from('construction_certificates')
          .select(`
            development_type,
            proposed_gfa,
            council_name,
            units_proposed,
            storeys_proposed,
            builder_legal_name,
            development_applications!inner(cost_of_development, number_of_new_dwellings)
          `)
          .ilike('council_name', `%${councilName.toLowerCase().replace('city of ', '')}%`);

        if (error) {
          console.error('Error fetching construction data:', error);
          return;
        }

        console.log('Received construction data:', data);

        // Process the data for each dwelling type
        const updatedTypes = RESIDENTIAL_TYPES.map(type => {
          const relevantCertificates = data
            .filter(cert => 
              cert.development_type.some(dt => {
                const devType = dt.DevelopmentType;
                switch(type.name) {
                  case 'Dual Occupancies':
                    return devType === 'Dual occupancy' || 
                           devType === 'Dual occupancy (attached)' || 
                           devType === 'Dual occupancy (detached)';
                  case 'Dwelling Houses':
                    return devType === 'Dwelling' || 
                           devType === 'Dwelling house' || 
                           devType === 'Semi-attached dwelling' || 
                           devType === 'Semi-detached dwelling';
                  case 'Multi Dwelling Housing':
                    return devType === 'Multi-dwelling housing' || 
                           devType === 'Multi dwelling housing (terraces)' || 
                           devType === 'Multi-dwelling housing (terraces)' || 
                           devType === 'Manor houses';
                  case 'Residential Flat Buildings':
                    return devType === 'Residential flat building';
                  case 'Shop Top Housing':
                    return devType === 'Shop top housing';
                  default:
                    return false;
                }
              })
            )
            .filter(cert => cert.units_proposed > 0);

          // Get the most frequent builder
          const builderCounts = relevantCertificates.reduce((acc, cert) => {
            if (cert.builder_legal_name) {
              acc[cert.builder_legal_name] = (acc[cert.builder_legal_name] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          let topBuilder = '';
          let topCount = 0;
          Object.entries(builderCounts).forEach(([builder, count]) => {
            if (count > topCount) {
              topBuilder = builder;
              topCount = count;
            }
          });

          const builderInfo = topBuilder ? `${topBuilder} (${topCount})` : '-';

          console.log(`Matching certificates for ${type.name}:`, relevantCertificates);

          // Calculate medians
          const medianGFA = relevantCertificates.length > 0
            ? calculateMedian(relevantCertificates.map(cert => cert.proposed_gfa / cert.units_proposed))
            : undefined;

          const medianStoreys = relevantCertificates.length > 0
            ? calculateMedian(relevantCertificates.filter(cert => cert.storeys_proposed > 0).map(cert => cert.storeys_proposed))
            : undefined;

          const medianCostPerSqm = relevantCertificates.length > 0
            ? calculateMedian(
                relevantCertificates
                  .filter(cert => 
                    cert.development_applications?.cost_of_development > 0 && 
                    cert.development_applications?.cost_of_development / cert.proposed_gfa >= 500
                  )
                  .map(cert => cert.development_applications!.cost_of_development / cert.proposed_gfa)
              )
            : undefined;

          const medianCostPerDwelling = relevantCertificates.length > 0
            ? calculateMedian(
                relevantCertificates
                  .filter(cert => 
                    cert.development_applications?.cost_of_development > 0 && 
                    cert.development_applications?.number_of_new_dwellings > 0 &&
                    cert.development_applications.cost_of_development / cert.development_applications.number_of_new_dwellings >= 50000
                  )
                  .map(cert => cert.development_applications!.cost_of_development / cert.development_applications!.number_of_new_dwellings)
              )
            : undefined;

          if (type.subTypes) {
            const updatedSubTypes = type.subTypes.map(subType => {
              const subTypeCertificates = data
                .filter(cert =>
                  cert.development_type.some(dt => {
                    const devType = dt.DevelopmentType;
                    switch(subType.name) {
                      case 'Manor Houses':
                        return devType === 'Manor houses';
                      case 'Terraces':
                        return devType === 'Multi dwelling housing (terraces)' || 
                               devType === 'Multi-dwelling housing (terraces)';
                      case 'Townhouses':
                        return devType === 'Multi-dwelling housing';
                      default:
                        return false;
                    }
                  })
                )
                .filter(cert => cert.units_proposed > 0);

              console.log(`Matching certificates for subtype ${subType.name}:`, subTypeCertificates);

              const subTypeMedianCostPerSqm = subTypeCertificates.length > 0
                ? calculateMedian(
                    subTypeCertificates
                      .filter(cert => 
                        cert.development_applications?.cost_of_development > 0 && 
                        cert.development_applications?.cost_of_development / cert.proposed_gfa >= 500
                      )
                      .map(cert => cert.development_applications!.cost_of_development / cert.proposed_gfa)
                  )
                : undefined;

              const subTypeMedianCostPerDwelling = subTypeCertificates.length > 0
                ? calculateMedian(
                    subTypeCertificates
                      .filter(cert => 
                        cert.development_applications?.cost_of_development > 0 && 
                        cert.development_applications?.number_of_new_dwellings > 0 &&
                        cert.development_applications.cost_of_development / cert.development_applications.number_of_new_dwellings >= 50000
                      )
                      .map(cert => cert.development_applications!.cost_of_development / cert.development_applications!.number_of_new_dwellings)
                  )
                : undefined;

              return {
                ...subType,
                averageGFA: subTypeCertificates.length > 0
                  ? calculateMedian(subTypeCertificates.map(cert => cert.proposed_gfa / cert.units_proposed))
                  : undefined,
                medianStoreys: subTypeCertificates.length > 0
                  ? calculateMedian(subTypeCertificates.filter(cert => cert.storeys_proposed > 0).map(cert => cert.storeys_proposed))
                  : undefined,
                medianCostPerSqm: subTypeMedianCostPerSqm,
                medianCostPerDwelling: subTypeMedianCostPerDwelling
              };
            });

            return {
              ...type,
              averageGFA: medianGFA,
              medianStoreys: medianStoreys,
              medianCostPerSqm: medianCostPerSqm,
              medianCostPerDwelling: medianCostPerDwelling,
              subTypes: updatedSubTypes,
              builderInfo
            };
          }

          return {
            ...type,
            averageGFA: medianGFA,
            medianStoreys: medianStoreys,
            medianCostPerSqm: medianCostPerSqm,
            medianCostPerDwelling: medianCostPerDwelling,
            builderInfo
          };
        });
        
        setResidentialTypes(updatedTypes);
      } catch (error) {
        console.error('Error processing construction data:', error);
      }
    }

    fetchConstructionData();
  }, [selectedProperty, zoneInfo]);

  // Helper function to calculate median
  const calculateMedian = (numbers: number[]): number => {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  };

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
          ? 'http://localhost:5174'
          : 'https://www.nexusapi.xyz';

        const permittedResponse = await fetch(`${API_BASE_URL}/api/proxy`, {
          method: 'GET',
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
                <Ruler className="h-5 w-5" />
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
            <div className="grid grid-cols-[160px_70px_90px_110px_80px_100px_100px_200px_1fr] mb-3 border-b pb-2 text-xs">
              <div>Dwelling Type</div>
              <div>Permissible</div>
              <div className="text-center">
                Min.<br/>
                Frontage
              </div>
              <div className="text-center">
                Median GFA<br/>
                (m²/Dwelling)
              </div>
              <div className="text-center">
                Median<br/>
                Storeys
              </div>
              <div className="text-center">
                Cost<br/>
                $/m² GFA
              </div>
              <div className="text-center">
                Cost<br/>
                $/Dwelling
              </div>
              <div>Top Builder</div>
              <div>{/* Reserved for future columns */}</div>
            </div>
            
            {/* Rows */}
            <div className="space-y-4">
              {residentialTypes.map((type) => {
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
                    <div className="grid grid-cols-[160px_70px_90px_110px_80px_100px_100px_200px_1fr] items-center text-xs">
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span className="text-sm">{type.name}</span>
                      </div>
                      <div className="flex justify-center">
                        <StatusIcon type={status} />
                      </div>
                      <div className="text-sm text-center">
                        {type.subTypes ? null : frontageCheck.required ? (
                          <span className={frontageCheck.meets ? 'text-green-600' : 'text-red-600'}>
                            {frontageCheck.required}m {frontageCheck.meets ? '✓' : '✗'}
                          </span>
                        ) : '-'}
                      </div>
                      <div className="text-sm text-center">
                        {type.averageGFA ? 
                          Math.round(type.averageGFA).toLocaleString() 
                          : '-'}
                      </div>
                      <div className="text-sm text-center">
                        {type.medianStoreys ? 
                          Math.round(type.medianStoreys).toLocaleString() 
                          : '-'}
                      </div>
                      <div className="text-sm text-center">
                        {type.medianCostPerSqm ? 
                          Math.round(type.medianCostPerSqm).toLocaleString() 
                          : '-'}
                      </div>
                      <div className="text-sm text-center">
                        {type.medianCostPerDwelling ? 
                          type.medianCostPerDwelling >= 1000000 
                            ? `$${(type.medianCostPerDwelling / 1000000).toFixed(1)}M`
                            : `$${Math.round(type.medianCostPerDwelling / 1000)}k`
                          : '-'}
                      </div>
                      <div className="text-sm">
                        {type.builderInfo || '-'}
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
                            <div key={subType.id} className="grid grid-cols-[160px_70px_90px_110px_80px_100px_100px_200px_1fr] items-center text-xs">
                              <div className="ml-8 text-sm text-muted-foreground">
                                {subType.name}
                              </div>
                              <div className="flex justify-center">
                                {/* No status icon for subtypes */}
                              </div>
                              <div className="text-sm text-center">
                                {subTypeFrontageCheck.required ? (
                                  <span className={subTypeFrontageCheck.meets ? 'text-green-600' : 'text-red-600'}>
                                    {subTypeFrontageCheck.required}m {subTypeFrontageCheck.meets ? '✓' : '✗'}
                                  </span>
                                ) : '-'}
                              </div>
                              <div className="text-sm text-center">
                                {subType.averageGFA ? 
                                  Math.round(subType.averageGFA).toLocaleString() 
                                  : '-'}
                              </div>
                              <div className="text-sm text-center">
                                {subType.medianStoreys ? 
                                  Math.round(subType.medianStoreys).toLocaleString() 
                                  : '-'}
                              </div>
                              <div className="text-sm text-center">
                                {subType.medianCostPerSqm ? 
                                  Math.round(subType.medianCostPerSqm).toLocaleString() 
                                  : '-'}
                              </div>
                              <div className="text-sm text-center">
                                {subType.medianCostPerDwelling ? 
                                  subType.medianCostPerDwelling >= 1000000 
                                    ? `$${(subType.medianCostPerDwelling / 1000000).toFixed(1)}M`
                                    : `$${Math.round(subType.medianCostPerDwelling / 1000)}k`
                                  : '-'}
                              </div>
                              <div className="text-sm">
                                {subType.builderInfo || '-'}
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
      {/* Footnotes */}
      <div className="mt-4 text-xs text-muted-foreground space-y-2">
        <p>
          Development cost data sourced from{' '}
          <a 
            href="https://www.planningportal.nsw.gov.au/opendata/dataset/online-da-data-api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            NSW Online DA Data API
          </a>
        </p>
        <p>
          Currently using development requirements from the City of Parramatta Council's Development Control Plan (DCP). Additional Council DCPs to be added.
        </p>
      </div>
    </div>
  );
} 