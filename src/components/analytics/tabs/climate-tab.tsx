import { useEffect, useState } from 'react';
import ReactApexCharts from 'react-apexcharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useMapStore } from '@/lib/map-store';

interface ClimateData {
  ssp126: Array<{ x: string; y: number }>;
  ssp370: Array<{ x: string; y: number }>;
}

export function ClimateTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [temperatureData, setTemperatureData] = useState<ClimateData | null>(null);
  const [rainfallData, setRainfallData] = useState<ClimateData | null>(null);
  const [fireWeatherData, setFireWeatherData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartHeight = 280;

  const fetchData = async (geometry: any, baseUrl: string, setData: (data: ClimateData) => void) => {
    if (!geometry?.rings?.[0]) return;

    try {
      // Convert Web Mercator coordinates to [longitude, latitude]
      const coordinates = geometry.rings[0].map((coord: number[]) => [
        coord[0] * 180 / 20037508.34,
        Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
      ]);

      // Calculate centroid
      const centroid = coordinates.reduce((acc, curr) => ({
        x: acc.x + curr[0] / coordinates.length,
        y: acc.y + curr[1] / coordinates.length
      }), { x: 0, y: 0 });

      const params = new URLSearchParams({
        geometry: `${centroid.x},${centroid.y}`,
        geometryType: 'esriGeometryPoint',
        sr: '4283',
        layers: 'all',
        layerDefs: '',
        time: '',
        layerTimeOptions: '',
        tolerance: '2',
        mapExtent: '140.91758728027344,-37.78348892211913,154.83758728027342,-28.10348892211914',
        imageDisplay: '800,600,96',
        returnGeometry: 'false',
        maxAllowableOffset: '',
        f: 'json'
      });

      const response = await fetch(`${baseUrl}/identify?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data?.results) throw new Error('No data returned from server');

      const timePeriods: { [key: number]: string } = {
        0: "2020-2039", 1: "2030-2049", 2: "2040-2059",
        3: "2050-2069", 4: "2060-2070", 5: "2070-2089",
        6: "2080-2099", 35: "2020-2039", 36: "2030-2049",
        37: "2040-2059", 38: "2050-2069", 39: "2070-2089",
        40: "2080-2099", 41: "2080-2099"
      };

      const ssp126Data = data.results
        .filter((result: any) => result.layerId >= 0 && result.layerId <= 6)
        .map((result: any) => ({
          x: timePeriods[result.layerId],
          y: Number(result.attributes["Pixel Value"])
        }))
        .sort((a: any, b: any) => parseInt(a.x) - parseInt(b.x));

      const ssp370Data = data.results
        .filter((result: any) => result.layerId >= 35 && result.layerId <= 41)
        .map((result: any) => ({
          x: timePeriods[result.layerId],
          y: Number(result.attributes["Pixel Value"])
        }))
        .sort((a: any, b: any) => parseInt(a.x) - parseInt(b.x));

      setData({ ssp126: ssp126Data, ssp370: ssp370Data });
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!selectedProperty?.geometry) return;

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchData(
            selectedProperty.geometry,
            'https://mapprod.environment.nsw.gov.au/arcgis/rest/services/NARCliM2/Tas/MapServer',
            setTemperatureData
          ),
          fetchData(
            selectedProperty.geometry,
            'https://mapprod.environment.nsw.gov.au/arcgis/rest/services/NARCliM2/Pr/MapServer',
            setRainfallData
          ),
          fetchData(
            selectedProperty.geometry,
            'https://mapprod.environment.nsw.gov.au/arcgis/rest/services/NARCliM2/FFDI_gt50/MapServer',
            setFireWeatherData
          )
        ]);
      } catch (err) {
        setError('Failed to fetch climate data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedProperty?.geometry]);

  const getChartOptions = (title: string, yAxisTitle: string, tooltipSuffix: string, showZeroLine = true) => ({
    chart: {
      type: 'line',
      height: chartHeight,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      toolbar: { show: false },
      fontFamily: 'inherit',
      parentHeightOffset: 0
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#2563EB', '#DC2626'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    markers: {
      size: 5,
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 7 }
    },
    xaxis: {
      type: 'category',
      labels: {
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
        style: { 
          fontSize: '10px'
        }
      },
      axisBorder: { show: true },
      axisTicks: { show: true },
      tickPlacement: 'on'
    },
    yaxis: {
      title: {
        text: yAxisTitle,
        style: {
          fontSize: '11px',
          fontWeight: 500
        }
      },
      labels: {
        style: { fontSize: '11px' }
      },
      decimalsInFloat: 1,
      forceNiceScale: true,
      tickAmount: 8
    },
    grid: {
      borderColor: '#f3f4f6',
      strokeDashArray: 4,
      padding: {
        top: 5,
        right: 45,
        bottom: 5,
        left: 15
      },
      xaxis: {
        lines: { show: true }
      }
    },
    annotations: showZeroLine ? {
      yaxis: [{
        y: 0,
        strokeDashArray: 5,
        borderColor: '#718096',
        opacity: 0.5,
        width: '100%'
      }]
    } : undefined,
    tooltip: {
      y: {
        formatter: (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}${tooltipSuffix}`
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      fontWeight: 500,
      markers: {
        width: 8,
        height: 8,
        radius: 8
      },
      itemMargin: {
        horizontal: 8
      }
    }
  });

  const getFinalValue = (data: Array<{ x: string; y: number }>) => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1].y;
  };

  const renderSummaryCard = (data: Array<{ x: string; y: number }>, title: string, colorClass: string, unit: string) => {
    const finalValue = getFinalValue(data);
    if (finalValue === null) return null;

    return (
      <div className={`py-1 px-2 ${colorClass} rounded-lg`}>
        <div className={`text-[10px] ${colorClass.includes('blue') ? 'text-blue-600' : 'text-red-600'}`}>
          {title} by 2099
        </div>
        <div className={`text-base font-bold ${colorClass.includes('blue') ? 'text-blue-900' : 'text-red-900'}`}>
          {finalValue >= 0 ? '+' : ''}{finalValue.toFixed(1)}{unit}
        </div>
      </div>
    );
  };

  const renderChart = (data: ClimateData | null, title: string, yAxisTitle: string, tooltipSuffix: string) => {
    if (!data) return null;

    return (
      <Card className="mb-3">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ minHeight: chartHeight }}>
            <ReactApexCharts
              type="line"
              height={chartHeight}
              options={getChartOptions(title, yAxisTitle, tooltipSuffix)}
              series={[
                {
                  name: 'Emission Scenario: SSP1-26',
                  data: data.ssp126 || []
                },
                {
                  name: 'Emission Scenario: SSP3-7.0',
                  data: data.ssp370 || []
                }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {renderSummaryCard(data.ssp126, 'SSP1-26', 'bg-blue-50', tooltipSuffix)}
            {renderSummaryCard(data.ssp370, 'SSP3-7.0', 'bg-red-50', tooltipSuffix)}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view climate projections</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {renderChart(temperatureData, 'Temperature Change', 'Change in Temperature (°C)', '°C')}
      {renderChart(rainfallData, 'Rainfall Change', 'Change in Rainfall (%)', '%')}
      {renderChart(fireWeatherData, 'Severe Fire Weather Days', 'Change in Days', ' days')}
    </div>
  );
} 