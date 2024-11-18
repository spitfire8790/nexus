import { useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, FileText } from "lucide-react";
import { loggedFetch } from '@/lib/api-logger';

interface AddressSuggestion {
  address: string;
  propId: number;
  GURASID: number;
}

interface LotSuggestion {
  lot: string;
  cadId: string;
}

export function SearchPanel() {
  const [searchMode, setSearchMode] = useState<string>("address");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [lotSuggestions, setLotSuggestions] = useState<LotSuggestion[]>([]);
  const { selectedProperty, setSelectedProperty } = useMapStore();

  const displayValue = selectedProperty?.address || searchValue || `Search by ${searchMode}...`;

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
      
      const query = {
        where: `lotidstring='${formattedLotId}'`,
        outFields: '*',
        returnGeometry: true,
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

  return (
    <div className="h-full bg-card flex items-center px-4">
      <div className="flex gap-2 items-center">
        <ToggleGroup type="single" value={searchMode} onValueChange={(value) => {
          if (value) {
            setSearchMode(value);
            setSearchValue("");
            setSuggestions([]);
            setLotSuggestions([]);
            setSelectedProperty(null);
          }
        }}>
          <ToggleGroupItem value="address" aria-label="Search by address">
            <MapPin className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="lot" aria-label="Search by lot">
            <FileText className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={searchOpen} 
              className="w-[400px] justify-between text-left"
            >
              {displayValue}
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
    </div>
  );
}