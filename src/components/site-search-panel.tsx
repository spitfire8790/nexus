import { useState, useEffect, useRef, memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMapStore } from '@/lib/map-store';
import { loggedFetch } from '@/lib/api-logger';
import { 
  X, 
  Search, 
  MapPin, 
  Building2, 
  Loader2,
  Map as MapIcon,
} from 'lucide-react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchCriteria {
  suburbs: string[];
  lgas: string[];
  area?: { min?: number; max?: number };
}

export interface SearchResult {
  id: string;
  address: string;
  area: number;
  suburb: string;
  council: string;
  lots?: string[];
  geometry: {
    rings?: number[][][];
    paths?: number[][][];
    points?: number[][];
  };
}

const ENDPOINTS = {
  suburbs: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/1',
  lgas: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/3',
  lgaToCouncil: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/1',
  properties: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/11'
};

const AreaRangeInputs = memo(({ onAreaChange }: { 
  onAreaChange: (min: number | undefined, max: number | undefined) => void 
}) => {
  const [min, setMin] = useState<string>('');
  const [max, setMax] = useState<string>('');

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMin(value);
    onAreaChange(value ? Number(value) : undefined, max ? Number(max) : undefined);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMax(value);
    onAreaChange(min ? Number(min) : undefined, value ? Number(value) : undefined);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <MapIcon className="h-4 w-4" />
        Area Range (m²)
      </label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={handleMinChange}
        />
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={handleMaxChange}
        />
      </div>
    </div>
  );
});

AreaRangeInputs.displayName = 'AreaRangeInputs';

