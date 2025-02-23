import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Map as MapIcon,
  ArrowUpDown
} from 'lucide-react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchCriteria {
  suburbs: string[];
  lgas: string[];
  area?: { min?: number; max?: number };
}

interface SearchResult {
  id: string;
  address: string;
  area: number;
  suburb: string;
  council: string;
  geometry: {
    rings?: number[][][];
    paths?: number[][][];
    points?: number[][];
  };
}

type SortField = 'address' | 'suburb' | 'council' | 'area';
type SortDirection = 'asc' | 'desc';

const ENDPOINTS = {
  suburbs: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/1',
  lgas: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/3',
  lgaToCouncil: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/1',
  properties: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/11'
};

export function SiteSearchPanel() {
  const [availableSuburbs, setAvailableSuburbs] = useState<string[]>([]);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    suburbs: [],
    lgas: [],
    area: { min: undefined, max: undefined }
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [councilNames, setCouncilNames] = useState<Record<string, string>>({});
  const [hoveredResult, setHoveredResult] = useState<string | null>(null);
  const resultsLayerRef = useRef<L.LayerGroup | null>(null);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState<SortField>('address');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
  const setMapBounds = useMapStore((state) => state.setMapBounds);
  const map = useMapStore((state) => state.mapInstance);

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

    console.log('Search criteria:', criteria); // Debug log for criteria
    console.log('Council names:', councilNames); // Debug log for council names

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

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    console.log('Generated WHERE clause:', whereClause); // Debug log for final WHERE clause
    return whereClause;
  };

  // Sort results
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'area':
          return (a.area - b.area) * direction;
        case 'address':
          return a.address.localeCompare(b.address) * direction;
        case 'suburb':
          return a.suburb.localeCompare(b.suburb) * direction;
        case 'council':
          return a.council.localeCompare(b.council) * direction;
        default:
          return 0;
      }
    });
  }, [results, sortField, sortDirection]);

  const paginatedResults = useMemo(() => {
    return sortedResults.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedResults, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Remove the debounced search and searchTimeoutRef
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      
      // Clear existing results layer
      if (resultsLayerRef.current && map) {
        map.removeLayer(resultsLayerRef.current);
      }
      resultsLayerRef.current = L.layerGroup().addTo(map!);

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
        setResults([]);
        return;
      }

      // Process results
      const uniqueResults = new Map();
      const bounds = L.latLngBounds([]);
      
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

          if (map && feature.geometry?.rings?.[0]) {
            const coords = feature.geometry.rings[0].map((coord: number[]) => {
              const point = L.point(coord[0], coord[1]);
              const latLng = L.CRS.EPSG3857.unproject(point);
              bounds.extend(latLng);
              return latLng;
            });

            const polygon = L.polygon(coords, {
              color: '#3b82f6',
              weight: 2,
              opacity: 0.8,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              className: cn(
                'transition-all duration-200 ease-in-out',
                hoveredResult === propId ? 'fill-opacity-30' : 'fill-opacity-10'
              )
            });

            resultsLayerRef.current?.addLayer(polygon);
          }
        }
      });

      const transformedResults = Array.from(uniqueResults.values());
      setResults(transformedResults);
      setCurrentPage(1);

      if (bounds.isValid()) {
        map?.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error performing site search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (!result.geometry) return;

    setSelectedProperty({
      geometry: result.geometry,
      address: result.address,
      propId: result.id,
      lots: [{
        attributes: {
          LotDescription: result.address
        }
      }]
    });
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="space-y-4">
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

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Area Range (m²)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={criteria.area?.min || ''}
              onChange={(e) => setCriteria(prev => ({
                ...prev,
                area: { ...prev.area, min: e.target.value ? Number(e.target.value) : undefined }
              }))}
            />
            <Input
              type="number"
              placeholder="Max"
              value={criteria.area?.max || ''}
              onChange={(e) => setCriteria(prev => ({
                ...prev,
                area: { ...prev.area, max: e.target.value ? Number(e.target.value) : undefined }
              }))}
            />
          </div>
        </div>

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

      {results.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          <div className="flex-1 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('address')}
                      className="flex items-center gap-2 hover:text-accent-foreground"
                    >
                      Address
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('suburb')}
                      className="flex items-center gap-2 hover:text-accent-foreground"
                    >
                      Suburb
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('council')}
                      className="flex items-center gap-2 hover:text-accent-foreground"
                    >
                      Council
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button 
                      onClick={() => handleSort('area')}
                      className="flex items-center gap-2 hover:text-accent-foreground"
                    >
                      Area (m²)
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow 
                    key={result.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setHoveredResult(result.id)}
                    onMouseLeave={() => setHoveredResult(null)}
                  >
                    <TableCell>{result.address}</TableCell>
                    <TableCell>{result.suburb}</TableCell>
                    <TableCell>{result.council}</TableCell>
                    <TableCell>{result.area.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4 px-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 