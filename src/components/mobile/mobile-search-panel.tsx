import { useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { MapPin, FileText } from "lucide-react";
import { loggedFetch } from '@/lib/api-logger';

export function MobileSearchPanel({ onSelect }: { onSelect?: () => void }) {
  const [searchMode, setSearchMode] = useState<string>("address");
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [lotSuggestions, setLotSuggestions] = useState([]);
  const { selectedProperty, setSelectedProperty } = useMapStore();

  // Reuse the existing fetch and handle functions from SearchPanel
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    if (searchMode === "address") {
      if (value.length < 3) return;
      try {
        const data = await loggedFetch({
          url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?a=${encodeURIComponent(value)}&noOfRecords=10`
        });
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      }
    } else {
      // Lot search logic
      if (value.length < 3) return;
      try {
        const data = await loggedFetch({
          url: `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/lot?l=${encodeURIComponent(value)}&noOfRecords=10`
        });
        setLotSuggestions(data);
      } catch (error) {
        console.error("Error fetching lot suggestions:", error);
        setLotSuggestions([]);
      }
    }
  };

  const handleSelect = async (value: string) => {
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
            onSelect?.();
          }
        } catch (error) {
          console.error("Error fetching property boundary:", error);
          setSelectedProperty(null);
        }
      }
    } else {
      // Lot selection logic
      const selected = lotSuggestions.find(s => s.lot === value);
      if (selected) {
        // Implement lot selection logic
      }
    }
    setSearchValue("");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ToggleGroup 
        type="single" 
        value={searchMode} 
        onValueChange={(value) => {
          if (value) {
            setSearchMode(value);
            setSearchValue("");
            setSuggestions([]);
            setLotSuggestions([]);
          }
        }}
        className="justify-start"
      >
        <ToggleGroupItem value="address" aria-label="Search by address">
          <MapPin className="h-4 w-4 mr-2" />
          Address
        </ToggleGroupItem>
        <ToggleGroupItem value="lot" aria-label="Search by lot">
          <FileText className="h-4 w-4 mr-2" />
          Lot
        </ToggleGroupItem>
      </ToggleGroup>

      <Command className="rounded-lg border shadow-md">
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
    </div>
  );
} 