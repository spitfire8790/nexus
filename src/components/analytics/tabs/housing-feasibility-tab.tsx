import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMapStore } from "@/lib/map-store";
import { Loader2, Home, Building2, Building, Store, Check, X, House, Bed, Bath, Car } from "lucide-react";
import { useEffect, useState } from "react";
import { apiThrottle } from "@/lib/api-throttle";
import { calculateStreetFrontage } from "@/components/analytics/tabs/overview-tab";
import { Ruler } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ResponsiveBar } from '@nivo/bar';
import { mobileStyles as m } from '@/styles/mobile-responsive';

/**
 * Housing Feasibility Analysis Component
 * ====================================
 * This component provides comprehensive analysis of residential development potential
 * for selected properties, incorporating:
 * 
 * 1. Zoning Analysis
 *    - Checks permitted uses under LEP
 *    - Validates against DCP requirements
 *    - Calculates street frontage compliance
 * 
 * 2. Development Metrics
 *    - Historical construction costs
 *    - Typical GFA per dwelling
 *    - Common building heights
 *    - Experienced builders in area
 * 
 * 3. Market Analysis
 *    - Recent sales data by dwelling type
 *    - Price analysis by bedroom count
 *    - Statistical validity checks
 */

/**
 * Interface Definitions
 * ====================
 * Core data structures used throughout the component:
 */

interface DwellingType {
  name: string;          // Display name of dwelling type
  icon: React.ReactNode; // Visual representation
  id: string;           // Unique identifier
  averageGFA?: number;  // Typical Gross Floor Area
  medianStoreys?: number; // Typical building height
  medianCostPerSqm?: number; // Construction cost metrics
  medianCostPerDwelling?: number;
  subTypes?: Array<{    // Optional subtypes (e.g., for Multi Dwelling Housing)
    name: string;
    id: string;
    averageGFA?: number;
    medianStoreys?: number;
    medianCostPerSqm?: number;
    medianCostPerDwelling?: number;
    builderInfo?: string;
  }>;
  builderInfo?: string; // Information about common builders
}

interface DcpRequirement {
  dwellingType: string;
  subType: string | null;
  zone: string | null;
  streetFrontage: number;
}

interface FeasibleDevelopmentType {
  id: string;
  name: string;
  subTypeId?: string;
  subTypeName?: string;
  averageGFA?: number;
  medianStoreys?: number;
  medianCostPerSqm?: number;
  medianCostPerDwelling?: number;
}

interface MedianPrices {
  [key: string]: {
    median: number;
    count: number;
    sales: Array<{
      address: string;
      price: number;
      sold_date: string;
      property_type: string;
      bedrooms: number;
      bathrooms: number;
      parking: number;
    }>;
  };
}

interface DevelopmentTypeRecord {
  DevelopmentType: string;
}

// Add new interface for construction data
interface ConstructionRecord {
  development_type: { DevelopmentType: string }[];
  proposed_gfa: number;
  units_proposed: number;
  storeys_proposed: number;
  builder_legal_name: string;
  council_name: string;
  development_applications: {
    cost_of_development: number;
    number_of_new_dwellings: number;
  };
}

/**
 * Constants
 * =========
 * RESIDENTIAL_TYPES: Array of all possible residential development types
 * - Each type contains metadata and hierarchical structure
 * - Used as the base data structure for feasibility analysis
 */

const RESIDENTIAL_TYPES: DwellingType[] = [
  {
    name: "Dual Occupancies",
    icon: <House className="h-5 w-5" />,
    id: "Dual Occupancies"
  },
  {
    name: "Dwelling Houses",
    icon: <Home className="h-5 w-5" />,
    id: "Dwelling Houses"
  },
  { 
    name: "Multi Dwelling Housing", 
    icon: <Building2 className="h-5 w-5" />, 
    id: "Multi Dwelling Housing"
  },
  { 
    name: "Residential Flat Buildings", 
    icon: <Building className="h-5 w-5" />, 
    id: "Residential Flat Buildings"
  },
  { 
    name: "Shop Top Housing", 
    icon: <Store className="h-5 w-5" />, 
    id: "Shop Top Housing"
  }
];

/**
 * Helper Components
 * ================
 * StatusIcon: Visual indicator for development permission status
 * - withoutConsent: Solid green circle with white checkmark
 * - withConsent: Outlined green circle with green checkmark
 * - default: Red X mark (indicating not permissible)
 */

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'withoutConsent':
      return <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="h-3 w-3 text-white" />
      </div>;
    case 'withConsent':
      return <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center">
        <Check className="h-3 w-3 text-green-500" />
      </div>;
    default:
      return <X className="h-5 w-5 text-red-500" />;
  }
};

/**
 * Utility Functions
 * ================
 */

/**
 * getPropertyTypesForDevelopmentType
 * ---------------------------------
 * Maps high-level development categories to specific property types
 * Used for filtering sales data analysis
 * 
 * @param developmentType - The broad category (e.g., "Dual Occupancies")
 * @param subType - Optional subtype specification
 * @returns Array of property type strings for sales data filtering
 */
