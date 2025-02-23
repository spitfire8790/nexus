import { useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, FileText, MousePointerClick, X, MessageCircle, BookmarkPlus, Search } from "lucide-react";
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

interface QueryParams extends Record<string, string> {
  where: string;
  outFields: string;
  returnGeometry: string;
  f: string;
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
  const toggleChat = useMapStore((state) => state.toggleChat);
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
      const formattedLotId = lotId.replace(/-/g, '/');
      
      const query: QueryParams = {
        where: `lotidstring='${formattedLotId}'`,
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      };

      const params = new URLSearchParams(query);
      const data = await loggedFetch({
        url: `https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query?${params}`
      });
      
      if (data.features && data.features.length > 0) {
        return {
          geometry: {
            rings: data.features[0].geometry.rings,
            spatialReference: data.features[0].geometry.spatialReference
          }
        };
      }
      return null;
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
        const geometry = await fetchLotGeometry(selected.lot);
        if (geometry) {
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

            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap"
              onClick={() => toggleChat()}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}