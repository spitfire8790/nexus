import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { getPropertyBounds } from '../utils/property-utils';
import * as L from 'leaflet';

interface SaleData {
  loading: boolean;
  error: string | null;
  propertyData: {
    lastSaleDate: string | null;
    lastSalePrice: number | null;
  };
  nearbySales: Array<{
    bp_address: string;
    sale_date: string;
    price: number;
    distance: number;
    coordinates: [number, number];
  }> | null;
}

export function SalesTab() {
  const map = useMapStore((state) => state.mapInstance);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [isShowingOnMap, setIsShowingOnMap] = useState(false);
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  const salesLayerRef = useRef<L.LayerGroup | null>(null);
  const [salesData, setSalesData] = useState<SaleData>({
    loading: false,
    error: null,
    propertyData: {
      lastSaleDate: null,
      lastSalePrice: null
    },
    nearbySales: null
  });

  // Reset state when property changes
  useEffect(() => {
    if (salesLayerRef.current) {
      map?.removeLayer(salesLayerRef.current);
      salesLayerRef.current = null;
    }
    setIsShowingOnMap(false);
  }, [selectedProperty, map]);

  const handleToggleOnMap = async () => {
    if (!salesData.nearbySales?.length || !map) return;
    
    setIsLayerLoading(true);
    try {
      // Remove existing markers if they exist
      if (salesLayerRef.current) {
        map.removeLayer(salesLayerRef.current);
        salesLayerRef.current = null;
        setIsShowingOnMap(false);
        return;
      }

      // Create a layer group only after ensuring map is ready
      await new Promise(resolve => {
        if (map.getContainer()) {
          resolve(true);
        } else {
          map.once('load', () => resolve(true));
        }
      });

      salesLayerRef.current = L.layerGroup();
      const bounds = L.latLngBounds([]);

      // Add markers for each sale
      salesData.nearbySales.forEach((sale, index) => {
        const point = L.point(sale.coordinates[0], sale.coordinates[1]);
        const latLng = L.CRS.EPSG3857.unproject(point);
        bounds.extend(latLng);

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-white border-2 border-red-500 text-red-500 text-xs font-medium">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        const marker = L.marker(latLng, { icon })
          .bindPopup(`
            <div class="text-sm">
              <div class="font-medium">${sale.bp_address}</div>
              <div>${new Date(sale.sale_date).toLocaleDateString()}</div>
              <div class="font-semibold text-blue-600">$${sale.price.toLocaleString()}</div>
              <div>${(sale.distance/1000).toFixed(1)}km away</div>
            </div>
          `);
        
        salesLayerRef.current?.addLayer(marker);
      });

      // Add selected property to bounds
      if (selectedProperty?.geometry) {
        const propertyBounds = getPropertyBounds(selectedProperty.geometry);
        if (propertyBounds) {
          bounds.extend(propertyBounds);
        }
      }

      // Add layer to map
      if (salesLayerRef.current) {
        salesLayerRef.current.addTo(map);
        map.fitBounds(bounds, { padding: [50, 50] });
        setIsShowingOnMap(true);
      }

    } catch (error) {
      console.error('Error showing sales on map:', error);
    } finally {
      setIsLayerLoading(false);
    }
  };

  // Cleanup on unmount or tab change
  useEffect(() => {
    return () => {
      if (map && salesLayerRef.current) {
        map.removeLayer(salesLayerRef.current);
        salesLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSalesData() {
      if (!selectedProperty?.geometry || !selectedProperty?.propId) {
        console.log('⚠️ No property geometry or ID available');
        return;
      }

      console.log('🔄 Starting sales data fetch for property:', selectedProperty.propId);
      
      if (isMounted) {
        setSalesData(prev => ({
          ...prev,
          loading: true,
          error: null
        }));
      }

      try {
        // First fetch the selected property's sale data using propId
        console.log('🎯 Fetching selected property sale data for propId:', selectedProperty.propId);
        const propertyResponse = await fetch(
          `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?where=propid=${selectedProperty.propId}&outFields=sale_date,price&f=json`,
          { signal: controller.signal }
        );

        if (!propertyResponse.ok) {
          throw new Error('Failed to fetch property sales data');
        }

        const propertyData = await propertyResponse.json();
        console.log('📊 Property sales data:', propertyData);

        // Now fetch nearby sales
        const response = await fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Property/MapServer/1/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=*` +
          `&returnGeometry=true` +
          `&f=json`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch nearby sales data');
        }

        const data = await response.json();
        console.log('📊 Nearby sales data:', data);

        if (isMounted) {
          setSalesData({
            loading: false,
            error: null,
            propertyData: {
              lastSaleDate: propertyData.features?.[0]?.attributes?.sale_date || null,
              lastSalePrice: propertyData.features?.[0]?.attributes?.price || null
            },
            nearbySales: data.features
              ?.map((feature: any) => ({
                bp_address: feature.attributes.bp_address,
                sale_date: feature.attributes.sale_date,
                price: feature.attributes.price,
                distance: feature.attributes.distance || 0,
                coordinates: [feature.geometry.x, feature.geometry.y]
              }))
              .sort((a: any, b: any) => b.sale_date - a.sale_date)
              .slice(0, 10) || null
          });
        }
      } catch (error: any) {
        console.error('Error fetching sales data:', error);
        if (isMounted) {
          setSalesData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to fetch sales data'
          }));
        }
      }
    }

    fetchSalesData();

    return () => {
      controller.abort();
    };
  }, [selectedProperty?.propId, selectedProperty?.geometry]);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view sales history</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (salesData.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (salesData.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{salesData.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {salesData.propertyData.lastSalePrice && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Last Sale</h3>
          <div className="text-sm space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              ${salesData.propertyData.lastSalePrice.toLocaleString()}
            </p>
            {salesData.propertyData.lastSaleDate && (
              <p className="text-muted-foreground">
                {new Date(salesData.propertyData.lastSaleDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </Card>
      )}

      {salesData.nearbySales?.length ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Nearby Sales</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleOnMap}
              disabled={isLayerLoading}
            >
              {isLayerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  {isShowingOnMap ? 'Hide on Map' : 'Show on Map'}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {salesData.nearbySales.map((sale, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{sale.bp_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-semibold text-blue-600">
                      ${sale.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(sale.distance/1000).toFixed(1)}km away
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Alert>
          <AlertTitle>No recent sales found in this area</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
