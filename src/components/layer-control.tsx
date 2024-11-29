import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useMapStore } from "@/lib/map-store";
import { useEffect } from "react";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Layers, Tag, Filter, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState } from 'react';
import { MapLayer, ZoneOption, ZONE_OPTIONS } from "@/lib/map-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info as InfoIcon } from "lucide-react";
import { create } from 'zustand';
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";


interface SortableLayerItemProps {
  layer: MapLayer;
  onToggle: (id: string) => void;
  onUpdateZones: (id: string, zones: string[]) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateLayerUrl: (id: string, url: string) => void;
}

function SortableLayerItem({ layer, onToggle, onUpdateZones, onUpdateOpacity, onUpdateLayerUrl }: SortableLayerItemProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [opacityValue, setOpacityValue] = useState(layer.opacity ? Math.round(layer.opacity * 100) : 100);
  const [metromapToken, setMetromapToken] = useState('');
  
  // Add this line to allow toggling for custom layers
  const canToggle = layer.type === 'dynamic' || layer.type === 'tile' || layer.type === 'geojson' || layer.type === 'custom';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLayerToggle = async (layerId: string) => {
    if (layerId === 'metromap' && !metromapToken) {
      const token = prompt('Please enter your Metromap API token:');
      if (token) {
        setMetromapToken(token);
        // Update the layer URL in the store before toggling
        const updatedLayer = {
          ...layer,
          url: `https://api.metromap.com.au/ogc/gda2020/key/${token}/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=512&HEIGHT=512&LAYERS=Australia_latest&STYLES=&FORMAT=image/png&DPI=300&MAP_RESOLUTION=72&FORMAT_OPTIONS=dpi:72&TRANSPARENT=TRUE`
        };
        // You might need to add a method to update the layer URL in your store
        onUpdateLayerUrl?.(layerId, updatedLayer.url);
      }
    }
    onToggle(layerId);
  };

  const handleOpacityInputChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setOpacityValue(numValue);
      onUpdateOpacity(layer.id, numValue / 100);
    }
  };

  const removeZone = (zoneToRemove: string) => {
    const currentZones = layer.selectedZones || [];
    onUpdateZones(
      layer.id,
      currentZones.filter(zone => zone !== zoneToRemove)
    );
  };

  useEffect(() => {
    console.log('Layer selected zones:', layer.selectedZones);
  }, [layer.selectedZones]);

  const hasActiveFilter = layer.selectedZones?.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-2"
    >
      <div
        className={`flex items-center space-x-2 justify-start p-2 rounded-md ${
          isDragging ? 'bg-accent' : ''
        }`}
      >
        <button
          className="cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Switch
          id={layer.id}
          checked={layer.enabled}
          onCheckedChange={() => handleLayerToggle(layer.id)}
          disabled={layer.id !== 'metromap' && layer.type !== 'custom' && !layer.url}
        />
        <Label htmlFor={layer.id} className="text-left flex items-center gap-2">
          {layer.name}
          <TooltipWrapper 
            tooltipKey={layer.id} 
            side="right"
            showIcon
          />
        </Label>
        {layer.enabled && (
          <>
            {layer.id === 'zoning' && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${hasActiveFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                onClick={() => setShowFilter(!showFilter)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Layer Opacity</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={opacityValue}
                        onChange={(e) => handleOpacityInputChange(e.target.value)}
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[opacityValue]}
                    max={100}
                    step={1}
                    onValueChange={([value]) => {
                      setOpacityValue(value);
                      onUpdateOpacity(layer.id, value / 100);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
      {layer.id === 'zoning' && layer.enabled && showFilter && (
        <div className="filter-dropdown space-y-2 pt-2">
          <Command>
            <div className="flex items-center justify-between px-3">
              <CommandInput placeholder="Filter zones" className="h-8 border-none p-0 text-sm focus:ring-0" />
              {layer.selectedZones?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Clear filter"
                  onClick={() => onUpdateZones(layer.id, [])}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CommandList>
              {layer.selectedZones && layer.selectedZones.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2">
                  {layer.selectedZones.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {code}
                      <button
                        type="button"
                        className="hover:text-destructive"
                        aria-label={`Remove ${code} zone`}
                        onClick={() => removeZone(code)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <CommandEmpty>No zones found.</CommandEmpty>
              <CommandGroup>
                {console.log('Rendering zone options:', ZONE_OPTIONS)}
                {ZONE_OPTIONS.filter((zone: { code: string; description: string }) => 
                  !(layer.selectedZones || []).includes(zone.code)
                ).map((zone: { code: string; description: string }) => (
                  <CommandItem
                    key={zone.code}
                    value={zone.code}
                    onSelect={() => {
                      console.log('CommandItem clicked:', zone.code);
                      const currentZones = layer.selectedZones || [];
                      console.log('Current zones before update:', currentZones);
                      onUpdateZones(layer.id, [...currentZones, zone.code]);
                      console.log('Updated zones sent to store');
                    }}
                  >
                    <span className="font-medium">{zone.code}</span>
                    <span className="ml-2 text-muted-foreground">
                      {zone.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

function getLayerDescription(layerId: string): { name: string; description: string; source: string; link: string } {
  const descriptions: Record<string, { name: string; description: string; source: string; link: string }> = {
    'imagery': {
      name: 'NSW Imagery',
      description: 'Aerial imagery of NSW - Progressively from scales larger than 1:150,000 higher resolution imagery overlays lower resolution imagery and most recent imagery overlays older imagery within each resolution',
      source: 'NSW Department of Customer Servie (Spatial Services)',
      link: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer'
    },
    'cadastre': {
      name: 'Lots',
      description: 'NSW Cadastre - Lot and Plan details',
      source: 'NSW Department of Customer Servie (Spatial Services)',
      link: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer'
    },
    'zoning': {
      name: 'Land Zoning',
      description: 'This spatial dataset identifies land use zones and the type of land uses that are permitted (with or without consent) or prohibited in each zone on any given land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.',
      source: 'NSW Department of Planning, Housing and Infrastructure',
      link: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/19'
    },
    'fsr': {
      name: 'Floor Space Ratio',
      description: 'This spatial dataset identifies the maximum floor space ratio that is permitted on land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.',
      source: 'NSW Department of Planning, Housing and Infrastructure',
      link: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/11'
    },
    'height': {
      name: 'Height of Building',
      description: 'This spatial dataset identifies the maximum height of a building that is permitted on land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.',
      source: 'NSW Department of Planning, Housing and Infrastructure',
      link: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/14'
    },
    'heritage': {
      name: 'Heritage',
      description: 'This spatial dataset identifies areas subject to Heritage conservation as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.',
      source: 'NSW Department of Planning, Housing and Infrastructure',
      link: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/16'
    },
    'bushfire': {
      name: 'Bushfire Prone Land',
      description: 'The NSW Bush Fire Prone Land dataset is a map prepared in accordance with the Guide for Bush Fire Prone Land Mapping (BFPL Mapping Guide) and certified by the Commissioner of NSW RFS under section 146(2) of the Environmental Planning and Assessment Act 1979. Over time there has been various releases of the BFPL Mapping Guide, in which the categories and types of vegetation included in the BFPL map have changed. The version of the guide under which, each polygon or LGA was certified is contained in the data. An area of land that can support a bush fire or is likely to be subject to bush fire attack, as designated on a bush fire prone land map. The definition of bushfire vegetation categories under guideline version 5b: Vegetation Category 1 consists of: > Areas of forest, woodlands, heaths (tall and short), forested wetlands and timber plantations. Vegetation Category 2 consists of: >Rainforests. >Lower risk vegetation parcels. These vegetation parcels represent a lower bush fire risk to surrounding development and consist of: - Remnant vegetation; - Land with ongoing land management practices that actively reduces bush fire risk. Vegetation Category 3 consists of: > Grasslands, freshwater wetlands, semi-arid woodlands, alpine complex and arid shrublands. Buffers are created based on the bushfire vegetation, with buffering distance being 100 metres for vegetation category 1 and 30 metres for vegetation category 2 and 3. Vegetation excluded from the bushfire vegetation categories include isolated areas of vegetation less than one hectare, managed lands and some agricultural lands. Please refer to BFPL Mapping Guide for a full list of exclusions.The legislative context of this dataset is as follows: On 1 August 2002, the Rural Fires and Environmental Assessment Legislation Amendment Act 2002 (Amendment Act) came into effect.The Act amended both the Environmental Planning and Assessment Act 1979 and the Rural Fire Services Act 1997 to ensure that people, property and the environment are more fully protected against the dangers that may arise from bushfires. Councils are required to map bushfire prone land within their local government area, which becomes the trigger for the consideration of bushfire protection measures when developing land. BFPL Mapping Guidelines are available from www.rfs.nsw.gov.au. The NSW BFPL Map is collated and merged together from individual NSW local council maps which are submitted by the local council for certification. The maps are often a product of or derived from local and state vegetation mapping with input from Local Council and RFS staff. In some cases the maps are produced under contract for local council by various companies. Please refer to the individual metadata statements for each LGA BFPL Map.',
      source: 'NSW Department of Planning, Housing and Infrastructure',
      link: 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer/229'
    },
    'contamination': {
      name: 'Contaminated Land',
      description: 'This dataset includes contaminated land notified under section 60 of the Contaminated Land Management Act 1997 (CLM Act). These have been assessed by the EPA as being contaminated, but may not always require regulation under the CLM Act.',
      source: 'NSW Environment Protection Authority',
      link: 'https://maptest2.environment.nsw.gov.au/arcgis/rest/services/EPA/EPACS/MapServer/1'
    }
  };
  
  return descriptions[layerId] || {
    name: 'Unknown Layer',
    description: 'No description available',
    source: 'Unknown',
    link: ''
  };
}

interface CollapsibleGroupProps {
  group: LayerGroup;
  isCollapsed: boolean;
  onToggle: () => void;
  onLayerToggle: (id: string) => void;
  onUpdateZones: (id: string, zones: string[]) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateLayerUrl: (id: string, url: string) => void;
}

function CollapsibleGroup({ 
  group, 
  isCollapsed, 
  onToggle, 
  onLayerToggle, 
  onUpdateZones, 
  onUpdateOpacity, 
  onUpdateLayerUrl 
}: CollapsibleGroupProps) {
  return (
    <div className="space-y-2">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{group.name}</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isCollapsed ? "" : "transform rotate-180"
        )} />
      </button>
      {!isCollapsed && (
        <div className="space-y-1">
          {group.layers
            .filter(layer => !layer.hidden)
            .map((layer) => (
              <SortableLayerItem
                key={layer.id}
                layer={layer}
                onToggle={onLayerToggle}
                onUpdateZones={onUpdateZones}
                onUpdateOpacity={onUpdateOpacity}
                onUpdateLayerUrl={onUpdateLayerUrl}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function LayerControl() {
  const { layerGroups, toggleLayer, updateSelectedZones, updateLayerOpacity, updateLayerUrl } = useMapStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <Card className="h-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="p-4 border-b flex items-center gap-2">
        <Layers className="h-5 w-5" />
        <h2 className="font-semibold text-left">Map Layers</h2>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-6">
          {layerGroups.map((group) => (
            <CollapsibleGroup
              key={group.id}
              group={group}
              isCollapsed={collapsedGroups[group.id] || false}
              onToggle={() => toggleGroup(group.id)}
              onLayerToggle={toggleLayer}
              onUpdateZones={updateSelectedZones}
              onUpdateOpacity={updateLayerOpacity}
              onUpdateLayerUrl={updateLayerUrl}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}