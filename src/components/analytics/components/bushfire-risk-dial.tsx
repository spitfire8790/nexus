import { cn } from '@/lib/utils';

type RiskCategory = 'None' | 'Vegetation Buffer' | 'Vegetation Category 3' | 'Vegetation Category 2' | 'Vegetation Category 1';

interface BushfireRiskDialProps {
  risk: RiskCategory;
}

export function BushfireRiskDial({ risk }: BushfireRiskDialProps) {
  const getRiskColor = (risk: RiskCategory) => {
    const colors: Record<RiskCategory, string> = {
      'None': 'bg-green-500',
      'Vegetation Buffer': 'bg-blue-500',
      'Vegetation Category 3': 'bg-yellow-500',
      'Vegetation Category 2': 'bg-orange-500',
      'Vegetation Category 1': 'bg-red-500'
    };
    return colors[risk];
  };

  const getRiskDescription = (risk: RiskCategory) => {
    const descriptions: Record<RiskCategory, string> = {
      'None': 'This property is not in a bushfire prone area.',
      'Vegetation Buffer': 'This property is in a vegetation buffer zone.',
      'Vegetation Category 3': 'This property is in a medium bushfire risk area.',
      'Vegetation Category 2': 'This property is in a high bushfire risk area.',
      'Vegetation Category 1': 'This property is in a very high bushfire risk area.'
    };
    return descriptions[risk];
  };

  const riskLevel = risk === 'None' ? 0 :
    risk === 'Vegetation Buffer' ? 1 :
    risk === 'Vegetation Category 3' ? 2 :
    risk === 'Vegetation Category 2' ? 3 :
    4;

  return (
    <div className="space-y-4">
      <div className="relative h-48 w-48 mx-auto">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        
        {/* Colored segments */}
        <div className="absolute inset-0">
          {['None', 'Vegetation Buffer', 'Vegetation Category 3', 'Vegetation Category 2', 'Vegetation Category 1'].map((category, index) => (
            <div
              key={category}
              className={cn(
                'absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2',
                getRiskColor(category as RiskCategory),
                index === riskLevel ? 'scale-150' : 'scale-100 opacity-30'
              )}
              style={{
                left: '50%',
                top: '50%',
                transform: `
                  translate(-50%, -50%)
                  rotate(${index * 90}deg)
                  translate(0, -40px)
                `
              }}
            />
          ))}
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-semibold">{risk}</div>
          </div>
        </div>
      </div>

      <p className="text-sm text-center text-muted-foreground">
        {getRiskDescription(risk)}
      </p>
    </div>
  );
}
