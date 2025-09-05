import { type TooltipConfig } from '@/types/tooltips';

export const TOOLTIPS: { [key: string]: TooltipConfig } = {
  // Property Overview
  propertyArea: {
    description: "Total land area of the property in square meters",
    source: "NSW Land Registry Services",
    link: "https://portal.spatial.nsw.gov.au/portal/home/"
  },
  propertyWidth: {
    description: "Maximum width of the property",
    source: "Calculated from property boundaries",
    link: "https://portal.spatial.nsw.gov.au/portal/home/"
  },
  zoneInfo: {
    description: "Current zoning classification under the Local Environmental Plan (LEP)",
    source: "NSW Planning Portal",
    link: "https://www.planningportal.nsw.gov.au/spatialviewer/"
  },
  elevation: {
    description: "Ground elevation above sea level",
    source: "NSW Spatial Services Digital Elevation Model",
    link: "https://portal.spatial.nsw.gov.au/portal/home/"
  },
  propertyAddress: {
    description: "Property address as registered with NSW Land Registry Services",
    source: "NSW Land Registry Services",
    link: "https://www.nswlrs.com.au/"
  },
  lgaInfo: {
    description: "Local Government Area (LGA) that has planning authority over this property",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://www.planning.nsw.gov.au/"
  },
  lotsInfo: {
    description: "Individual lot and deposited plan (DP) numbers that make up this property",
    source: "NSW Land Registry Services",
    link: "https://www.nswlrs.com.au/"
  },

  // Planning Controls
  maxHeight: {
    description: "Maximum building height allowed under current planning controls",
    source: "Local Environmental Plan (LEP)",
    link: "https://www.planningportal.nsw.gov.au/spatialviewer/"
  },
  floorSpaceRatio: {
    description: "Maximum floor space ratio (FSR) allowed under current planning controls",
    source: "Local Environmental Plan (LEP)",
    link: "https://www.planningportal.nsw.gov.au/spatialviewer/"
  },
  minLotSize: {
    description: "Minimum lot size required for subdivision",
    source: "Local Environmental Plan (LEP)",
    link: "https://www.planningportal.nsw.gov.au/spatialviewer/"
  },

  // Map Layers
  imagery: {
    name: "NSW Imagery",
    description: "Aerial imagery of NSW - Progressively from scales larger than 1:150,000 higher resolution imagery overlays lower resolution imagery and most recent imagery overlays older imagery within each resolution",
    source: "NSW Department of Customer Service (Spatial Services)",
    link: "https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer"
  },
  nearmap: {
    name: "Nearmap",
    description: "High-resolution aerial imagery with frequent updates. Requires a valid Nearmap API key to access.",
    source: "Nearmap",
    link: "https://www.nearmap.com/"
  },
  cadastre: {
    name: "Lots",
    description: "NSW Cadastre - Lot and Plan details",
    source: "NSW Department of Customer Service (Spatial Services)",
    link: "https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer"
  },
  zoning: {
    name: "Land Zoning",
    description: "This spatial dataset identifies land use zones and the type of land uses that are permitted (with or without consent) or prohibited in each zone on any given land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer"
  },
  fsr: {
    name: "Floor Space Ratio",
    description: "This spatial dataset identifies the maximum floor space ratio that is permitted on land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer"
  },
  height: {
    name: "Height of Building",
    description: "This spatial dataset identifies the maximum height of a building that is permitted on land as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer"
  },
  heritage: {
    name: "Heritage",
    description: "This spatial dataset identifies areas subject to Heritage conservation as designated by the relevant NSW environmental planning instrument (EPI) under the Environmental Planning and Assessment Act 1979.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer"
  },
  bushfire: {
    name: "Bushfire Prone Land",
    description: "Areas identified as bushfire prone land by NSW Rural Fire Service",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer"
  },
  "epa-licenses": {
    name: "EPA Licensed Premises",
    description: "Premises licensed by the EPA under the Protection of the Environment Operations Act 1997",
    source: "NSW EPA",
    link: "https://maptest1.environment.nsw.gov.au/arcgis/rest/services/EPA/Environment_Protection_Licences/MapServer"
  },

  // Sales History
  showOnMap: {
    description: "Toggle visibility of nearby property sales on the map",
    source: "NSW Valuer General",
    link: "https://www.valuergeneral.nsw.gov.au/"
  },
  salePrice: {
    description: "Recorded sale price from property transaction",
    source: "NSW Land Registry Services",
    link: "https://www.nswlrs.com.au/"
  },
  saleDate: {
    description: "Date of property transaction settlement",
    source: "NSW Land Registry Services",
    link: "https://www.nswlrs.com.au/"
  },

  // Amenities
  searchRadius: {
    description: "Adjust the search distance for finding nearby amenities",
    source: "NSW Points of Interest database",
    link: "https://portal.spatial.nsw.gov.au/portal/home/"
  },
  showAmenities: {
    description: "Display selected amenities on the map",
    source: "NSW Points of Interest database",
    link: "https://portal.spatial.nsw.gov.au/portal/home/"
  },

  // Demographics
  populationData: {
    description: "Population statistics for the local Statistical Area 1 (SA1)",
    source: "Australian Bureau of Statistics Census 2021",
    link: "https://www.abs.gov.au/census"
  },
  ageDistribution: {
    description: "Age breakdown of local population",
    source: "Australian Bureau of Statistics Census 2021",
    link: "https://www.abs.gov.au/census"
  },
  householdIncome: {
    description: "Distribution of household weekly income in the area",
    source: "Australian Bureau of Statistics Census 2021",
    link: "https://www.abs.gov.au/census"
  },

  buildings3d: {
    name: "3D Buildings",
    description: "OpenStreetMap 3D building models showing building footprints and heights",
    source: "OpenStreetMap Contributors",
    link: "https://osmbuildings.org/"
  },

  temperature: {
    name: "Average Temperature",
    description: "Projected changes in average temperature across NSW based on NARCliM2.0 climate projections for different emission scenarios.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://mapprod.environment.nsw.gov.au/arcgis/rest/services/NARCliM2/Tas/MapServer"
  },

  "live-transport": {
    name: "Live Transport",
    description: "Real-time positions of public transport vehicles in NSW",
    source: "Transport for NSW Open Data Hub",
    link: "https://opendata.transport.nsw.gov.au/"
  },

  wikiArticles: {
    description: "Shows nearby Wikipedia articles and points of interest",
    source: "Wikipedia API",
    link: "https://www.wikipedia.org/"
  },

  "train-stations": {
    name: "Train Stations",
    description: "Sydney Trains and NSW TrainLink station locations across the network",
    source: "Transport for NSW",
    link: "https://opendata.transport.nsw.gov.au/"
  },

  "metro-stations": {
    name: "Metro Stations", 
    description: "Sydney Metro station locations across the network",
    source: "Transport for NSW",
    link: "https://opendata.transport.nsw.gov.au/"
  },

  "light-rail-stops": {
    name: "Light Rail Stops",
    description: "Sydney and NewcastleLight Rail stop locations across the network",
    source: "Transport for NSW",
    link: "https://opendata.transport.nsw.gov.au/"
  },

  "rail-lines": {
    name: "Rail Lines",
    description: "Railway network including Sydney Trains, NSW TrainLink, Sydney Metro and Light Rail routes",
    source: "Transport for NSW",
    link: "https://opendata.transport.nsw.gov.au/"
  },

  "roads": {
    name: "Roads",
    description: "NSW road network classified by function and hierarchy.",
    source: "NSW Department of Customer Service (Spatial Services)",
    link: "https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/MapServer/5"
  },

  "road-labels": {
    name: "Road Labels",
    description: "Text labels for roads and streets across NSW, including road names and types",
    source: "NSW Department of Customer Service (Spatial Services)",
    link: "https://maps.six.nsw.gov.au/arcgis/rest/services/sixmaps/LPI_RasterLabels_1/MapServer"
  },

  "lmr-housing": {
    name: "Low Medium Rise Housing Area",
    description: "Indicative Low Medium Rise (LMR) Housing Area. Please refer to the Low and Mid Rise Housing Policy for further information.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://www.planning.nsw.gov.au/policy-and-legislation/housing/low-and-mid-rise-housing-policy"
  },

  "tod-accelerated": {
    name: "TOD Accelerated Rezoning Area",
    description: "Areas identified for accelerated rezoning under the Transit-Oriented Development (TOD) program to support housing delivery near transport.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://spatialportalarcgis.dpie.nsw.gov.au/sarcgis/rest/services/LMR/LMR/MapServer/2"
  },

  "tod-area": {
    name: "TOD Area",
    description: "Transit-Oriented Development (TOD) areas identified for increased housing density and mixed-use development near transport hubs.",
    source: "NSW Department of Planning, Housing and Infrastructure",
    link: "https://spatialportalarcgis.dpie.nsw.gov.au/sarcgis/rest/services/LMR/LMR/MapServer/3"
  },

  streetFrontage: {
    title: "Street Frontage",
    description: "The length of property boundaries that directly face a public road. Multiple frontages may be detected if the property is on a corner or has access to multiple streets."
  }
};

export interface TooltipConfig {
  name?: string;
  description: string;
  source?: string;
  link?: string;
  additionalInfo?: {
    text?: string;
    links?: Array<{ label: string; url: string }>;
    imageUrl?: string;
  };
}

export const tooltipStyles = {
  base: "z-50 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm p-3 md:p-4 max-w-[90vw] md:max-w-md",
  title: "font-medium text-sm md:text-base mb-1",
  description: "text-xs md:text-sm text-gray-600",
  source: "mt-2 text-xs text-gray-500 flex items-center gap-1"
};
