/**
 * Property data type definition
 * Contains all property attributes used for reporting
 */
export interface PropertyData {
  // Basic property information
  propertyAddress?: string;
  lgaName?: string;
  suburb?: string;
  cadastre?: {
    lots?: string[];
  };
  
  // Physical attributes
  area?: number;  // in square meters
  width?: number; // in meters
  depth?: number; // in meters
  
  // Planning controls
  zoneInfo?: string;
  floorSpaceRatio?: string;
  maxHeight?: string;
  minLotSize?: string;
  
  // Constraints
  heritage?: string[];
  bushfire?: string;
  flood?: string;
  acid?: string;
  
  // Environmental
  biodiversity?: string;
  contamination?: string;
  
  // Infrastructure
  water?: string;
  sewer?: string;
  power?: string;
  
  // Market data
  recentSales?: {
    date: string;
    price: number;
    address: string;
  }[];
  
  // Other attributes
  coordinates?: [number, number];
  
  // Additional data for specific slide types can be extended here
  [key: string]: any;
} 