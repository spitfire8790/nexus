import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { loadPopulationData } from '@/lib/population-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  ComposedChart,
  Line,
  ReferenceArea
} from 'recharts';
import { usePropertyDataStore } from '@/lib/property-data-store';

interface DemographicData {
  totalPopulation: number;
  medianAge: number;
  medianIncome: number;
  householdSize: number;
  genderData: { name: string; value: number }[];
  ageData: { name: string; value: number }[];
  loading: boolean;
  error: string | null;
}

interface PopulationData {
  year: number;
  population: number;
}

const COLORS = ['#C084FC', '#44B9FF'];

function normalizeGeometry(geometry: any) {
  // If the geometry is already in Web Mercator (wkid: 102100), return it
  if (geometry.spatialReference?.wkid === 102100) {
    return geometry;
  }

  // If it's in WGS84 (wkid: 4326), convert it
  if (geometry.spatialReference?.wkid === 4326) {
    const convertedRings = geometry.rings.map((ring: number[][]) =>
      ring.map(([lon, lat]) => [
        (lon * 20037508.34) / 180,
        Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180
      ])
    );

    return {
      rings: convertedRings,
      spatialReference: { wkid: 102100 }
    };
  }

  // If no spatial reference, assume Web Mercator and add it
  return {
    ...geometry,
    spatialReference: { wkid: 102100 }
  };
}

