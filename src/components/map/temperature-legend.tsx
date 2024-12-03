import { Card } from '@/components/ui/card';
import { useMapStore } from '@/lib/map-store';

interface LegendItem {
  range: string;
  color: string;
}

const TEMPERATURE_LEGEND: LegendItem[] = [
  { range: '0 - 0.5', color: '#fefdc9' },
  { range: '0.5 - 1', color: '#fbf0a2' },
  { range: '1 - 1.5', color: '#fbf0a2' },
  { range: '1.5 - 2', color: '#f2ba5b' },
  { range: '2 - 2.5', color: '#e69e55' },
  { range: '2.5 - 3', color: '#e69e55' },
  { range: '3 - 3.5', color: '#cd684a' },
  { range: '3.5 - 4', color: '#cd684a' },
  { range: '4 - 4.5', color: '#854038' },
  { range: '4.5 - 5', color: '#854038' },
  { range: '> 5', color: '#854038' }
];

export function TemperatureLegend() {
  const layerGroups = useMapStore((state) => state.layerGroups);

  const temperatureLayer = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'temperature');

  if (!temperatureLayer?.enabled) {
    return null;
  }

  return (
    <Card className="absolute bottom-8 left-4 p-4 z-[1000] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Change in Average Temperature (°C)</h3>
        <div className="space-y-1">
          {TEMPERATURE_LEGEND.map((item) => (
            <div key={item.range} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-sm text-muted-foreground">{item.range}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 