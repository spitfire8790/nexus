import { Card } from '@/components/ui/card';
import { useMapStore } from '@/lib/map-store';
import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import * as EL from 'esri-leaflet';

interface LegendItem {
  color: string;
  label: string;
}

const ALL_LEGEND_ITEMS: LegendItem[] = [
  { color: 'rgb(255,0,0)', label: 'Vegetation Category 1' },
  { color: 'rgb(255,210,0)', label: 'Vegetation Category 2' },
  { color: 'rgb(255,128,0)', label: 'Vegetation Category 3' },
  { color: 'rgb(255,255,115)', label: 'Vegetation Buffer' }
];

export function BushfireLegend() {
  const map = useMap();
  const [visibleItems, setVisibleItems] = useState<LegendItem[]>([]);
  const layerGroups = useMapStore((state) => state.layerGroups);

  const bushfireLayer = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'bushfire');

  useEffect(() => {
    if (!bushfireLayer?.enabled) {
      setVisibleItems([]);
      return;
    }

    // For now, show all items when the layer is enabled
    setVisibleItems(ALL_LEGEND_ITEMS);
  }, [bushfireLayer?.enabled]);

  if (!bushfireLayer?.enabled || visibleItems.length === 0) {
    return null;
  }

  return (
    <Card className="absolute bottom-4 right-4 p-4 z-[1000] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Bushfire Risk Categories</h3>
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