function getPropertyTypesForDevelopmentType(developmentType: string): string[] {
  console.log('Mapping development type to property types:', developmentType);
  
  // Remove any subtype information from the development type
  const baseType = developmentType.split(' - ')[0];
  
  const types = {
    'Dual Occupancies': ['duplex', 'semi-detached'],
    'Dwelling Houses': ['house', 'single house', 'detached'],
    'Multi Dwelling Housing': ['townhouse', 'villa', 'terrace'],
    'Residential Flat Buildings': ['unit', 'apartment', 'flat'],
    'Shop Top Housing': ['unit', 'apartment', 'flat']
  }[baseType] || [];

  console.log('Mapped to property types:', types);
  return types;
}

/**
 * calculatePricesByBedrooms
 * ------------------------
 * Processes sales data to compute median prices and sample sizes
 * 
 * @param data - Raw sales records
 * @param propertyTypes - Types to include in analysis
 * @param suburb - Target suburb for filtering
 * @returns Object containing median prices and sample sizes by bedroom count
 */
function calculatePricesByBedrooms(propertyTypes: string[], suburb: string | null) {
  if (!suburb) {
    console.log('No suburb provided to calculatePricesByBedrooms');
    return null;
  }

  console.log('Starting sales data fetch:', {
    suburb: suburb.toUpperCase(),
    propertyTypes
  });

  const query = supabase
    .from('nsw_property_sales')
    .select('*')
    .eq('suburb', suburb.toUpperCase())
    .in('property_type', propertyTypes)
    .gt('price', 50000) // Filter out prices below 50k
    .not('bedrooms', 'is', null)
    .order('sold_date', { ascending: false })
    .limit(1000);

  return query.then(({ data: sales, error }) => {
    if (error) {
      console.error('Supabase query error:', error);
      return null;
    }

    if (!sales?.length) {
      console.log('No sales data found for criteria');
      return null;
    }

    const pricesByBedrooms: MedianPrices = {
      '1': { median: 0, count: 0, sales: [] },
      '2': { median: 0, count: 0, sales: [] },
      '3': { median: 0, count: 0, sales: [] },
      '>3': { median: 0, count: 0, sales: [] }
    };

    // Group sales by bedroom count
    const salesByBedrooms: { [key: string]: number[] } = {};
    const salesRecordsByBedrooms: { [key: string]: typeof sales } = {};
    
    sales.forEach(sale => {
      let category;
      if (!sale.bedrooms || sale.bedrooms === 0) {
        return; // Skip properties with no bedroom data
      } else if (Number(sale.bedrooms) > 3) {
        category = '>3';
      } else {
        category = String(sale.bedrooms);
      }

      if (!salesByBedrooms[category]) {
        salesByBedrooms[category] = [];
        salesRecordsByBedrooms[category] = [];
      }
      salesByBedrooms[category].push(Number(sale.price));
      salesRecordsByBedrooms[category].push(sale);
    });

    // Calculate medians and store sales records
    Object.keys(pricesByBedrooms).forEach(category => {
      const prices = salesByBedrooms[category];
      if (prices?.length) {
        prices.sort((a, b) => a - b);
        const middle = Math.floor(prices.length / 2);
        pricesByBedrooms[category] = {
          median: prices.length % 2 === 0
            ? (prices[middle - 1] + prices[middle]) / 2
            : prices[middle],
          count: prices.length,
          sales: salesRecordsByBedrooms[category]
        };
      }
    });

    return pricesByBedrooms;
  });
}

/**
 * Calculates the median value from an array of numbers
 */
