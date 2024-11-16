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
import { Layers, Tag, Filter, X, SlidersHorizontal } from "lucide-react";
import { useState } from 'react';
import { MapLayer, ZoneOption, ZONE_OPTIONS } from "@/lib/map-store";

interface SortableLayerItemProps {
  layer: MapLayer;
  onToggle: (id: string) => void;
  onToggleLabels: (id: string) => void;
  onUpdateZones: (id: string, zones: string[]) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateLayerUrl: (id: string, url: string) => void;
}

function SortableLayerItem({ layer, onToggle, onToggleLabels, onUpdateZones, onUpdateOpacity, onUpdateLayerUrl }: SortableLayerItemProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [opacityValue, setOpacityValue] = useState(layer.opacity ? Math.round(layer.opacity * 100) : 100);
  const [metromapToken, setMetromapToken] = useState('');
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
          disabled={layer.id !== 'metromap' && !layer.url}
        />
        <Label htmlFor={layer.id} className="text-left flex-1">
          {layer.name}
        </Label>
        {layer.enabled && (
          <>
            {layer.id === 'cadastre' && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${layer.showLabels ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => onToggleLabels(layer.id)}
              >
                <Tag className="h-4 w-4" />
              </Button>
            )}
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

export function LayerControl() {
  const { layerGroups, toggleLayer, toggleLabels, updateSelectedZones, updateLayerOpacity, updateLayerUrl } = useMapStore();

  return (
    <Card className="h-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="p-4 border-b flex items-center gap-2">
        <Layers className="h-5 w-5" />
        <h2 className="font-semibold text-left">Map Layers</h2>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-6">
          {layerGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">{group.name}</h3>
              <div className="space-y-1">
                {group.layers
                  .filter(layer => !layer.hidden)
                  .map((layer) => (
                    <SortableLayerItem
                      key={layer.id}
                      layer={layer}
                      onToggle={toggleLayer}
                      onToggleLabels={toggleLabels}
                      onUpdateZones={updateSelectedZones}
                      onUpdateOpacity={updateLayerOpacity}
                      onUpdateLayerUrl={updateLayerUrl}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}