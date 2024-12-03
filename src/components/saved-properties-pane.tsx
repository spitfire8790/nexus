import { useMapStore } from '@/lib/map-store';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import * as L from 'leaflet';

export function SavedPropertiesPane() {
  const savedProperties = useMapStore((state) => state.savedProperties);
  const removeSavedProperty = useMapStore((state) => state.removeSavedProperty);
  const map = useMapStore((state) => state.mapInstance);

  const handleRemove = async (id: string) => {
    await removeSavedProperty(id);
  };

  const handlePropertyClick = (property: any) => {
    if (!map) return;
    const layer = L.geoJSON(property.geometry);
    const bounds = layer.getBounds();
    map.flyToBounds(bounds, { 
      padding: [50, 50],
      duration: 1 
    });
  };

  return (
    <div className="border-t">
      <div className="p-4">
        <h2 className="font-semibold">Saved Properties</h2>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 p-4">
          {savedProperties.map((property) => (
            <div key={property.id} className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-sm truncate text-left justify-start flex-1 px-2"
                onClick={() => handlePropertyClick(property)}
              >
                {property.address}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(property.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 