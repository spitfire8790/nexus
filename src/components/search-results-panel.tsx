import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMapStore } from '@/lib/map-store';
import { ArrowLeft, ArrowRight, ArrowUpDown, Copy, Check } from 'lucide-react';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import type { SearchResult } from './site-search-panel';

type SortField = 'address' | 'suburb' | 'council' | 'area';
type SortDirection = 'asc' | 'desc';

function LotsList({ lots }: { lots: string[] }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(lots.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show first few lots that fit in one line, then "... + X more"
  const truncatedLots = useMemo(() => {
    if (!lots.length) return '';
    let result = lots[0];
    let i = 1;
    
    while (i < lots.length) {
      const nextText = result + ', ' + lots[i];
      if (nextText.length > 50) break; // Approximate length for one line
      result = nextText;
      i++;
    }
    
    if (i < lots.length) {
      result += ` (+ ${lots.length - i} more)`;
    }
    
    return result;
  }, [lots]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-left max-w-full truncate">
          {truncatedLots}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[500px] p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">All Lots</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-sm whitespace-normal">
              {lots.join(', ')}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SearchResultsPanel() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredResult, setHoveredResult] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('address');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const resultsLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoadingLots, setIsLoadingLots] = useState<Record<string, boolean>>({});
  const [fetchQueue, setFetchQueue] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const boundsSetRef = useRef<string | null>(null);
  const itemsPerPage = 10;

  const results = useMapStore((state) => state.searchResults);
  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
  const map = useMapStore((state) => state.mapInstance);

  // Handle initial map bounds - only when results first load
  useEffect(() => {
    if (!map || !results?.length) return;
    
    // Create a unique identifier for this set of results
    const resultsKey = results.map(r => r.id).join('-');
    
    // Only fit bounds if this is a new set of results
    if (boundsSetRef.current !== resultsKey) {
      const bounds = L.latLngBounds([]);
      results.forEach(result => {
        if (result.geometry?.rings?.[0]) {
          const coords = result.geometry.rings[0].map((coord: number[]) => {
            const point = L.point(coord[0], coord[1]);
            const latLng = L.CRS.EPSG3857.unproject(point);
            bounds.extend(latLng);
            return latLng;
          });
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
        // Mark that we've set bounds for this set of results
        boundsSetRef.current = resultsKey;
      }
    }
  }, [map, results]);

  // Handle map overlays and hover effects
  useEffect(() => {
    if (!map) return;

    // Clear existing results layer
    if (resultsLayerRef.current) {
      map.removeLayer(resultsLayerRef.current);
    }
    resultsLayerRef.current = L.layerGroup().addTo(map);

    if (!results?.length) return;

    results.forEach(result => {
      if (result.geometry?.rings?.[0]) {
        const coords = result.geometry.rings[0].map((coord: number[]) => {
          const point = L.point(coord[0], coord[1]);
          const latLng = L.CRS.EPSG3857.unproject(point);
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
            hoveredResult === result.id ? 'fill-opacity-30' : 'fill-opacity-10'
          )
        });

        resultsLayerRef.current?.addLayer(polygon);
      }
    });

    return () => {
      if (resultsLayerRef.current && map) {
        map.removeLayer(resultsLayerRef.current);
      }
    };
  }, [map, results, hoveredResult]);

  // Sort results
  const sortedResults = useMemo(() => {
    if (!results) return [];
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
  }, [sortedResults, currentPage]);

  // Reset queue when page changes
  useEffect(() => {
    setFetchQueue([]);
    setIsLoadingLots({});
    setIsFetching(false);
  }, [currentPage]);

  // Queue visible results that need lots
  useEffect(() => {
    const visibleIds = paginatedResults
      ?.filter(result => !result.lots && !fetchQueue.includes(result.id))
      .map(result => result.id) || [];

    if (visibleIds.length > 0) {
      setFetchQueue(prev => [...prev, ...visibleIds]);
    }
  }, [paginatedResults, fetchQueue]);

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      if (isFetching || fetchQueue.length === 0) return;

      setIsFetching(true);
      const propId = fetchQueue[0];
      
      try {
        setIsLoadingLots(prev => ({ ...prev, [propId]: true }));
        const response = await fetch(`https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${propId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const lots = data.map((lot: { attributes: { LotDescription: string } }) => lot.attributes.LotDescription);
        
        const updatedResults = results?.map(r => 
          r.id === propId ? { ...r, lots } : r
        );
        
        if (updatedResults) {
          useMapStore.setState({ searchResults: updatedResults });
        }

        // Wait 1 second before processing next item
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error fetching lot information:', error);
      } finally {
        setIsLoadingLots(prev => ({ ...prev, [propId]: false }));
        setFetchQueue(prev => prev.slice(1));
        setIsFetching(false);
      }
    };

    processQueue();
  }, [fetchQueue, isFetching, results]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

    // Zoom to the selected property only
    if (map && result.geometry.rings?.[0]) {
      const bounds = L.latLngBounds([]);
      const coords = result.geometry.rings[0].map((coord: number[]) => {
        const point = L.point(coord[0], coord[1]);
        const latLng = L.CRS.EPSG3857.unproject(point);
        bounds.extend(latLng);
        return latLng;
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const totalPages = Math.ceil((results?.length || 0) / itemsPerPage);

  if (!results?.length) return null;

  return (
    <div className="h-auto flex flex-col">
      <div className="p-2 border-b flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="text-xs text-muted-foreground">
          Found {results.length.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} result{results.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="overflow-y-auto border-b">
            <Table className="text-xs w-full">
              <TableHeader className="sticky top-0 bg-black z-10">
                <TableRow className="hover:bg-black/90">
                  <TableHead className="py-2 h-7 w-[30%]">
                    <button 
                      onClick={() => handleSort('address')}
                      className="flex items-center gap-2 text-white hover:text-white/90"
                    >
                      Address
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2 h-7 w-[15%]">
                    <button 
                      onClick={() => handleSort('suburb')}
                      className="flex items-center gap-2 text-white hover:text-white/90"
                    >
                      Suburb
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2 h-7 w-[20%]">
                    <button 
                      onClick={() => handleSort('council')}
                      className="flex items-center gap-2 text-white hover:text-white/90"
                    >
                      Council
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2 h-7 w-[15%]">
                    <button 
                      onClick={() => handleSort('area')}
                      className="flex items-center gap-2 text-white hover:text-white/90"
                    >
                      Area (m²)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="py-2 h-7 w-[20%]">
                    <span className="text-white">Lots</span>
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
                    <TableCell className="py-1 h-7">{result.address}</TableCell>
                    <TableCell className="py-1 h-7">{result.suburb}</TableCell>
                    <TableCell className="py-1 h-7">{result.council}</TableCell>
                    <TableCell className="py-1 h-7">{result.area.toLocaleString()}</TableCell>
                    <TableCell className="py-1 h-7">
                      {isLoadingLots[result.id] ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : result.lots?.length ? (
                        <LotsList lots={result.lots} />
                      ) : (
                        <span className="text-muted-foreground">No lots found</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="p-2 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="shadow-sm hover:shadow-md transition-shadow text-xs h-7"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="shadow-sm hover:shadow-md transition-shadow text-xs h-7"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-3 w-3 ml-2" />
        </Button>
      </div>
    </div>
  );
} 