export function SiteSearchPanel() {
  const [availableSuburbs, setAvailableSuburbs] = useState<string[]>([]);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    suburbs: [],
    lgas: [],
    area: { min: undefined, max: undefined }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [councilNames, setCouncilNames] = useState<Record<string, string>>({});

  const toggleSiteSearch = useMapStore((state) => state.toggleSiteSearch);
  const setSearchResults = useMapStore((state) => state.setSearchResults);

  const handleAreaChange = (min: number | undefined, max: number | undefined) => {
    setCriteria(prev => ({
      ...prev,
      area: { min, max }
    }));
  };

  // Fetch available suburbs and LGAs on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const fetchAllSuburbs = async () => {
          let allSuburbs: string[] = [];
          let resultOffset = 0;
          const recordsPerRequest = 1000;
          
          while (true) {
            const suburbsResponse = await loggedFetch({
              url: `${ENDPOINTS.suburbs}/query?where=1=1&outFields=SUBURBNAME&returnGeometry=false&returnDistinctValues=true&resultOffset=${resultOffset}&resultRecordCount=${recordsPerRequest}&orderByFields=SUBURBNAME&f=json`
            });

            if (suburbsResponse.error) {
              console.error('Error fetching suburbs:', suburbsResponse.error);
              break;
            }

            const suburbs = (suburbsResponse.features || [])
              .map((f: any) => f.attributes?.SUBURBNAME)
              .filter(Boolean);
            
            allSuburbs = [...allSuburbs, ...suburbs];

            if (!suburbsResponse.exceededTransferLimit) {
              break;
            }
            
            resultOffset += recordsPerRequest;
          }

          return allSuburbs.sort();
        };

        const [suburbs, lgasResponse] = await Promise.all([
          fetchAllSuburbs(),
          loggedFetch({
            url: `${ENDPOINTS.lgas}/query?where=1=1&outFields=LGANAME&returnGeometry=false&returnDistinctValues=true&f=json`
          })
        ]);

        setAvailableSuburbs(suburbs);

        if (lgasResponse.error) {
          console.error('Error fetching LGAs:', lgasResponse.error);
          return;
        }

        const lgas = (lgasResponse.features || [])
          .map((f: any) => f.attributes?.LGANAME)
          .filter(Boolean)
          .sort();
        setAvailableLGAs(lgas);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Convert LGA names to council names
  useEffect(() => {
    const fetchCouncilNames = async () => {
      if (criteria.lgas.length === 0) return;

      try {
        // First get the exact council name format from the properties layer
        const lgaList = criteria.lgas.map(lga => `'${lga}'`).join(',');
        const councilResponse = await loggedFetch({
          url: `${ENDPOINTS.properties}/query?where=1=1&outFields=GURAS_DELIVERY.SDE.ADDRESSSTRING.COUNCIL&returnGeometry=false&returnDistinctValues=true&f=json`
        });

        // Get all possible council names
        const availableCouncilNames = (councilResponse.features || [])
          .map((f: any) => f.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.COUNCIL'])
          .filter(Boolean);

        // Now get the LGA to council mapping
        const response = await loggedFetch({
          url: `${ENDPOINTS.lgaToCouncil}/query?where=LGANAME IN (${lgaList})&outFields=LGANAME,COUNCILNAME&f=json`
        });

        // Match the council names to the exact format from the properties layer
        const newCouncilNames = response.features.reduce((acc: Record<string, string>, feature: any) => {
          const lgaName = feature.attributes.LGANAME;
          const councilName = feature.attributes.COUNCILNAME;
          
          // Find the exact match in available council names
          const exactCouncilName = availableCouncilNames.find((name: string) => 
            name.toLowerCase().includes(councilName.toLowerCase()) ||
            councilName.toLowerCase().includes(name.toLowerCase())
          );

          if (exactCouncilName) {
            acc[lgaName] = exactCouncilName;
          }
          return acc;
        }, {});

        setCouncilNames(newCouncilNames);
      } catch (error) {
        console.error('Error fetching council names:', error);
      }
    };

    fetchCouncilNames();
  }, [criteria.lgas]);

  const buildWhereClause = () => {
    const conditions: string[] = [];

    // Add suburb conditions
    if (criteria.suburbs.length > 0) {
      const suburbList = criteria.suburbs.map(s => `'${s}'`).join(',');
      conditions.push(`GURAS_DELIVERY.SDE.ADDRESSSTRING.SUBURBNAME IN (${suburbList})`);
    }

    // Add council conditions
    if (Object.keys(councilNames).length > 0) {
      const councilList = Object.values(councilNames).map(name => `'${name}'`).join(',');
      conditions.push(`GURAS_DELIVERY.SDE.ADDRESSSTRING.COUNCIL IN (${councilList})`);
    }

    // Add area conditions (convert m² to hectares)
    if (criteria.area?.min) {
      conditions.push(`GURAS_DELIVERY.SDE.Property.AREA_H >= ${criteria.area.min / 10000}`);
    }
    if (criteria.area?.max) {
      conditions.push(`GURAS_DELIVERY.SDE.Property.AREA_H <= ${criteria.area.max / 10000}`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      
      const whereClause = buildWhereClause();
      
      // Initialize results collection
      const allFeatures: any[] = [];
      let resultOffset = 0;
      const recordsPerRequest = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await loggedFetch({
          url: `${ENDPOINTS.properties}/query?where=${encodeURIComponent(whereClause)}&outFields=*&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryPolygon&inSR=102100&outSR=102100&resultOffset=${resultOffset}&resultRecordCount=${recordsPerRequest}&f=json`
        });

        if (!response.features?.length) {
          break;
        }

        allFeatures.push(...response.features);
        hasMore = response.exceededTransferLimit;
        resultOffset += recordsPerRequest;
      }

      if (allFeatures.length === 0) {
        setSearchResults([]);
        return;
      }

      // Process results
      const uniqueResults = new Map();
      
      allFeatures.forEach((feature: any) => {
        const propId = feature.attributes['GURAS_DELIVERY.SDE.Property.PROPID'];
        if (!uniqueResults.has(propId)) {
          const result = {
            id: propId,
            address: [
              feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.HOUSENUMBERFIRST'],
              feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.ROADNAME'],
              feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.ROADTYPE'],
              feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.SUBURBNAME']
            ].filter(Boolean).join(' '),
            area: Math.round((feature.attributes['GURAS_DELIVERY.SDE.Property.AREA_H'] || 0) * 10000),
            suburb: feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.SUBURBNAME'],
            council: feature.attributes['GURAS_DELIVERY.SDE.ADDRESSSTRING.COUNCIL'],
            geometry: feature.geometry
          };

          uniqueResults.set(propId, result);
        }
      });

      const transformedResults = Array.from(uniqueResults.values());
      setSearchResults(transformedResults);
    } catch (error) {
      console.error('Error performing site search:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Suburbs
              </label>
              <Select
                disabled={isLoadingLocations}
                onValueChange={(value) => setCriteria(prev => ({
                  ...prev,
                  suburbs: [...prev.suburbs, value]
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingLocations ? "Loading suburbs..." : "Select suburbs"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLocations ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      {availableSuburbs.map(suburb => (
                        <SelectItem 
                          key={suburb} 
                          value={suburb}
                          disabled={criteria.suburbs.includes(suburb)}
                        >
                          {suburb}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  )}
                </SelectContent>
              </Select>
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {criteria.suburbs.map(suburb => (
                    <motion.div
                      key={suburb}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge variant="secondary" className="shadow-sm">
                        {suburb}
                        <button
                          className="ml-1 hover:text-destructive transition-colors"
                          onClick={() => setCriteria(prev => ({
                            ...prev,
                            suburbs: prev.suburbs.filter(s => s !== suburb)
                          }))}
                          aria-label={`Remove ${suburb}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Local Government Areas
              </label>
              <Select
                disabled={isLoadingLocations}
                onValueChange={(value) => setCriteria(prev => ({
                  ...prev,
                  lgas: [...prev.lgas, value]
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingLocations ? "Loading LGAs..." : "Select LGAs"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLocations ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      {availableLGAs.map(lga => (
                        <SelectItem 
                          key={lga} 
                          value={lga}
                          disabled={criteria.lgas.includes(lga)}
                        >
                          {lga}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  )}
                </SelectContent>
              </Select>
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {criteria.lgas.map(lga => (
                    <motion.div
                      key={lga}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge variant="secondary" className="shadow-sm">
                        {lga}
                        <button
                          className="ml-1 hover:text-destructive transition-colors"
                          onClick={() => setCriteria(prev => ({
                            ...prev,
                            lgas: prev.lgas.filter(l => l !== lga)
                          }))}
                          aria-label={`Remove ${lga}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            <AreaRangeInputs onAreaChange={handleAreaChange} />

            <Button 
              onClick={handleSearch} 
              className="w-full shadow-sm hover:shadow-md transition-shadow"
              disabled={isLoading || isLoadingLocations || (
                criteria.suburbs.length === 0 && 
                criteria.lgas.length === 0 && 
                !criteria.area?.min && 
                !criteria.area?.max
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 