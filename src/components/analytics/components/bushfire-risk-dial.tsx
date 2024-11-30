import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import ReactSpeedometer, { CustomSegmentLabelPosition, Transition } from 'react-d3-speedometer';

type RiskCategory = 'None' | 'Vegetation Buffer' | 'Vegetation Category 3' | 'Vegetation Category 2' | 'Vegetation Category 1';

interface BushfireRiskDialProps {
  risk: RiskCategory;
}

export function BushfireRiskDial({ risk }: BushfireRiskDialProps) {
  const riskLevels: RiskCategory[] = [
    'None', 
    'Vegetation Buffer',
    'Vegetation Category 3', 
    'Vegetation Category 2', 
    'Vegetation Category 1'
  ];
  const riskIndex = riskLevels.indexOf(risk);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Bushfire Risk</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[500px] max-h-[400px] p-4 overflow-auto text-sm">
                <p>Data Sourced from the NSW Bush Fire Prone Land dataset map prepared in accordance with the Guide for Bush Fire Prone Land Mapping (BFPL Mapping Guide) and certified by the Commissioner of NSW RFS under section 146(2) of the Environmental Planning and Assessment Act 1979.</p>
                {/* ... rest of tooltip content ... */}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Highest bushfire prone risk category on selected property</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <div className="w-full max-w-[300px] flex flex-col items-center -mb-4">
          <ReactSpeedometer
            maxValue={5}
            value={riskIndex + 0.5}
            currentValueText=""
            customSegmentLabels={[
              { text: "None", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Buffer", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 3", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 2", position: CustomSegmentLabelPosition.Outside, color: "#666" },
              { text: "Cat 1", position: CustomSegmentLabelPosition.Outside, color: "#666" }
            ]}
            ringWidth={55}
            needleHeightRatio={0.7}
            needleTransition={Transition.easeElasticIn}
            needleTransitionDuration={2000}
            needleColor="#000000"
            textColor="#666666"
            valueFormat=""
            segmentColors={[
              "#e5e5e5",          // None
              "rgb(255,255,115)", // Buffer
              "rgb(255,128,0)",   // Cat 3
              "rgb(255,210,0)",   // Cat 2
              "rgb(255,0,0)"      // Cat 1
            ]}
            labelFontSize="12px"
            height={160}
            paddingVertical={0}
          />
          <div className="text-center text-xl font-semibold -mt-0">{risk}</div>
        </div>
      </CardContent>
    </Card>
  );
}
