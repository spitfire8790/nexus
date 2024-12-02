import { BushfireLegend } from './bushfire-legend';
import { ZoningLegend } from './zoning-legend';
import { FSRLegend } from './fsr-legend';

export function MapLegends() {
  return (
    <>
      <BushfireLegend />
      <ZoningLegend />
      <FSRLegend />
    </>
  );
}
