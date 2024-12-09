declare module '@turf/boolean-point-in-polygon' {
  import { Feature, Polygon, Point } from '@turf/helpers';

  export default function booleanPointInPolygon(
    point: Feature<Point> | Point,
    polygon: Feature<Polygon> | Polygon,
    options?: { ignoreBoundary?: boolean }
  ): boolean;
} 