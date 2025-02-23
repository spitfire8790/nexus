import { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';

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

const ENDPOINTS = {
  suburbs: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/1',
  lgas: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/3',
  lgaToCouncil: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/1',
  properties: 'https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Common/Admin_3857/MapServer/11'
};

export function SiteSearchPanel() {
  const [availableSuburbs, setAvailableSuburbs] = useState<string[]>([]);
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    suburbs: [],
    lgas: [],
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [councilNames, setCouncilNames] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  const setSelectedProperty = useMapStore((state) => state.setSelectedProperty);
  const setMapBounds = useMapStore((state) => state.setMapBounds);

  // Fetch available suburbs and LGAs on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Fetch distinct suburbs
        const suburbsResponse = await loggedFetch({
          url: `${ENDPOINTS.suburbs}/query?where=1=1&outFields=SUBURBNAME&returnGeometry=false&returnDistinctValues=true&f=json`
        });

        if (suburbsResponse.error) {
          console.error('Error fetching suburbs:', suburbsResponse.error);
          return;
        }

        const suburbs = (suburbsResponse.features || [])
          .map((f: any) => f.attributes?.SUBURBNAME)
          .filter(Boolean)
          .sort();
        setAvailableSuburbs(suburbs);

        // Fetch distinct LGAs
        const lgasResponse = await loggedFetch({
          url: `${ENDPOINTS.lgas}/query?where=1=1&outFields=LGANAME&returnGeometry=false&returnDistinctValues=true&f=json`
        });

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
      }
    };

    fetchLocations();
  }, []);

  // Convert LGA names to council names
  useEffect(() => {
    const fetchCouncilNames = async () => {
      if (criteria.lgas.length === 0) return;

      try {
        const lgaList = criteria.lgas.map(lga => `'${lga}'`).join(',');
        const response = await loggedFetch({
          url: `${ENDPOINTS.lgaToCouncil}/query?where=LGANAME IN (${lgaList})&outFields=LGANAME,COUNCILNAME&f=json`
        });

        const newCouncilNames = response.features.reduce((acc: Record<string, string>, feature: any) => {
          acc[feature.attributes.LGANAME] = feature.attributes.COUNCILNAME;
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
      conditions.push(`SUBURBNAME IN (${suburbList})`);
    }

    // Add council conditions
    if (Object.keys(councilNames).length > 0) {
      const councilList = Object.values(councilNames).map(c => `'${c}'`).join(',');
      conditions.push(`COUNCIL IN (${councilList})`);
    }

    // Add area conditions (convert m² to hectares)
    if (criteria.area?.min) {
      conditions.push(`AREA_H >= ${criteria.area.min / 10000}`);
    }
    if (criteria.area?.max) {
      conditions.push(`AREA_H <= ${criteria.area.max / 10000}`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const whereClause = buildWhereClause();
      
      console.log('Search query:', whereClause); // Debug log

      const response = await loggedFetch({
        url: `${ENDPOINTS.properties}/query?where=${encodeURIComponent(whereClause)}&outFields=OBJECTID,PROPERTYID,FULLADDRESS,SUBURBNAME,COUNCIL,AREA_H&returnGeometry=true&outSR=3857&f=json`
      });

      console.log('Search response:', response); // Debug log

      if (!response.features) {
        setResults([]);
        return;
      }

      const transformedResults = response.features.map((feature: any) => ({
        id: feature.attributes.PROPERTYID || feature.attributes.OBJECTID,
        address: feature.attributes.FULLADDRESS || 'N/A',
        area: Math.round(feature.attributes.AREA_H * 10000), // Convert hectares to m²
        suburb: feature.attributes.SUBURBNAME,
        council: feature.attributes.COUNCIL,
        geometry: feature.geometry
      }));

      setResults(transformedResults);
      setCurrentPage(1);

      // Update map bounds to show all results
      if (transformedResults.length > 0) {
        setMapBounds(transformedResults.map((result: SearchResult) => result.geometry));
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

  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(results.length / itemsPerPage);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Suburbs</label>
          <Select
            onValueChange={(value) => setCriteria(prev => ({
              ...prev,
              suburbs: [...prev.suburbs, value]
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select suburbs" />
            </SelectTrigger>
            <SelectContent>
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
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {criteria.suburbs.map(suburb => (
              <Badge key={suburb} variant="secondary">
                {suburb}
                <button
                  className="ml-1"
                  onClick={() => setCriteria(prev => ({
                    ...prev,
                    suburbs: prev.suburbs.filter(s => s !== suburb)
                  }))}
                  aria-label={`Remove ${suburb}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Local Government Areas</label>
          <Select
            onValueChange={(value) => setCriteria(prev => ({
              ...prev,
              lgas: [...prev.lgas, value]
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select LGAs" />
            </SelectTrigger>
            <SelectContent>
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
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {criteria.lgas.map(lga => (
              <Badge key={lga} variant="secondary">
                {lga}
                <button
                  className="ml-1"
                  onClick={() => setCriteria(prev => ({
                    ...prev,
                    lgas: prev.lgas.filter(l => l !== lga)
                  }))}
                  aria-label={`Remove ${lga}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Area Range (m²)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              onChange={(e) => setCriteria(prev => ({
                ...prev,
                area: { ...prev.area, min: Number(e.target.value) || undefined }
              }))}
            />
            <Input
              type="number"
              placeholder="Max"
              onChange={(e) => setCriteria(prev => ({
                ...prev,
                area: { ...prev.area, max: Number(e.target.value) || undefined }
              }))}
            />
          </div>
        </div>

        <Button 
          onClick={handleSearch} 
          className="w-full"
          disabled={isLoading || (
            criteria.suburbs.length === 0 && 
            criteria.lgas.length === 0 && 
            !criteria.area?.min && 
            !criteria.area?.max
          )}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Suburb</TableHead>
                <TableHead>Council</TableHead>
                <TableHead>Area (m²)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((result) => (
                <TableRow 
                  key={result.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleResultClick(result)}
                >
                  <TableCell>{result.address}</TableCell>
                  <TableCell>{result.suburb}</TableCell>
                  <TableCell>{result.council}</TableCell>
                  <TableCell>{result.area.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 