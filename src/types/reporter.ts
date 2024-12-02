export interface MapLayerSettings {
  id: string;
  enabled: boolean;
  opacity: number;
  order: number;
}

export interface MapSettings {
  showPropertyBoundary: boolean;
  showPropertyPoint: boolean;
  layers: MapLayerSettings[];
}

export interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'map' | 'data' | 'table' | 'image';
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  style: Record<string, any>;
  mapSettings?: MapSettings;
}

export interface Slide {
  id: number | string;
  elements: SlideElement[];
}

export interface Template {
  id: string;
  name: string;
  user_id: string;
  slides: Slide[];
  created_at: string;
  updated_at: string;
} 