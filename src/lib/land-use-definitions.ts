import {
  TreePine,
  Wheat,
  Beef,
  Binoculars,
  Bug,
  Tractor,
  Fish,
  Bird,
  Store,
  Home,
  Building2,
  Ham,
  Building,
  Hotel,
  ShoppingBag,
  Coffee,
  Beer,
  Briefcase,
  Factory,
  Warehouse,
  Dog,
  Truck,
  Package,
  Sprout,
  Wine,
  Train,
  Plane,
  Ship,
  Wrench,
  School,
  Hospital,
  Church,
  Heart,
  Tent,
  Waves,
  Music,
  Leaf,
  CircleDot,
  Construction,
  Trash2,
  GraduationCap,
  Library,
  UtensilsCrossed,
  Car,
  Zap,
  Droplet,
  Cone,
  Wifi,
  Recycle,
  Sailboat,
  Anchor,
  Cross,
  Shield,
  Flower2,
  ShoppingCart,
  FerrisWheel,
  Hammer,
  Activity,
  Trees,
  TreeDeciduous,
  Siren
} from 'lucide-react';

export interface LandUseDefinition {
  name: string;
  icon: LucideIcon;
  definition: string;
  parent?: string;
  children?: string[];
  legislation?: string;
  notes?: string;
}

export interface LandUseHierarchy {
  [key: string]: {
    definition: LandUseDefinition;
    children?: {
      [key: string]: {
        definition: LandUseDefinition;
        children?: {
          [key: string]: {
            definition: LandUseDefinition;
            children?: {
              [key: string]: LandUseDefinition;
            };
          };
        };
      };
    };
  };
}

// Helper functions
export function normalizeLandUseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function getLandUseDefinition(landUseString: string): LandUseDefinition | undefined {
  // Normalize the input string
  const normalizedInput = landUseString
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, '_');

  // Helper function to normalize definition names
  const normalizeName = (name: string) => 
    name.toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\s+/g, '_');

  // Search through all categories and their children
  for (const category of Object.values(landUseDefinitions)) {
    // Check main category
    if (normalizeName(category.definition.name) === normalizedInput) {
      return category.definition;
    }

    // Check children recursively
    if (category.children) {
      for (const child of Object.values(category.children)) {
        if (normalizeName(child.definition.name) === normalizedInput) {
          return child.definition;
        }

        // Check grandchildren if they exist
        if (child.children) {
          for (const grandchild of Object.values(child.children)) {
            if (normalizeName(grandchild.definition.name) === normalizedInput) {
              return grandchild.definition;
            }
          }
        }
      }
    }
  }

  // If no exact match, try partial matching
  for (const category of Object.values(landUseDefinitions)) {
    // Check if the input contains the category name or vice versa
    if (normalizedInput.includes(normalizeName(category.definition.name)) || 
        normalizeName(category.definition.name).includes(normalizedInput)) {
      return category.definition;
    }

    if (category.children) {
      for (const child of Object.values(category.children)) {
        if (normalizedInput.includes(normalizeName(child.definition.name)) || 
            normalizeName(child.definition.name).includes(normalizedInput)) {
          return child.definition;
        }
      }
    }
  }

  // Return undefined if no match found
  return undefined;
}

