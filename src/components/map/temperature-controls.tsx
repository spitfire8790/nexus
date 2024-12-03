import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useMapStore } from '@/lib/map-store';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

const TIME_PERIODS = [
  "2020-2039",
  "2030-2049",
  "2040-2059",
  "2050-2069",
  "2060-2079",
  "2070-2089",
  "2080-2099"
];

export function TemperatureControls() {
  const layerGroups = useMapStore((state) => state.layerGroups);
  const updateTimeIndex = useMapStore((state) => state.updateTimeIndex);
  const updateEmissionScenario = useMapStore((state) => state.updateEmissionScenario);
  const [sliderValue, setSliderValue] = useState(0);

  const temperatureLayer = layerGroups
    .flatMap(group => group.layers)
    .find(layer => layer.id === 'temperature');

  useEffect(() => {
    if (temperatureLayer?.timeIndex !== undefined) {
      setSliderValue(temperatureLayer.timeIndex);
    }
  }, [temperatureLayer?.timeIndex]);

  if (!temperatureLayer?.enabled) return null;

  return (
    <div className="absolute top-2.5 left-14 z-[1000] bg-white rounded-md shadow-md p-3 w-[280px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Emission Scenario</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Low</span>
            <Switch
              checked={temperatureLayer.emissionScenario === 'high'}
              onCheckedChange={(checked) => 
                updateEmissionScenario(temperatureLayer.id, checked ? 'high' : 'low')
              }
            />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Time Period</Label>
            <span className="text-xs text-muted-foreground">
              {TIME_PERIODS[sliderValue]}
            </span>
          </div>
          <Slider
            value={[sliderValue]}
            max={6}
            step={1}
            onValueChange={(value) => {
              setSliderValue(value[0]);
              updateTimeIndex(temperatureLayer.id, value[0]);
            }}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
} 