export function DemographicsTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const { propertyData, setPropertyData, setLoading, setError } = usePropertyDataStore();

  useEffect(() => {
    if (!selectedProperty?.geometry) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Convert Web Mercator to WGS84 coordinates
        const rings = selectedProperty.geometry.rings[0];
        const centerX = rings.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / rings.length;

        // Convert to WGS84
        const longitude = (centerX * 180) / 20037508.34;
        const latitude = (Math.atan(Math.exp((centerY * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);

        // Fetch both demographic and population data
        const [censusResponse, populationResponse] = await Promise.all([
          fetch(
            `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ABS_2021_Census_G01_Selected_person_characteristics_by_sex_Beta/FeatureServer/5/query?` +
            `geometry=${longitude},${latitude}&` +
            `geometryType=esriGeometryPoint&` +
            `inSR=4326&` +
            `spatialRel=esriSpatialRelIntersects&` +
            `outFields=*&` +
            `returnGeometry=false&` +
            `f=json`
          ),
          fetch(
            `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ABS_Estimated_resident_population_2001_2021_Beta/FeatureServer/0/query?` +
            `geometry=${longitude},${latitude}&` +
            `geometryType=esriGeometryPoint&` +
            `inSR=4326&` +
            `spatialRel=esriSpatialRelIntersects&` +
            `outFields=*&` +
            `returnGeometry=false&` +
            `f=json`
          )
        ]);

        if (!censusResponse.ok || !populationResponse.ok) {
          throw new Error('Failed to fetch demographic data');
        }

        const censusData = await censusResponse.json();
        const populationData = await populationResponse.json();

        console.log('Census Data:', censusData);
        console.log('Population Data:', populationData);

        if (!censusData.features?.[0]?.attributes) {
          throw new Error('No demographic data found for this area');
        }

        const attributes = censusData.features[0].attributes;

        // Calculate gender distribution using correct field names
        const total = (attributes.Tot_P_F || 0) + (attributes.Tot_P_M || 0);
        const genderData = [
          { name: 'Female', value: total ? (attributes.Tot_P_F || 0) / total : 0 },
          { name: 'Male', value: total ? (attributes.Tot_P_M || 0) / total : 0 }
        ];

        // Calculate age distribution
        const ageData = [
          { name: '0-4', value: attributes.Age_0_4_yr_P || 0 },
          { name: '5-14', value: attributes.Age_5_14_yr_P || 0 },
          { name: '15-19', value: attributes.Age_15_19_yr_P || 0 },
          { name: '20-24', value: attributes.Age_20_24_yr_P || 0 },
          { name: '25-34', value: attributes.Age_25_34_yr_P || 0 },
          { name: '35-44', value: attributes.Age_35_44_yr_P || 0 },
          { name: '45-54', value: attributes.Age_45_54_yr_P || 0 },
          { name: '55-64', value: attributes.Age_55_64_yr_P || 0 },
          { name: '65-74', value: attributes.Age_65_74_yr_P || 0 },
          { name: '75-84', value: attributes.Age_75_84_yr_P || 0 },
          { name: '85+', value: attributes.Age_85ov_P || 0 }
        ];

        const demographicData = {
          totalPopulation: total,
          medianAge: attributes.Median_age_persons || 0,
          medianIncome: attributes.Median_tot_prsnl_inc_weekly || 0,
          householdSize: attributes.Average_household_size || 0,
          genderData,
          ageData,
        };

        // Fetch SA2 name for population projections
        const sa2Response = await fetch(
          `https://services1.arcgis.com/v8Kimc579yljmjSP/ArcGIS/rest/services/ASGS_2021_SA2/FeatureServer/0/query?` +
          `geometry=${longitude},${latitude}&` +
          `geometryType=esriGeometryPoint&` +
          `inSR=4326&` +
          `spatialRel=esriSpatialRelIntersects&` +
          `outFields=SA2_NAME_2021&` +
          `returnGeometry=false&` +
          `f=json`
        );

        const sa2Data = await sa2Response.json();
        const sa2Name = sa2Data.features?.[0]?.attributes?.SA2_NAME_2021;

        if (sa2Name) {
          const populationProjections = await loadPopulationData();
          const yearlyData = populationProjections[sa2Name];

          if (yearlyData) {
            const populationData = Object.entries(yearlyData)
              .map(([year, population]) => ({
                year: Number(year),
                population: Number(population)
              }))
              .sort((a, b) => a.year - b.year);

            setPropertyData('demographics', { ...demographicData, populationData });
          } else {
            setPropertyData('demographics', demographicData);
          }
        } else {
          setPropertyData('demographics', demographicData);
        }
      } catch (error: any) {
        console.error('Error fetching demographic data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch demographic data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty?.geometry, setPropertyData, setLoading, setError]);

  if (propertyData.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (propertyData.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{propertyData.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  const data = propertyData.demographics;
  if (!data) {
    return null;
  }

  return (
    <div className="p-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="flex items-center justify-center h-[60px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.genderData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex h-8">
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${data.genderData[0].value * 100}%`,
                    backgroundColor: COLORS[0]
                  }} 
                />
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${data.genderData[1].value * 100}%`,
                    backgroundColor: COLORS[1]
                  }} 
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: COLORS[0] }}></div>
                  Female {(data.genderData[0].value * 100).toFixed(1)}%
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: COLORS[1] }}></div>
                  Male {(data.genderData[1].value * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No demographic data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.ageData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.ageData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#1E4FD9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No age data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Population Over Time</CardTitle>
          <CardDescription>Historical and projected population for this SA2 region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.populationData ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data.populationData}>
                  <ReferenceArea
                    x1="2020"
                    x2="2022"
                    fill="#d7153a"
                    fillOpacity={0.1}
                    label={{
                      value: "COVID-19 Period",
                      position: "insideTop",
                      fill: "#d7153a",
                      fontSize: 12
                    }}
                  />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => value.toString()}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        const relevantData = payload.find(p => 
                          label <= 2024 ? p.name === "Historical" : p.name === "Projected"
                        );
                        
                        if (!relevantData) return null;

                        return (
                          <div className="bg-popover text-popover-foreground rounded-md shadow-md p-2 text-sm">
                            <div>{label}</div>
                            <div className="font-medium">
                              {relevantData.name}: {relevantData.value.toLocaleString()}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    name="Historical"
                    type="monotone"
                    data={data.populationData.filter(d => d.year <= 2024)}
                    dataKey="population"
                    stroke="#1E4FD9"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Projected"
                    type="monotone"
                    data={data.populationData.filter(d => d.year > 2024)}
                    dataKey="population"
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No population data available</p>
            )}
            <div className="text-xs text-muted-foreground italic">
              <a 
                href="https://www.planning.nsw.gov.au/research-and-demography/population-projections/explore-the-data"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Source: NSW Department of Planning, Housing and Infrastructure
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