export const landUseDefinitions: LandUseHierarchy = {
  "agriculture": {
    definition: {
      name: "Agriculture",
      icon: Wheat,
      definition: "The cultivation or breeding of plant or animal species for food, fiber, biofuel, medicinal or other purposes.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "agritourism": {
        definition: {
          name: "Agritourism",
          icon: Binoculars,
          definition: "A business activity carried out on land that is used primarily for agricultural purposes, that generates secondary income for the farming business and provides visitors with products, services or experiences related to farming or the local area.",
          parent: "agriculture"
        },
        children: {
          "farm_experience_premises": {
            definition: {
              name: "Farm Experience Premises",
              icon: Tractor,
              definition: "A building or place on a farm used to provide visitors with cultural, recreational or educational experiences in relation to farming practices and activities and the farm's rural setting.",
              parent: "agritourism"
            }
          },
          "farm_gate_premises": {
            definition: {
              name: "Farm Gate Premises",
              icon: Tractor,
              definition: "A building or place on a farm used for retail sale of agricultural produce or products that is primarily grown or produced on the farm or predominantly within the local area.",
              parent: "agritourism",
              children: ["cellar_door_premises"]
            }
          }
        }
      },
      "aquaculture": {
        definition: {
          name: "Aquaculture",
          icon: Fish,
          definition: "The cultivation of aquatic animals or plants for commercial purposes, including oysters, fish, crustaceans and aquatic plants.",
          parent: "agriculture"
        },
        children: {
          "oyster_aquaculture": {
            definition: {
              name: "Oyster Aquaculture",
              icon: Fish,
              definition: "The cultivation of oysters for commercial purposes, including the construction and operation of oyster cultivation infrastructure.",
              parent: "aquaculture"
            }
          },
          "pond_based_aquaculture": {
            definition: {
              name: "Pond-based Aquaculture",
              icon: Fish,
              definition: "Aquaculture undertaken in structures that are constructed by excavating and reshaping earth, which may be earthen or lined.",
              parent: "aquaculture"
            }
          },
          "tank_based_aquaculture": {
            definition: {
              name: "Tank-based Aquaculture",
              icon: Fish,
              definition: "Aquaculture undertaken in structures that are constructed of artificial materials such as fiberglass, plastics, concrete or steel.",
              parent: "aquaculture"
            }
          }
        }
      },
      
      "extensive_agriculture": {
        definition: {
          name: "Extensive Agriculture",
          icon: Wheat,
          definition: "Agricultural production relying primarily on natural resources including climate, land, water and soil; includes grazing of livestock and growing of crops.",
          parent: "agriculture"
        },
        children: {
          "bee_keeping": {
            definition: {
              name: "Bee Keeping",
              icon: Bug,
              definition: "The keeping and breeding of bees for commercial purposes, including honey production and pollination services.",
              parent: "extensive_agriculture"
            }
          },
          "dairy_pasture_based": {
            definition: {
              name: "Dairy (Pasture-based)",
              icon: Tractor,
              definition: "A dairy farm where cattle are primarily grass-fed and allowed to graze on pasture, with supplementary feeding as required.",
              parent: "extensive_agriculture"
            }
          }
        }
      },
      
      "intensive_livestock_agriculture": {
        definition: {
          name: "Intensive Livestock Agriculture",
          icon: Beef,
          definition: "The keeping or breeding of livestock, poultry or other animals for commercial purposes where they are wholly or substantially fed by hand or mechanical means.",
          parent: "agriculture"
        },
        children: {
          "feedlots": {
            definition: {
              name: "Feedlots",
              icon: Beef,
              definition: "A confined yard area with watering and feeding facilities where cattle are completely hand or mechanically fed for the purpose of production.",
              parent: "intensive_livestock_agriculture"
            }
          },
          "dairies_restricted": {
            definition: {
              name: "Dairies (Restricted)",
              icon: Factory,
              definition: "A dairy farm where cattle are confined within a restricted area and are hand or mechanically fed for milk production.",
              parent: "intensive_livestock_agriculture"
            }
          },
          "pig_farm": {
            definition: {
              name: "Pig Farm",
              icon: Ham,
              definition: "A facility for the keeping or breeding of pigs for commercial purposes where they are fed by hand or mechanical means.",
              parent: "intensive_livestock_agriculture"
            }
          },
          "poultry_farm": {
            definition: {
              name: "Poultry Farm",
              icon: Bird,
              definition: "A facility for the keeping or breeding of poultry for commercial purposes where they are fed by hand or mechanical means.",
              parent: "intensive_livestock_agriculture"
            }
          }
        }
      },
      
      "intensive_plant_agriculture": {
        definition: {
          name: "Intensive Plant Agriculture",
          icon: Leaf,
          definition: "The cultivation of irrigated crops for commercial purposes, including vegetables, fruits, grains, flowers and ornamental plants.",
          parent: "agriculture"
        },
        children: {
          "horticulture": {
            definition: {
              name: "Horticulture",
              icon: Sprout,
              definition: "The cultivation of fruits, vegetables, mushrooms, nuts, cut flowers and foliage and nursery products for commercial purposes.",
              parent: "intensive_plant_agriculture"
            }
          },
          "turf_farming": {
            definition: {
              name: "Turf Farming",
              icon: Tractor,
              definition: "The commercial cultivation of turf for sale and removal from the property where it is cultivated.",
              parent: "intensive_plant_agriculture"
            }
          },
          "viticulture": {
            definition: {
              name: "Viticulture",
              icon: Wine,
              definition: "The cultivation of grapevines and associated activities for commercial wine production.",
              parent: "intensive_plant_agriculture"
            }
          }
        }
      }
    }
  },
  
  "animal_boarding_or_training_establishments": {
    definition: {
      name: "Animal Boarding or Training Establishments",
      icon: Dog,
      definition: "A building or place used for the breeding, boarding, training, keeping or caring of animals for commercial purposes, and includes any associated riding school or ancillary veterinary hospital.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    }
  },

  "farm_buildings": {
    definition: {
      name: "Farm Buildings",
      icon: Warehouse,
      definition: "A structure used for the operation of the farm including storage, handling, processing and packing of farm produce, parking of farm vehicles, or housing livestock.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    }
  },

  "forestry": {
    definition: {
      name: "Forestry",
      icon: Trees,
      definition: "The use of land for growing and harvesting timber for commercial purposes, including plantation forestry, native forest operations and related activities.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    }
  },

  "residential_accommodation": {
    definition: {
      name: "Residential Accommodation",
      icon: Home,
      definition: "A building or place used predominantly as a place of residence.",
      parent: "residential",
      children: {
        "attached_dwellings": {
          definition: {
            name: "Attached Dwellings",
            icon: Home,
            definition: "3 or more dwellings on land that are attached but do not share above-ground common walls.",
            parent: "residential_accommodation"
          }
        },
        "boarding_houses": {
          definition: {
            name: "Boarding Houses",
            icon: Building,
            definition: "A building that provides lodgers with a principal place of residence for 3 months or more, and generally has shared facilities.",
            parent: "residential_accommodation"
          }
        },
        "group_homes": {
          definition: {
            name: "Group Homes",
            icon: Home,
            definition: "A permanent group living arrangement for people with a disability or people who are socially disadvantaged.",
            parent: "residential_accommodation"
          }
        },
        "hostels": {
          definition: {
            name: "Hostels",
            icon: Building,
            definition: "Premises used for temporary or short-term accommodation on a commercial basis.",
            parent: "residential_accommodation"
          }
        },
        "multi_dwelling_housing": {
          definition: {
            name: "Multi Dwelling Housing",
            icon: Home,
            definition: "3 or more dwellings on one lot of land, but does not include residential flat buildings.",
            parent: "residential_accommodation"
          }
        },
        "residential_flat_buildings": {
          definition: {
            name: "Residential Flat Buildings",
            icon: Building,
            definition: "A building containing 3 or more dwellings, but does not include an attached dwelling or multi dwelling housing.",
            parent: "residential_accommodation"
          }
        },
        "semi_detached_dwellings": {
          definition: {
            name: "Semi-Detached Dwellings",
            icon: Home,
            definition: "Two dwellings on one lot of land that are attached to each other but do not share above-ground common walls.",
            parent: "residential_accommodation"
          }
        },
        "seniors_housing": {
          definition: {
            name: "Seniors Housing",
            icon: Home,
            definition: "A building or place that is operated by a social housing provider and used to provide accommodation for seniors or people with a disability.",
            parent: "residential_accommodation"
          }
        },
        "shop_top_housing": {
          definition: {
            name: "Shop Top Housing",
            icon: Building,
            definition: "One or more dwellings located above ground floor retail premises or business premises.",
            parent: "residential_accommodation"
          }
        }
      }
    }
  },

  "tourist_and_visitor_accommodation": {
    definition: {
      name: "Tourist and Visitor Accommodation",
      icon: Hotel,
      definition: "A building or place that provides temporary or short-term accommodation on a commercial basis.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "backpackers_accommodation": {
        definition: {
          name: "Backpackers Accommodation",
          icon: Tent,
          definition: "Tourist and visitor accommodation providing dormitory-style accommodation for backpackers.",
          parent: "tourist_and_visitor_accommodation"
        }
      },
      "bed_and_breakfast_accommodation": {
        definition: {
          name: "Bed and Breakfast Accommodation",
          icon: Home,
          definition: "Tourist and visitor accommodation provided within an existing dwelling by permanent residents of the dwelling.",
          parent: "tourist_and_visitor_accommodation"
        }
      },
      "farm_stay_accommodation": {
        definition: {
          name: "Farm Stay Accommodation",
          icon: Home,
          definition: "Tourist and visitor accommodation provided on a working farm as a secondary business to primary production.",
          parent: "tourist_and_visitor_accommodation"
        }
      },
      "hotel_or_motel_accommodation": {
        definition: {
          name: "Hotel or Motel Accommodation",
          icon: Hotel,
          definition: "Tourist and visitor accommodation providing rooms or suites for short-term stays, with or without dining facilities.",
          parent: "tourist_and_visitor_accommodation"
        }
      },
      "serviced_apartments": {
        definition: {
          name: "Serviced Apartments",
          icon: Building2,
          definition: "Tourist and visitor accommodation containing self-contained dwellings that are regularly serviced or cleaned.",
          parent: "tourist_and_visitor_accommodation"
        }
      }
    }
  },

  "commercial_premises": {
    definition: {
      name: "Commercial Premises",
      icon: Building,
      definition: "A building or place used for commercial purposes, including office, business, or retail premises.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "business_premises": {
        definition: {
          name: "Business Premises",
          icon: Briefcase,
          definition: "A building or place used for the carrying out of business activities or commercial enterprises.",
          parent: "commercial_premises"
        }
      },
      "office_premises": {
        definition: {
          name: "Office Premises",
          icon: Building2,
          definition: "A building or place used for the purpose of administrative, clerical, technical, professional or similar activities.",
          parent: "commercial_premises"
        }
      },
      "retail_premises": {
        definition: {
          name: "Retail Premises",
          icon: ShoppingCart,
          definition: "A building or place used for the purpose of selling items by retail, or hiring or displaying items for the purpose of selling them or hiring them out.",
          parent: "commercial_premises"
        },
        children: {
          "cellar_door_premises": {
            definition: {
              name: "Cellar Door Premises",
              icon: Beer,
              definition: "A building or place that is used to sell wine by retail and that is situated on land on which there is a commercial vineyard.",
              parent: "retail_premises"
            }
          },
          "food_and_drink_premises": {
            definition: {
              name: "Food and Drink Premises",
              icon: UtensilsCrossed,
              definition: "Premises that are used for the preparation and retail sale of food or drink for immediate consumption on or off the premises.",
              parent: "retail_premises"
            },
            children: {
              "pubs": {
                definition: {
                  name: "Pubs",
                  icon: Beer,
                  definition: "Licensed premises under the Liquor Act 2007 selling liquor for consumption on premises.",
                  parent: "food_and_drink_premises"
                }
              },
              "restaurants_or_cafes": {
                definition: {
                  name: "Restaurants or Cafes",
                  icon: Coffee,
                  definition: "A building or place the principal purpose of which is the preparation and serving of food and drink to people for consumption on the premises.",
                  parent: "food_and_drink_premises"
                }
              },
              "take_away_food_and_drink_premises": {
                definition: {
                  name: "Take Away Food and Drink Premises",
                  icon: UtensilsCrossed,
                  definition: "Premises that are predominantly used for the preparation and retail sale of food or drink for immediate consumption away from the premises.",
                  parent: "food_and_drink_premises"
                }
              }
            }
          },
          "garden_centres": {
            definition: {
              name: "Garden Centres",
              icon: Leaf,
              definition: "A building or place the principal purpose of which is the retail sale of plants and landscaping and gardening supplies and equipment.",
              parent: "retail_premises"
            }
          },
          "hardware_and_building_supplies": {
            definition: {
              name: "Hardware and Building Supplies",
              icon: Hammer,
              definition: "A building or place the principal purpose of which is the sale or hire of goods or materials to be used in the carrying out of building work or home improvements.",
              parent: "retail_premises"
            }
          },
          "kiosks": {
            definition: {
              name: "Kiosks",
              icon: Store,
              definition: "Premises that are used for the purposes of selling food, light refreshments and other small convenience items.",
              parent: "retail_premises"
            }
          },
          "markets": {
            definition: {
              name: "Markets",
              icon: Store,
              definition: "An open area or building used for the purpose of selling, exposing or offering goods, merchandise or materials for sale by independent stall holders.",
              parent: "retail_premises"
            }
          },
          "shops": {
            definition: {
              name: "Shops",
              icon: ShoppingCart,
              definition: "Premises that sell merchandise such as groceries, personal care products, clothing, music, homewares, stationery, electrical goods or the like.",
              parent: "retail_premises"
            }
          },
          "vehicle_sales_or_hire_premises": {
            definition: {
              name: "Vehicle Sales or Hire Premises",
              icon: Car,
              definition: "A building or place used for the display, sale or hire of motor vehicles, caravans, boats, trailers or agricultural machinery.",
              parent: "retail_premises"
            }
          }
        }
      }
    }
  },

  "industrial_activities": {
    definition: {
      name: "Industrial Activities",
      icon: Factory,
      definition: "The manufacturing, production, processing, repair, storage or transport of goods, and includes any related research and development.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "general_industries": {
        definition: {
          name: "General Industries",
          icon: Factory,
          definition: "Manufacturing, production, processing, repair, storage or transport of goods, not classified as heavy, light, or artisan food and drink industries.",
          parent: "industrial_activities"
        }
      },
      "heavy_industries": {
        definition: {
          name: "Heavy Industries",
          icon: Factory,
          definition: "Industries that require separation from other land uses due to potential environmental impacts.",
          parent: "industrial_activities"
        },
        children: {
          "hazardous_industries": {
            definition: {
              name: "Hazardous Industries",
              icon: Factory,
              definition: "Industries involving hazardous materials or processes that require significant separation from other land uses.",
              parent: "heavy_industries"
            }
          },
          "offensive_industries": {
            definition: {
              name: "Offensive Industries",
              icon: Factory,
              definition: "Industries that may emit significant odor, noise, or other pollutants requiring separation from other land uses.",
              parent: "heavy_industries"
            }
          }
        }
      },
      "light_industries": {
        definition: {
          name: "Light Industries",
          icon: Factory,
          definition: "Industries where impacts on nearby land uses are minimal, including high-technology, manufacturing, and research.",
          parent: "industrial_activities"
        }
      },
      "artisan_food_and_drink_industries": {
        definition: {
          name: "Artisan Food and Drink Industries",
          icon: UtensilsCrossed,
          definition: "Small-scale manufacturing of food or drinks where goods are sold directly to the public.",
          parent: "industrial_activities"
        }
      }
    }
  },

  "storage_premises": {
    definition: {
      name: "Storage Premises",
      icon: Warehouse,
      definition: "A building or place used for the storage of goods, materials, vehicles or other items.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "self_storage_units": {
        definition: {
          name: "Self-storage Units",
          icon: Warehouse,
          definition: "Storage premises that consist of individual enclosed compartments for storing goods or materials.",
          parent: "storage_premises"
        }
      },
      "storage_yards": {
        definition: {
          name: "Storage Yards",
          icon: Warehouse,
          definition: "Outdoor storage of goods, materials, machinery, vehicles or other items.",
          parent: "storage_premises"
        }
      },
      "warehouse_or_distribution_centres": {
        definition: {
          name: "Warehouse or Distribution Centres",
          icon: Warehouse,
          definition: "Buildings or places used for the storage and distribution of goods, materials or products.",
          parent: "storage_premises"
        }
      }
    }
  },

  "vehicle_repair_and_related": {
    definition: {
      name: "Vehicle Repair and Related Facilities",
      icon: Wrench,
      definition: "A building or place used for the repair, servicing and maintenance of vehicles.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "vehicle_body_repair_workshops": {
        definition: {
          name: "Vehicle Body Repair Workshops",
          icon: Wrench,
          definition: "A building or place used for the repair of vehicles, involving body building, panel beating, or spray painting.",
          parent: "vehicle_repair_and_related"
        }
      },
      "vehicle_repair_stations": {
        definition: {
          name: "Vehicle Repair Stations",
          icon: Wrench,
          definition: "A building or place used for the purpose of carrying out repairs to motor vehicles or agricultural machinery.",
          parent: "vehicle_repair_and_related"
        }
      }
    }
  },

  "educational_establishments": {
    definition: {
      name: "Educational Establishments",
      icon: School,
      definition: "A building or place used for education and training.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "schools": {
        definition: {
          name: "Schools",
          icon: School,
          definition: "A government or non-government school within the meaning of the Education Act 1990.",
          parent: "educational_establishments"
        }
      },
      "tertiary_institutions": {
        definition: {
          name: "Tertiary Institutions",
          icon: GraduationCap,
          definition: "Universities, TAFEs and other higher education facilities providing formal education and training.",
          parent: "educational_establishments"
        }
      }
    }
  },

  "health_services_facilities": {
    definition: {
      name: "Health Services Facilities",
      icon: Heart,
      definition: "Buildings or places used to provide medical or other health-related services to people.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "hospitals": {
        definition: {
          name: "Hospitals",
          icon: Hospital,
          definition: "A building or place used for the purpose of providing professional health care services.",
          parent: "health_services_facilities"
        }
      },
      "medical_centres": {
        definition: {
          name: "Medical Centres",
          icon: Heart,
          definition: "A building or place used for providing health care services to outpatients only.",
          parent: "health_services_facilities"
        }
      },
      "health_consulting_rooms": {
        definition: {
          name: "Health Consulting Rooms",
          icon: Heart,
          definition: "A medical practitioner's room within a dwelling house used for treating patients.",
          parent: "health_services_facilities"
        }
      }
    }
  },

  "information_and_education_facilities": {
    definition: {
      name: "Information and Education Facilities",
      icon: Library,
      definition: "Buildings or places used for providing information or education to visitors.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "artisan_food_and_drink_industry": {
        definition: {
          name: "Information and Education Facilities",
          icon: Library,
          definition: "A building or place used for providing information or education to visitors, including museums, galleries, cultural centers, and environmental facilities.",
          parent: "information_and_education_facilities"
        }
      }
    }
  },

  "places_of_public_worship": {
    definition: {
      name: "Places of Public Worship",
      icon: Church,
      definition: "A building or place used for the purpose of religious worship by a congregation or religious group.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    }
  },

  "recreation_facilities": {
    definition: {
      name: "Recreation Facilities",
      icon: FerrisWheel,
      definition: "A building or place used for sporting, recreation or leisure activities.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "recreation_facilities_indoor": {
        definition: {
          name: "Recreation Facilities (Indoor)",
          icon: Cone,
          definition: "A building or place used for indoor recreation, including a squash court, indoor swimming pool, gymnasium, table tennis centre, health studio, bowling alley, ice rink or any other building or place of a like character.",
          parent: "recreation_facilities"
        }
      },
      "recreation_facilities_outdoor": {
        definition: {
          name: "Recreation Facilities (Outdoor)",
          icon: Trees,
          definition: "A building or place used for outdoor recreation, including a golf course, golf driving range, mini-golf centre, tennis court, paint-ball centre, lawn bowling green, outdoor swimming pool, equestrian centre, skate board ramp, go-kart track, rifle range, water-ski centre or any other building or place of a like character.",
          parent: "recreation_facilities"
        }
      },
      "recreation_facilities_major": {
        definition: {
          name: "Recreation Facilities (Major)",
          icon: Building2,
          definition: "A building or place used for large-scale sporting or recreation activities that are attended by large numbers of people whether regularly or periodically.",
          parent: "recreation_facilities"
        }
      }
    }
  },

  "transport_facilities": {
    definition: {
      name: "Transport Facilities",
      icon: Train,
      definition: "Infrastructure and facilities that support the movement of people and goods.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "air_transport_facilities": {
        definition: {
          name: "Air Transport Facilities",
          icon: Plane,
          definition: "Facilities used for the landing, taking off, parking, maintenance or repair of aircraft.",
          parent: "transport_facilities"
        },
        children: {
          "airports": {
            definition: {
              name: "Airports",
              icon: Plane,
              definition: "A place used for the landing, taking off, parking, maintenance or repair of aeroplanes or helicopters.",
              parent: "air_transport_facilities"
            }
          },
          "heliports": {
            definition: {
              name: "Heliports",
              icon: Plane,
              definition: "A place used for the landing, taking off, parking, maintenance or repair of helicopters.",
              parent: "air_transport_facilities"
            }
          }
        }
      },
      "freight_transport_facilities": {
        definition: {
          name: "Freight Transport Facilities",
          icon: Truck,
          definition: "A facility used principally for the bulk handling of goods for transport by road, rail, air or sea.",
          parent: "transport_facilities"
        }
      },
      "passenger_transport_facilities": {
        definition: {
          name: "Passenger Transport Facilities",
          icon: Train,
          definition: "A building or place used for the assembly or dispersal of passengers by any form of transport.",
          parent: "transport_facilities"
        }
      },
      "port_facilities": {
        definition: {
          name: "Port Facilities",
          icon: Ship,
          definition: "Facilities used for the loading, unloading and storage of cargo or the embarking and disembarking of passengers.",
          parent: "transport_facilities"
        }
      },
      "road_transport_terminals": {
        definition: {
          name: "Road Transport Terminals",
          icon: Truck,
          definition: "A building or place used for the principal purpose of the bulk handling of goods for transport by road.",
          parent: "transport_facilities"
        }
      }
    }
  },

  "infrastructure": {
    definition: {
      name: "Infrastructure",
      icon: Building2,
      definition: "Basic physical structures and facilities needed for the operation of a society or enterprise."
    },
    children: {
      "utility_infrastructure": {
        definition: {
          name: "Utility Infrastructure",
          icon: Zap,
          definition: "Infrastructure for essential utilities and services."
        }
      },
      "water_infrastructure": {
        definition: {
          name: "Water Infrastructure",
          icon: Droplet,
          definition: "Infrastructure for water supply and management."
        }
      }
    }
  },

  "waste_or_resource_management": {
    definition: {
      name: "Waste or Resource Management Facilities",
      icon: Trash2,
      definition: "Facilities used for the management, recycling, or disposal of waste materials.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "resource_recovery_facilities": {
        definition: {
          name: "Resource Recovery Facilities",
          icon: Recycle,
          definition: "Facilities used for recovering resources from waste, including sorting, processing, or recycling.",
          parent: "waste_or_resource_management"
        }
      },
      "waste_disposal_facilities": {
        definition: {
          name: "Waste Disposal Facilities",
          icon: Trash2,
          definition: "Facilities used for the disposal of waste by landfill, thermal treatment or other means.",
          parent: "waste_or_resource_management"
        }
      },
      "waste_transfer_stations": {
        definition: {
          name: "Waste Transfer Stations",
          icon: Truck,
          definition: "Facilities used for collecting and temporarily storing waste or recyclable materials.",
          parent: "waste_or_resource_management"
        }
      }
    }
  },

  "environmental_facilities": {
    definition: {
      name: "Environmental Facilities",
      icon: Leaf,
      definition: "A building or place that provides for the biological, physical, cultural or social aspects of the environment.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    }
  },

  "waterway_facilities": {
    definition: {
      name: "Waterway Facilities",
      icon: Waves,
      definition: "Facilities that support the use of waterways for transport, recreation, or other purposes.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "jetties": {
        definition: {
          name: "Jetties",
          icon: Anchor,
          definition: "A permanent structure extending from the shore into the waterway used for mooring vessels or recreation.",
          parent: "waterway_facilities"
        }
      },
      "marinas": {
        definition: {
          name: "Marinas",
          icon: Sailboat,
          definition: "A permanent boat storage facility together with any associated facilities.",
          parent: "waterway_facilities"
        }
      },
      "mooring": {
        definition: {
          name: "Mooring",
          icon: Anchor,
          definition: "A place in the waterway where vessels can be secured.",
          parent: "waterway_facilities"
        }
      },
      "mooring_pens": {
        definition: {
          name: "Mooring Pens",
          icon: Anchor,
          definition: "An arrangement of freestanding piles or other restraining devices designed for the securing of a vessel.",
          parent: "waterway_facilities"
        }
      },
      "water_recreation_structures": {
        definition: {
          name: "Water Recreation Structures",
          icon: Waves,
          definition: "A structure used primarily for recreational purposes that has a direct structural connection between the shore and the waterway.",
          parent: "waterway_facilities"
        }
      }
    }
  },

  "miscellaneous_uses": {
    definition: {
      name: "Miscellaneous Uses",
      icon: Building2,
      definition: "Various other land uses not classified in other categories.",
      legislation: "Standard Instrument—Principal Local Environmental Plan"
    },
    children: {
      "cemeteries": {
        definition: {
          name: "Cemeteries",
          icon: Cross,
          definition: "A building or place used primarily for the interment of deceased persons or pets or their ashes.",
          parent: "miscellaneous_uses"
        }
      },
      "crematoria": {
        definition: {
          name: "Crematoria",
          icon: Building,
          definition: "A building in which deceased persons or pets are cremated.",
          parent: "miscellaneous_uses"
        }
      },
      "environmental_protection_works": {
        definition: {
          name: "Environmental Protection Works",
          icon: Shield,
          definition: "Works associated with the rehabilitation of land towards its natural state or any work to protect land from environmental degradation.",
          parent: "miscellaneous_uses"
        }
      },
      "exhibition_homes": {
        definition: {
          name: "Exhibition Homes",
          icon: Home,
          definition: "A dwelling built for the purposes of the public exhibition and marketing of new dwellings.",
          parent: "miscellaneous_uses"
        }
      },
      "exhibition_villages": {
        definition: {
          name: "Exhibition Villages",
          icon: Home,
          definition: "A group of buildings or places used for the public exhibition and marketing of new dwellings.",
          parent: "miscellaneous_uses"
        }
      },
      "extractive_industries": {
        definition: {
          name: "Extractive Industries",
          icon: Construction,
          definition: "The winning or removal of extractive materials (including sand, stone, and gravel) from land.",
          parent: "miscellaneous_uses"
        }
      },
      "flood_mitigation_works": {
        definition: {
          name: "Flood Mitigation Works",
          icon: Droplet,
          definition: "Works associated with the mitigation of flood impacts.",
          parent: "miscellaneous_uses"
        }
      },
      "mortuaries": {
        definition: {
          name: "Mortuaries",
          icon: Building,
          definition: "Premises that are used, or intended to be used, for the receiving, preparation, embalming and storage of bodies of deceased persons pending their interment or cremation.",
          parent: "miscellaneous_uses"
        }
      },
      "open_cut_mining": {
        definition: {
          name: "Open Cut Mining",
          icon: Construction,
          definition: "Mining carried out on, and by excavating, the earth's surface.",
          parent: "miscellaneous_uses"
        }
      }
    }
  },

  "public_facilities": {
    definition: {
      name: "Public Facilities",
      icon: Building,
      definition: "Buildings and places used for public purposes",
      children: {
        "public_administration_building": {
          definition: {
            name: "Public Administration Building",
            icon: Building,
            definition: "A building used as offices or for administrative or other like purposes by the Crown, a statutory body, a council or an organisation established for public purposes, including a courthouse or police station.",
            parent: "public_facilities"
          }
        },
        "emergency_services_facilities": {
          definition: {
            name: "Emergency Services Facilities", 
            icon: Siren,
            definition: "A building or place used in connection with the provision of emergency services by an emergency services organization.",
            parent: "public_facilities"
          }
        }
      }
    }
  },

  "waste_management": {
    definition: {
      name: "Waste Management",
      icon: Trash2,
      definition: "Facilities for waste disposal and resource recovery",
      children: {
        "resource_recovery_facility": {
          definition: {
            name: "Resource Recovery Facility",
            icon: Recycle,
            definition: "A building or place used for the recovery of resources from waste, including works or activities such as separating and sorting, processing or treating the waste, composting, temporary storage, transfer or sale of recovered resources, energy generation from gases and water treatment.",
            parent: "waste_management",
            legislation: "Standard Instrument—Principal Local Environmental Plan"
          }
        },
        "waste_disposal_facility": {
          definition: {
            name: "Waste Disposal Facility",
            icon: Trash2,
            definition: "A building or place used for the disposal of waste by landfill, incineration or other means, including recycling, resource recovery, energy generation from gases, leachate management, odour control and extractive material winning.",
            parent: "waste_management",
            legislation: "Standard Instrument—Principal Local Environmental Plan"
          }
        }
      }
    }
  }
}; 