function calculateMedian(numbers: number[]): number | undefined {
  if (!numbers.length) return undefined;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Gets the neighboring LGAs for a given council name
 * @param councilName - The name of the council to find neighbors for
 * @returns Array of neighboring LGA names
 */
async function getNeighboringLgas(councilName: string): Promise<string[]> {
  try {
    const response = await fetch('/data/lga_neighbors_data.csv');
    const csvText = await response.text();
    
    // Split into rows, skipping header
    const rows = csvText.split('\n').slice(1);
    
    // Parse each row carefully to handle quoted values
    const parsedRows = rows.map(row => {
      const [lga, council, neighbors] = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      return {
        lga: lga?.trim() || '',
        council: council?.trim() || '',
        neighbors: neighbors ? neighbors.replace(/"/g, '').split(',').map(n => n.trim()) : []
      };
    });

    // Find the matching council
    const matchingRow = parsedRows.find(row => 
      row.council.toLowerCase().includes(councilName.toLowerCase().replace(/\s*city of\s*/i, '').trim())
    );

    if (!matchingRow) {
      console.log('Could not find LGA for council:', councilName);
      return [];
    }

    console.log('Found current LGA:', matchingRow.lga);
    console.log('Found neighboring LGAs:', matchingRow.neighbors);

    // Map neighboring LGAs back to council names
    const neighboringCouncils = matchingRow.neighbors.map(neighborLga => {
      const neighborRow = parsedRows.find(row => row.lga.trim() === neighborLga.trim());
      return neighborRow?.council || null;
    }).filter((council): council is string => council !== null);

    console.log('Mapped to neighboring councils:', neighboringCouncils);
    return neighboringCouncils;
  } catch (error) {
    console.error('Error loading neighboring LGAs:', error);
    return [];
  }
}

/**
 * Main Component Implementation
 * ===========================
 */

const isValidRecord = (record: ConstructionRecord): boolean => {
  const costPerDwelling = record.development_applications?.cost_of_development / 
                         record.development_applications?.number_of_new_dwellings;
                         
  return !!(
    record.proposed_gfa > 0 &&
    record.units_proposed > 0 &&
    record.development_applications?.number_of_new_dwellings > 0 &&
    record.storeys_proposed > 0 &&
    record.development_applications?.cost_of_development > 0 &&
    costPerDwelling >= 50000 && // Minimum $50k per dwelling
    costPerDwelling <= 5000000  // Maximum $5M per dwelling
  );
};

// Add the chart first
const BuilderCostChart = ({ data }: { data: ConstructionRecord[] }) => {
  const builderStats = data.reduce((acc, record) => {
    const builder = record.builder_legal_name;
    if (!builder || !isValidRecord(record)) return acc;
    
    const costPerSqm = record.development_applications.cost_of_development / record.proposed_gfa;
    if (!acc[builder]) acc[builder] = { costs: [], count: 0 };
    acc[builder].costs.push(costPerSqm);
    acc[builder].count++;
    return acc;
  }, {} as Record<string, { costs: number[], count: number }>);

  const chartData = Object.entries(builderStats)
    .map(([builder, { costs, count }]) => ({
      builder: builder === 'N/A' ? 'Unknown' : builder,
      costPerSqm: calculateMedian(costs) || 0,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="h-[200px] mb-6">
      <ResponsiveBar
        data={chartData}
        keys={['costPerSqm']}
        indexBy="builder"
        margin={{ top: 10, right: 10, bottom: 50, left: 70 }}
        padding={0.3}
        valueFormat={value => `$${Math.round(value).toLocaleString()}`}
        axisBottom={{
          tickRotation: -45
        }}
        axisLeft={{
          format: value => `$${Math.round(value).toLocaleString()}`
        }}
        label={d => `$${Math.round(d.value).toLocaleString()}`}
      />
    </div>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-AU').format(value);
};

// Add this helper function for date formatting
function formatDate(dateString: string): string | null {
  const date = new Date(dateString);
  
  // Check if date is valid and is from 2024
  if (isNaN(date.getTime()) || date.getFullYear() !== 2024) {
    return null;
  }
  
  // Format as 1-Feb-24
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  }).replace(/\s/g, '-');
}

// Update the residential types rendering
const ResidentialTypeCard = ({ type }: { type: DwellingType }) => {
  return (
    <div className={`${m.card} flex flex-col space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={m.icon}>{type.icon}</div>
          <h3 className={m.subheading}>{type.name}</h3>
        </div>
        <StatusIcon status={getPermissionType(type.id)} />
      </div>
      
      {type.subTypes && (
        <div className="pl-4 mt-2 space-y-1.5">
          {type.subTypes.map(subType => (
            <div key={subType.id} className="flex items-center justify-between">
              <span className={m.body}>{subType.name}</span>
              <StatusIcon status={getPermissionType(subType.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function HousingFeasibilityTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const permittedUses = useMapStore((state) => state.permittedUses);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const setPermittedUses = useMapStore((state) => state.setPermittedUses);
  
  // Add suburb state
  const [suburb, setSuburb] = useState<string | null>(null);
  
  // Move the DCP requirements state inside the component
  const [dcpRequirements, setDcpRequirements] = useState<DcpRequirement[]>([]);
  const [streetFrontage, setStreetFrontage] = useState<{ total: number; roads: Array<{ name: string; length: number }> } | null>(null);
  const [residentialTypes, setResidentialTypes] = useState<DwellingType[]>(RESIDENTIAL_TYPES);
  const [selectedDevelopmentType, setSelectedDevelopmentType] = useState<string>("");
  const [feasibleTypes, setFeasibleTypes] = useState<FeasibleDevelopmentType[]>([]);
  const [medianPrices, setMedianPrices] = useState<MedianPrices | null>(null);
  const [includeNeighbors, setIncludeNeighbors] = useState(false);
  const [neighboringLgas, setNeighboringLgas] = useState<string[]>([]);
  const [constructionData, setConstructionData] = useState<ConstructionRecord[]>([]);
  const [selectedTypeData, setSelectedTypeData] = useState<{
    type: string;
    icon: React.ReactNode;
    data: ConstructionRecord[];
  } | null>(null);
  const [selectedBedroomData, setSelectedBedroomData] = useState<{
    bedrooms: string;
    sales: Array<{
      address: string;
      price: number;
      sold_date: string;
      property_type: string;
      bedrooms: number;
      bathrooms: number;
      parking: number;
    }>;
    icon: React.ReactNode;
  } | null>(null);
  const [landApplicationLayer, setLandApplicationLayer] = useState<any>(null);

  // Update the median prices effect
  useEffect(() => {
    if (selectedDevelopmentType && suburb) {
      // Find the selected type to get its name
      const selectedType = feasibleTypes.find(type => type.id === selectedDevelopmentType);
      if (!selectedType) {
        console.log('No matching development type found:', {
          selectedDevelopmentType,
          feasibleTypes
        });
        return;
      }

      const propertyTypes = getPropertyTypesForDevelopmentType(selectedType.name);
      
      console.log('Starting sales data fetch:', {
        selectedType: selectedType.name,
        propertyTypes,
        suburb
      });
      
      calculatePricesByBedrooms(propertyTypes, suburb)
        .then(prices => {
          console.log('Calculated median prices:', prices);
          setMedianPrices(prices);
        })
        .catch(error => {
          console.error('Error in price calculation:', error);
          setMedianPrices(null);
        });
    } else {
      console.log('Missing required data for price calculation:', {
        selectedDevelopmentType,
        suburb,
        feasibleTypes
      });
    }
  }, [selectedDevelopmentType, suburb, feasibleTypes]);

  /**
   * Effect: Construction Data Analysis
   * --------------------------------
   * Fetches and processes historical construction certificates to:
   * 1. Calculate typical building metrics (GFA, storeys)
   * 2. Determine construction costs
   * 3. Identify experienced builders
   */
  useEffect(() => {
    async function fetchConstructionData() {
      if (!selectedProperty || !zoneInfo?.lgaName) {
        console.log('No property or LGA name found:', { selectedProperty, zoneInfo });
        return;
      }

      const councilName = zoneInfo.lgaName;
      console.log('Current council:', councilName);

      try {
        let councilsToQuery = [councilName];

        // If includeNeighbors is true, add neighboring councils
        if (includeNeighbors) {
          const neighbors = await getNeighboringLgas(councilName);
          councilsToQuery = [...councilsToQuery, ...neighbors];
          setNeighboringLgas(neighbors);
          console.log('Including neighboring councils:', neighbors);
        } else {
          setNeighboringLgas([]);
        }

        // Create the query filter for all councils
        const councilFilter = councilsToQuery
          .map(council => `council_name.ilike.%${council.toLowerCase().replace('city of ', '')}%`)
          .join(',');

        console.log('Fetching data for councils:', councilsToQuery);

        const { data: constructionData, error } = await supabase
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
          .or(councilFilter);

        if (error) throw error;

        setConstructionData(constructionData);

        // Process the data for each dwelling type
        const updatedTypes = RESIDENTIAL_TYPES.map(type => {
          const typeData = constructionData?.filter(cert => {
            // First check if the record is valid including cost constraints
            if (!isValidRecord(cert)) return false;
            
            // Then check development type matching
            return cert.development_type.some((dt: DevelopmentTypeRecord) => {
              const devType = dt.DevelopmentType;
              switch(type.name) {
                case 'Dual Occupancies':
                  return devType === 'Dual occupancy' || 
                         devType === 'Dual occupancy (attached)' || 
                         devType === 'Dual occupancy (detached)';
                case 'Dwelling Houses':
                  return devType === 'Dwelling' || 
                         devType === 'Dwelling house';
                case 'Multi Dwelling Housing':
                  return devType === 'Multi-dwelling housing' || 
                         devType === 'Multi dwelling housing (terraces)' || 
                         devType === 'Multi-dwelling housing (terraces)' ||
                         devType === 'Medium Density Housing' ||
                         devType === 'Manor house' || 
                         devType === 'Attached dwelling' || 
                         devType === 'Manor houses';
                case 'Residential Flat Buildings':
                  return devType === 'Residential flat building';
                case 'Shop Top Housing':
                  return devType === 'Shop top housing';
                default:
                  return false;
              }
            });
          }) || [];

          if (typeData.length === 0) return type;

          // Get the most frequent builder
          const builderCounts = typeData.reduce((acc, cert) => {
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

          console.log(`Matching certificates for ${type.name}:`, typeData);

          // Calculate medians
          const medianGFA = typeData.length > 0
            ? calculateMedian(typeData.map(cert => cert.proposed_gfa / cert.units_proposed))
            : undefined;

          const medianStoreys = typeData.length > 0
            ? calculateMedian(typeData.filter(cert => cert.storeys_proposed > 0).map(cert => cert.storeys_proposed))
            : undefined;

          const medianCostPerSqm = typeData.length > 0
            ? calculateMedian(
                typeData
                  .filter(cert => {
                    const da = cert.development_applications;
                    const costPerSqm = da.cost_of_development / cert.proposed_gfa;
                    return costPerSqm >= 500;
                  })
                  .map(cert => cert.development_applications.cost_of_development / cert.proposed_gfa)
              )
            : undefined;

          const medianCostPerDwelling = typeData.length > 0
            ? calculateMedian(
                typeData
                  .map(cert => {
                    const costPerDwelling = cert.development_applications.cost_of_development / 
                                          cert.development_applications.number_of_new_dwellings;
                    return costPerDwelling;
                  })
                  .filter(cost => cost >= 50000 && cost <= 5000000) // Additional validation
              )
            : undefined;

          if (type.subTypes) {
            const updatedSubTypes = type.subTypes.map(subType => {
              const subTypeCertificates = typeData
                .filter(cert =>
                  cert.development_type.some((dt: DevelopmentTypeRecord) => {
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
                      .filter(cert => {
                        const hasValidCost = cert.development_applications?.cost_of_development > 0;
                        const costPerSqm = hasValidCost ? cert.development_applications.cost_of_development / cert.proposed_gfa : 0;
                        return hasValidCost && costPerSqm >= 500;
                      })
                      .map(cert => cert.development_applications.cost_of_development / cert.proposed_gfa)
                  )
                : undefined;

              const subTypeMedianCostPerDwelling = subTypeCertificates.length > 0
                ? calculateMedian(
                    subTypeCertificates
                      .map(cert => {
                        const costPerDwelling = cert.development_applications.cost_of_development / 
                                              cert.development_applications.number_of_new_dwellings;
                        return costPerDwelling;
                      })
                      .filter(cost => cost >= 50000 && cost <= 5000000) // Additional validation
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
  }, [selectedProperty, zoneInfo, includeNeighbors]);

  // Add function to check if street frontage meets requirement
  function meetsStreetFrontageRequirement(
    type: string, 
    zoneCode: string | null,
    currentFrontage: number | null
  ): { required: number | null; meets: boolean } {
    if (!currentFrontage || typeof currentFrontage !== 'number') {
      return { required: null, meets: false };
    }

    // Clean up the zone code by removing any colons and trimming
    const cleanZoneCode = zoneCode?.split(':')[0]?.trim() || null;

    // First try to find a zone-specific requirement
    let requirement = dcpRequirements.find(req => 
      req.dwellingType === type && 
      req.zone === cleanZoneCode
    );

    // If no zone-specific requirement found, look for a general requirement
    if (!requirement) {
      requirement = dcpRequirements.find(req => 
        req.dwellingType === type &&
        !req.zone
      );
    }

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

      setPermittedUses({
        ...permittedUses,
        loading: true,
        error: null
      });

      try {
        const zoningResponse = await apiThrottle.fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const zoningData = await zoningResponse.json();
        const landApplicationLayerData = zoningData.find((l: any) => l.layerName === "Land Application Map");
        
        // Set the land application layer state
        setLandApplicationLayer(landApplicationLayerData);
        
        // Rest of your existing code...
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
        const zone = precinct?.Zone?.find((z: { ZoneCode: string }) => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        const withConsentSet = new Set<string>(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet = new Set<string>(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        console.log('Mapped permitted uses:', { 
          withConsent: [...withConsentSet].sort((a: string, b: string) => a.localeCompare(b)), 
          withoutConsent: [...withoutConsentSet].sort((a: string, b: string) => a.localeCompare(b)) 
        });

        setPermittedUses({
          withConsent: [...withConsentSet].sort((a: string, b: string) => a.localeCompare(b)) as string[],
          withoutConsent: [...withoutConsentSet].sort((a: string, b: string) => a.localeCompare(b)) as string[],
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
        setPermittedUses({
          ...permittedUses,
          loading: false,
          error: error.message || 'Failed to fetch planning data'
        });
      }
    }

    fetchZoningAndPermittedUses();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo, setPermittedUses]);

  useEffect(() => {
    // Filter for feasible development types
    const feasible: FeasibleDevelopmentType[] = [];
    
    residentialTypes.forEach(type => {
      const isWithoutConsent = permittedUses.withoutConsent?.includes(type.name);
      const isWithConsent = permittedUses.withConsent?.includes(type.name);
      const isPermitted = isWithoutConsent || isWithConsent;
      
      // Check street frontage requirement
      const frontageCheck = meetsStreetFrontageRequirement(
        type.name,
        zoneInfo?.zoneName?.split(' ')[0] || null,
        streetFrontage?.total || null
      );

      console.log(`Checking feasibility for ${type.name}:`, {
        isPermitted,
        frontageRequirement: frontageCheck.required,
        currentFrontage: streetFrontage?.total,
        meetsFrontage: frontageCheck.meets
      });

      // Only add if both permitted and meets frontage requirements
      if (isPermitted && frontageCheck.meets) {
        feasible.push({
          id: type.id,
          name: type.name,
          averageGFA: type.averageGFA,
          medianStoreys: type.medianStoreys,
          medianCostPerSqm: type.medianCostPerSqm,
          medianCostPerDwelling: type.medianCostPerDwelling
        });
      }

      // Check subtypes if they exist
      if (type.subTypes && isPermitted) {
        type.subTypes.forEach(subType => {
          const subTypeFrontageCheck = meetsStreetFrontageRequirement(
            type.name,
            zoneInfo?.zoneName?.split(' ')[0] || null,
            streetFrontage?.total || null
          );

          if (subTypeFrontageCheck.meets) {
            feasible.push({
              id: `${type.id}-${subType.id}`,
              name: type.name,
              subTypeId: subType.id,
              subTypeName: subType.name,
              averageGFA: subType.averageGFA,
              medianStoreys: subType.medianStoreys,
              medianCostPerSqm: subType.medianCostPerSqm,
              medianCostPerDwelling: subType.medianCostPerDwelling
            });
          }
        });
      }
    });

    console.log('Feasible development types:', feasible);
    setFeasibleTypes(feasible);
  }, [residentialTypes, permittedUses, zoneInfo, streetFrontage]);

  // Update useEffect to fetch permitted uses from API
  useEffect(() => {
    const fetchPermittedUses = async () => {
      if (!zoneInfo?.lgaName || !zoneInfo?.zoneName) {
        console.log('Missing required zoning info:', { zoneInfo });
        return;
      }

      try {
        // Clean up the zone code - remove any text after brackets or colons
        const zoneCode = zoneInfo.zoneName.split(/[\(\:]/)[0].trim();
        // Clean up LGA name - remove "City of" and other common prefixes
        const cleanLgaName = zoneInfo.lgaName
          .replace(/^(City of|Municipality of|Shire of)\s+/i, '')
          .trim();

        console.log('Fetching permitted uses with:', {
          lgaName: cleanLgaName,
          zoneCode: zoneCode
        });

        const API_BASE_URL = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5174'
          : 'https://www.nexusapi.xyz';

        const response = await fetch(`${API_BASE_URL}/api/proxy`, {
          headers: {
            'EPINAME': cleanLgaName,
            'ZONECODE': zoneCode,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API call failed with status: ${response.status}. Details: ${errorText}`);
        }

        const jsonData = await response.json();
        console.log('Permitted uses API response:', jsonData);

        const precinct = jsonData?.[0]?.Precinct?.[0];
        const zone = precinct?.Zone?.find((z: { ZoneCode: string }) => z.ZoneCode === zoneCode);
        const landUse = zone?.LandUse?.[0] || {};

        const withConsentSet = new Set<string>(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet = new Set<string>(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        console.log('Mapped permitted uses:', { 
          withConsent: [...withConsentSet].sort((a: string, b: string) => a.localeCompare(b)), 
          withoutConsent: [...withoutConsentSet].sort((a: string, b: string) => a.localeCompare(b)) 
        });

        setPermittedUses({
          withConsent: [...withConsentSet].sort((a: string, b: string) => a.localeCompare(b)) as string[],
          withoutConsent: [...withoutConsentSet].sort((a: string, b: string) => a.localeCompare(b)) as string[],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching permitted uses:', error);
        setPermittedUses({
          withConsent: [],
          withoutConsent: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch permitted uses'
        });
      }
    };

    fetchPermittedUses();
  }, [zoneInfo?.lgaName, zoneInfo?.zoneName]);

  // Function to load suburbs data
  async function loadSuburbsData() {
    try {
      const data = await csv('/data/sale prices/suburbs.csv');
      if (!data) {
        console.warn('No suburbs data loaded');
        return {};
      }
      return data.reduce((acc: Record<string, string>, row: any) => {
        if (row.suburb) {
          acc[row.suburb.toUpperCase()] = row.postcode;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Error loading suburbs data:', error);
      return {};
    }
  }

  // Update the suburb detection logic
  useEffect(() => {
    if (!selectedProperty?.geometry) return;

    const fetchSuburbData = async () => {
      const SUBURBS = await loadSuburbsData();

      try {
        // First try to parse suburb from address
        const address = selectedProperty.address || '';
        console.log('Processing address:', address);

        // More robust postcode extraction
        const postcodeMatch = address.match(/\b(2\d{3})\b/); // NSW postcodes start with 2
        const postcode = postcodeMatch ? postcodeMatch[1] : null;

        // More robust suburb extraction
        let potentialSuburb = null;
        if (postcode && address) {
          const parts = address.split(',').map(part => part.trim());
          // Look for the part before the postcode
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].includes(postcode) && i > 0) {
              potentialSuburb = parts[i - 1].toUpperCase();
              break;
            }
          }
        }

        console.log('Address parsing results:', {
          address,
          postcode,
          potentialSuburb
        });

        // Validate against known suburbs
        if (potentialSuburb && SUBURBS[potentialSuburb] === postcode) {
          console.log('Found suburb from address:', potentialSuburb);
          setSuburb(potentialSuburb);
          return;
        }

        // Fallback to coordinates lookup with better error handling
        const coordinates = selectedProperty.geometry.rings[0][0];
        const lon = (coordinates[0] * 180) / 20037508.34;
        const lat = (Math.atan(Math.exp((coordinates[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90)

        console.log('Querying coordinates:', { lat, lon });

        const queryUrl = `https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Administrative_Boundaries/MapServer/0/query?` +
          `geometry=${lon},${lat}` +
          `&geometryType=esriGeometryPoint` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=suburbname` +
          `&returnGeometry=false` +
          `&f=json`;

        const response = await fetch(queryUrl);
        if (!response.ok) {
          throw new Error(`Suburb API failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Suburb API response:', data);

        if (data.features?.[0]?.attributes?.suburbname) {
          const suburbName = data.features[0].attributes.suburbname.toUpperCase();
          console.log('Found suburb from coordinates:', suburbName);
          setSuburb(suburbName);
          return;
        }

        console.warn('Could not determine suburb reliably');
        setSuburb(null);

      } catch (error) {
        console.error('Error determining suburb:', error);
        setSuburb(null);
      }
    };

    fetchSuburbData();
  }, [selectedProperty?.geometry, selectedProperty?.address]);

  /**
   * Render Logic
   * ===========
   * Component renders in following states:
   * 1. No property selected -> Shows alert
   * 2. Loading -> Shows spinner
   * 3. Error -> Shows error alert
   * 4. Data loaded -> Shows full analysis
   *    - Development types table
   *    - Feasibility analysis
   *    - Market analysis
   *    - Footnotes and data sources
   */

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
            <div className="space-y-1">
              <h2>
                {landApplicationLayer?.results?.[0]?.["EPI Name"] || "Local Environmental Plan"}
              </h2>
              <div className="text-base font-normal text-muted-foreground">
                Permitted residential development types in {zoneInfo?.zoneName}
              </div>
            </div>
          </CardTitle>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Street frontage: {streetFrontage?.total}m
            </div>
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

          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="neighbor-toggle"
              checked={includeNeighbors}
              onCheckedChange={setIncludeNeighbors}
            />
            <Label htmlFor="neighbor-toggle">Include data from neighboring councils</Label>
          </div>

          {includeNeighbors && neighboringLgas.length > 0 && (
            <div className="text-sm text-muted-foreground mb-4">
              <p>Including data from: {neighboringLgas.join(', ')}</p>
            </div>
          )}

          <div className="relative">
            {/* Header */}
            <div className="grid grid-cols-[300px_100px_100px_120px_100px_120px_120px_1fr] mb-3 border-b pb-2 text-xs">
              <div className="text-base">Dwelling Type</div>
              <div className="text-base text-center">Permissible</div>
              <div className="text-base text-center">
                Min.<br/>
                Frontage
              </div>
              <div className="text-base text-center">
                Median GFA<br/>
                (m²/Dwelling)
              </div>
              <div className="text-base text-center">
                Median<br/>
                Storeys
              </div>
              <div className="text-base text-center">
                Cost<br/>
                $/m² GFA
              </div>
              <div className="text-base text-center">
                Cost<br/>
                $/Dwelling
              </div>
              <div className="text-base">{/* Reserved for future columns */}</div>
            </div>

            {/* Development Types */}
            {residentialTypes.map((type) => {
              const isWithoutConsent = permittedUses.withoutConsent?.includes(type.name);
              const isWithConsent = permittedUses.withConsent?.includes(type.name);
              const frontageCheck = meetsStreetFrontageRequirement(
                type.name,
                zoneInfo?.zoneName?.split(' ')[0] || null,
                streetFrontage?.total || null
              );

              return (
                <div key={type.id}>
                  <div 
                    className="grid grid-cols-[300px_100px_100px_120px_100px_120px_120px_1fr] items-center py-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      const typeData = constructionData?.filter(cert => 
                        cert.development_type.some((dt: DevelopmentTypeRecord) => {
                          const devType = dt.DevelopmentType;
                          switch(type.name) {
                            case 'Dual Occupancies':
                              return devType === 'Dual occupancy' || 
                                     devType === 'Dual occupancy (attached)' || 
                                     devType === 'Dual occupancy (detached)';
                            case 'Dwelling Houses':
                              return devType === 'Dwelling' || 
                                     devType === 'Dwelling house';
                            case 'Multi Dwelling Housing':
                              return devType === 'Multi-dwelling housing' || 
                                     devType === 'Multi dwelling housing (terraces)' || 
                                     devType === 'Multi-dwelling housing (terraces)' ||
                                     devType === 'Medium Density Housing' ||
                                     devType === 'Manor house' || 
                                     devType === 'Attached dwelling' || 
                                     devType === 'Manor houses';
                            case 'Residential Flat Buildings':
                              return devType === 'Residential flat building';
                            case 'Shop Top Housing':
                              return devType === 'Shop top housing';
                            default:
                              return false;
                          }
                        })
                      );
                      setSelectedTypeData({
                        type: type.name,
                        icon: type.icon,
                        data: typeData || []
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <span className="whitespace-nowrap">{type.name}</span>
                    </div>
                    <div className="flex justify-center">
                      <StatusIcon status={isWithoutConsent ? 'withoutConsent' : isWithConsent ? 'withConsent' : 'notPermitted'} />
                    </div>
                    <div className="text-center">
                      {frontageCheck.required}m
                      {frontageCheck.meets ? 
                        <Check className="inline-block h-4 w-4 text-green-500 ml-1" /> : 
                        <X className="inline-block h-4 w-4 text-red-500 ml-1" />
                      }
                    </div>
                    <div className="text-sm text-center">
                      {type.averageGFA ? Math.round(type.averageGFA) : '-'}
                    </div>
                    <div className="text-sm text-center">
                      {type.medianStoreys || '-'}
                    </div>
                    <div className="text-center">
                      {type.medianCostPerSqm ? 
                        `$${Math.round(type.medianCostPerSqm).toLocaleString('en-US')}` : 
                        '-'}
                    </div>
                    <div className="text-sm text-center">
                      {type.medianCostPerDwelling ? 
                        type.medianCostPerDwelling >= 1000000 
                          ? `$${(type.medianCostPerDwelling / 1000000).toFixed(1)}M`
                          : `$${Math.round(type.medianCostPerDwelling / 1000)}k`
                        : '-'}
                    </div>
                    <div className="text-base">{/* Reserved for future columns */}</div>
                  </div>

                  {/* Render subtypes if they exist */}
                  {type.subTypes?.map(subType => (
                    <div key={subType.id} className="grid grid-cols-[300px_100px_100px_120px_100px_120px_120px_1fr] items-center py-2 pl-8 text-sm text-muted-foreground hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        {subType.icon}
                        <span>{subType.name}</span>
                      </div>
                      <div className="flex justify-center">
                        <StatusIcon status={isWithoutConsent ? 'withoutConsent' : isWithConsent ? 'withConsent' : 'notPermitted'} />
                      </div>
                      <div className="text-center">
                        {frontageCheck.required}m
                        {frontageCheck.meets ? 
                          <Check className="inline-block h-4 w-4 text-green-500 ml-1" /> : 
                          <X className="inline-block h-4 w-4 text-red-500 ml-1" />
                        }
                      </div>
                      <div className="text-center">
                        {subType.averageGFA ? Math.round(subType.averageGFA) : '-'}
                      </div>
                      <div className="text-center">
                        {subType.medianStoreys || '-'}
                      </div>
                      <div className="text-center">
                        {subType.medianCostPerSqm ? 
                          `$${Math.round(subType.medianCostPerSqm).toLocaleString('en-US')}` : 
                          '-'}
                      </div>
                      <div className="text-center">
                        {subType.medianCostPerDwelling ? 
                          subType.medianCostPerDwelling >= 1000000 
                            ? `$${(subType.medianCostPerDwelling / 1000000).toFixed(1)}M`
                            : `$${Math.round(subType.medianCostPerDwelling / 1000)}k`
                          : '-'}
                      </div>
                      <div className="text-base">{/* Reserved for future columns */}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Development Type Selection Card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
          <CardDescription>
            Select a development type to view recent sales data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedDevelopmentType}
            onValueChange={setSelectedDevelopmentType}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select development type" />
            </SelectTrigger>
            <SelectContent>
              {feasibleTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    {residentialTypes.find(rt => rt.id === type.id.split('-')[0])?.icon}
                    <span>
                      {type.name}
                      {type.subTypeName && ` - ${type.subTypeName}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sales Analysis Card */}
      {selectedDevelopmentType && medianPrices && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Recent Sales Analysis</CardTitle>
            <CardDescription>
              Median sale prices for {selectedDevelopmentType} in {suburb}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(medianPrices).map(([bedrooms, data]) => (
                <div 
                  key={bedrooms} 
                  className="space-y-2 cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors"
                  onClick={() => {
                    const selectedType = residentialTypes.find(
                      type => type.id === selectedDevelopmentType.split('-')[0]
                    );
                    setSelectedBedroomData({
                      bedrooms,
                      sales: data.sales,
                      icon: selectedType?.icon
                    });
                  }}
                >
                  <div className="text-sm font-medium">
                    {bedrooms === '>3' ? '4+ Beds' : `${bedrooms} Bed`}
                  </div>
                  <div className="text-2xl font-bold">
                    {data.count > 0
                      ? data.median >= 1000000 
                        ? `$${(data.median / 1000000).toFixed(1)}M`
                        : `$${Math.round(data.median / 1000)}k`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Median price ({data.count} sales)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {permittedUses.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          {permittedUses.error}
        </Alert>
      )}

      {/* Add Modal */}
      <Dialog 
        open={selectedBedroomData !== null} 
        onOpenChange={() => setSelectedBedroomData(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {/* Dialog Header */}
          <div className="mb-4">
            <DialogTitle className="flex items-center gap-2">
              {selectedBedroomData?.icon}
              {feasibleTypes.find(type => type.id === selectedDevelopmentType)?.name} - {' '}
              {selectedBedroomData?.bedrooms === '>3' ? '4+ Bedroom' : `${selectedBedroomData?.bedrooms} Bedroom`} Sales Data
            </DialogTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Suburb: {suburb}
            </div>
          </div>

          {/* Table Container */}
          <div className="relative border rounded-md">
            <div className="max-h-[calc(80vh-140px)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background z-10 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Address</th>
                    <th className="text-center px-4 py-3 font-medium w-[100px]">Price</th>
                    <th className="text-center px-4 py-3 font-medium w-[120px]">Sold Date</th>
                    <th className="text-center px-4 py-3 font-medium w-[60px]">
                      <Bed className="h-5 w-5 mx-auto" />
                    </th>
                    <th className="text-center px-4 py-3 font-medium w-[60px]">
                      <Bath className="h-5 w-5 mx-auto" />
                    </th>
                    <th className="text-center px-4 py-3 font-medium w-[60px]">
                      <Car className="h-5 w-5 mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedBedroomData?.sales
                    .filter(sale => formatDate(sale.sold_date) !== null)
                    .map((sale, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-3">{sale.address}</td>
                        <td className="text-center px-4 py-3">
                          {sale.price >= 1000000 
                            ? `$${(sale.price / 1000000).toFixed(1)}M`
                            : `$${Math.round(sale.price / 1000)}k`}
                        </td>
                        <td className="text-center px-4 py-3">{formatDate(sale.sold_date)}</td>
                        <td className="text-center px-4 py-3">{sale.bedrooms}</td>
                        <td className="text-center px-4 py-3">{sale.bathrooms}</td>
                        <td className="text-center px-4 py-3">{sale.parking}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add DialogDescription for accessibility */}
          <DialogDescription className="sr-only">
            List of recent property sales in {suburb}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
} 