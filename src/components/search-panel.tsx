import { useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, FileText, MousePointerClick, X, BookmarkPlus, Search } from "lucide-react";
import { loggedFetch } from '@/lib/api-logger';
import { convertToGeoJSON } from '@/lib/geometry-utils';
import type { Feature, Geometry } from 'geojson';

interface AddressSuggestion {
  address: string;
  propId: number;
  GURASID: number;
}

interface LotSuggestion {
  lot: string;
  cadId: string;
}


interface SearchPanelProps {
  onOpenSiteSearch?: () => void;
}

export function SearchPanel({ onOpenSiteSearch }: SearchPanelProps) {
  const [searchMode, setSearchMode] = useState<string>("address");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [lotSuggestions, setLotSuggestions] = useState<LotSuggestion[]>([]);
  const { selectedProperty, setSelectedProperty, addSavedProperty } = useMapStore();
  const mapSelectMode = useMapStore((state) => state.mapSelectMode);
  const setMapSelectMode = useMapStore((state) => state.setMapSelectMode);
  const setHeaderAddress = useMapStore((state) => state.setHeaderAddress);
  const toggleSiteSearch = useMapStore((state) => state.toggleSiteSearch);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) return;
    
    try {
      const data = await loggedFetch({
        url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?a=${encodeURIComponent(query)}&noOfRecords=10`
      });
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    }
  };

  const fetchLotSuggestions = async (query: string) => {
    if (query.length < 3) return;
    
    try {
      const data = await loggedFetch({
        url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?l=${encodeURIComponent(query)}&noOfRecords=10`
      });
      setLotSuggestions(data);
    } catch (error) {
      console.error("Error fetching lot suggestions:", error);
      setLotSuggestions([]);
    }
  };

  const fetchLotGeometry = async (lotId: string) => {
    try {
      console.log('Fetching lot geometry for:', lotId);
      
      // Convert the lot ID format from /-/ to // for the mapserver query
      // Example: '1/-/SP97243' becomes '1//SP97243'
      const formattedLotId = lotId.replace(/\/-\//g, '//');
      console.log('Formatted lot ID for query:', formattedLotId);
      
      // Manually construct the query string to avoid over-encoding the lot ID
      // URLSearchParams would encode // as %2F%2F, but we need it to stay as //
      const whereClause = `lotidstring='${formattedLotId}'`;
      const targetUrl = `https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query?where=${encodeURIComponent(whereClause).replace(/%2F/g, '/')}&outFields=*&returnGeometry=true&f=json`;
      
      console.log('Target URL:', targetUrl);
      
      // Use proxy with POST request format (matching other components in the codebase)
      const proxyUrl = 'https://proxy-server.jameswilliamstrutt.workers.dev';
      
      // Retry logic for the proxy request
      let data;
      for (let i = 0; i < 3; i++) {
        try {
          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              url: targetUrl,
              method: 'GET'
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          data = await response.json();
          
          // Check if the response is a string that needs parsing
          if (typeof data === 'string') {
            console.log('Response is string, parsing JSON...');
            data = JSON.parse(data);
          }
          
          break; // Success, exit retry loop
        } catch (error) {
          if (i === 2) throw error; // Last attempt failed
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Wait before retry
        }
      }
      
      console.log('Cadastre API response parsed successfully');
      console.log('Features found:', data.features?.length || 0);

      if (data.features && data.features.length > 0) {
        console.log('Found geometry for lot ID:', formattedLotId);
        console.log('Geometry data:', data.features[0].geometry);
        
        return {
          geometry: {
            rings: data.features[0].geometry.rings,
            spatialReference: data.features[0].geometry.spatialReference || { wkid: 3857 } // Default to EPSG:3857
          }
        };
      } else {
        console.log('No features found for lot ID:', formattedLotId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching lot geometry:", error);
      return null;
    }
  };

  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    if (searchMode === "address") {
      await fetchAddressSuggestions(value);
    } else {
      await fetchLotSuggestions(value);
    }
  };


  // Calculate centroid from polygon rings
  const calculateCentroid = (rings: number[][][]) => {
    let totalX = 0;
    let totalY = 0;
    let pointCount = 0;

    rings.forEach(ring => {
      ring.forEach((point: number[]) => {
        totalX += point[0];
        totalY += point[1];
        pointCount++;
      });
    });

    return {
      x: totalX / pointCount,
      y: totalY / pointCount
    };
  };

  // Simulate map click at lot centroid to get property data
  const fetchPropertyFromCentroid = async (centroid: { x: number; y: number }) => {
    try {
      console.log('Simulating map click at centroid:', centroid);
      
      const geometry = {
        spatialReference: {
          latestWkid: 3857,
          wkid: 102100
        },
        x: centroid.x,
        y: centroid.y
      };
      
      console.log('Geometry for property API:', geometry);
      
      const response = await loggedFetch({
        url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/property?geometry=${encodeURIComponent(JSON.stringify(geometry))}`
      });
      
      console.log('Property API response:', response);
      
      if (response) {
        // Handle both string and number responses
        const propId = typeof response === 'string' ? response.replace(/^"|"$/g, '') : response.toString();
        console.log('Found propId from centroid:', propId);
        
        // Now fetch all property details like the map click handler does
        const [boundaryResponse, lotsResponse, addressResponse] = await Promise.all([
          loggedFetch({
            url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/boundary?id=${propId}&Type=property`
          }),
          loggedFetch({
            url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${propId}`
          }),
          loggedFetch({
            url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${propId}&Type=property`
          })
        ]);

        const [boundaryData] = boundaryResponse;
        const lotsData = lotsResponse;
        const address = typeof addressResponse === 'string' ? addressResponse.replace(/^"|"$/g, '') : addressResponse.toString();

        console.log('Property details:', { boundaryData, lotsData, address });

        return {
          ...boundaryData,
          address: address,
          propId: propId,
          lots: lotsData || []
        };
      } else {
        console.log('No property found for centroid');
        return null;
      }
    } catch (error) {
      console.error('Error fetching property from centroid:', error);
      return null;
    }
  };

  const handleSelect = async (value: string) => {
    setSearchOpen(false);
    if (searchMode === "address") {
      const selected = suggestions.find(s => s.address === value);
      if (selected) {
        try {
          const boundaryData = await loggedFetch({
            url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/boundary?id=${selected.propId}&Type=property`
          });

          const lotsData = await loggedFetch({
            url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?propId=${selected.propId}`
          });

          if (boundaryData && boundaryData[0]?.geometry) {
            setSelectedProperty({
              ...boundaryData[0],
              address: selected.address,
              propId: selected.propId,
              lots: lotsData || []
            });
          }
        } catch (error) {
          console.error("Error fetching property boundary:", error);
          setSelectedProperty(null);
        }
      }
    } else {
      const selected = lotSuggestions.find(s => s.lot === value);
      if (selected) {
        console.log('Selected lot data:', selected);
        console.log('Lot string for geometry search:', selected.lot);
        
        const geometry = await fetchLotGeometry(selected.lot);
        if (geometry) {
          console.log('Successfully retrieved lot geometry');
          
          // Calculate centroid of the lot geometry
          const centroid = calculateCentroid(geometry.geometry.rings);
          console.log('Lot centroid:', centroid);
          
          // Simulate map click at centroid to get full property data
          const propertyData = await fetchPropertyFromCentroid(centroid);
          
          if (propertyData) {
            console.log('Successfully retrieved property data from centroid');
            setSelectedProperty(propertyData);
          } else {
            console.log('No property found for centroid, using lot geometry only');
            setSelectedProperty({
              ...geometry,
              address: selected.lot,
              lots: [{
                attributes: {
                  LotDescription: selected.lot
                }
              }]
            });
          }
        } else {
          console.error('No geometry data found for lot:', selected.lot);
          // You could add error state handling here if needed
        }
      }
    }
    setSearchValue("");
  };

  const handleOpenSiteSearch = () => {
    toggleSiteSearch();
    onOpenSiteSearch?.();
  };

  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container p-2 search-panel-container">
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={searchMode} onValueChange={(value) => {
            if (value) {
              setSearchMode(value);
              setSearchValue("");
              setSuggestions([]);
              setLotSuggestions([]);
              setSelectedProperty(null);
            }
          }} className="flex-shrink-0">
            <ToggleGroupItem value="address" aria-label="Search by address">
              <MapPin className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="lot" aria-label="Search by lot">
              <FileText className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex-grow">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={searchOpen} 
                  className="w-full md:w-[400px] justify-between text-left"
                >
                  {selectedProperty?.address || searchValue || `Search by ${searchMode}...`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder={`Search by ${searchMode}...`}
                    value={searchValue}
                    onValueChange={handleSearchChange}
                  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {searchMode === "address" ? (
                        suggestions.map((suggestion) => (
                          <CommandItem
                            key={`${suggestion.propId}-${suggestion.GURASID}`}
                            value={suggestion.address}
                            onSelect={handleSelect}
                          >
                            {suggestion.address}
                          </CommandItem>
                        ))
                      ) : (
                        lotSuggestions.map((lot) => (
                          <CommandItem
                            key={lot.cadId}
                            value={lot.lot}
                            onSelect={handleSelect}
                          >
                            {lot.lot}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap"
            onClick={handleOpenSiteSearch}
          >
            <Search className="h-4 w-4" />
            Site Search
          </Button>

          <Button
            variant={mapSelectMode ? "default" : "outline"}
            size="sm"
            className="hidden md:flex gap-2 whitespace-nowrap"
            onClick={() => setMapSelectMode(!mapSelectMode)}
          >
            <MousePointerClick className="h-4 w-4" />
            Search on map
          </Button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSelectedProperty(null);
                setHeaderAddress(null);
              }}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap"
              onClick={() => {
                if (!selectedProperty) return;
                
                const geojson = convertToGeoJSON(selectedProperty.geometry);
                if (!geojson) return;
                
                const savedProperty = {
                  id: selectedProperty.propId?.toString() || crypto.randomUUID(),
                  address: selectedProperty.address || 'Unknown Address',
                  geometry: {
                    type: 'Feature' as const,
                    geometry: geojson.geometry as Geometry,
                    properties: {}
                  } as Feature
                };
                
                addSavedProperty(savedProperty);
              }}
              disabled={!selectedProperty}
            >
              <BookmarkPlus className="h-4 w-4" />
              Save property
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}