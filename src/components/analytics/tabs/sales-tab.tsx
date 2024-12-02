import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { getPropertyBounds } from '../utils/property-utils';
import * as L from 'leaflet';
import * as turf from '@turf/turf';

// Helper function for price formatting
function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

interface Sale {
  bp_address: string;
  sale_date: string;
  price: number;
  distance: number;
  coordinates: [number, number];
}

interface SaleData {
  loading: boolean;
  error: string | null;
  propertyData: {
    lastSaleDate: string | null;
    lastSalePrice: number | null;
  };
  nearbySales: Array<Sale> | null;
}

// SaleCard component for consistent sale display
function SaleCard({ sale, index }: { sale: Sale; index: number }) {
  const [streetAddress, locality] = sale.bp_address.split(',').map(s => s.trim());
  
  return (
    <div className="flex items-center py-1.5">
      <div className="w-6 h-6 flex-shrink-0 border border-red-500 rounded-full flex items-center justify-center text-xs font-medium text-red-500">
        {index + 1}
      </div>
      <div className="grid grid-cols-12 flex-1 gap-0 min-w-0 ml-2">
        <div className="col-span-6">
          <div className="text-xs truncate" title={streetAddress}>
            {streetAddress}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={locality}>
            {locality}
          </div>
        </div>
        <div className="col-span-3 text-xs">
          {new Date(sale.sale_date).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
        <div className="col-span-2 text-xs font-semibold text-blue-600">
          {formatPrice(sale.price)}
        </div>
        <div className="col-span-1 text-xs text-muted-foreground text-right">
          {Math.round(sale.distance)}m
        </div>
      </div>
    </div>
  );
}

const ensureMapPanes = (map: L.Map) => {
  if (!map.getPane('sales-pane')) {
    map.createPane('sales-pane');
    map.getPane('sales-pane')!.style.zIndex = '600';
  }
  if (!map.getPane('sales-popup-pane')) {
    map.createPane('sales-popup-pane');
    map.getPane('sales-popup-pane')!.style.zIndex = '650';
  }
};

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
      // Ensure panes exist
      ensureMapPanes(map);

      // If markers are showing, remove them
      if (isShowingOnMap) {
        if (salesLayerRef.current) {
          map.removeLayer(salesLayerRef.current);
          salesLayerRef.current = null;
        }
        setIsShowingOnMap(false);
        return;
      }

      // Create a new layer group
      salesLayerRef.current = L.layerGroup();
      const bounds = L.latLngBounds([]);

      // Add markers for each sale
      salesData.nearbySales.forEach((sale, index) => {
        const latLng = L.latLng(sale.coordinates[1], sale.coordinates[0]);
        bounds.extend(latLng);
        
        const marker = L.marker(latLng, {
          icon: createMarkerIcon(index),
          pane: 'sales-pane'
        });

        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${sale.bp_address}</h3>
            <p class="text-sm text-gray-600">
              ${new Date(sale.sale_date).toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
            <p class="text-sm font-semibold text-blue-600">
              ${formatPrice(sale.price)}
            </p>
            <p class="text-sm text-gray-600">
              Distance: ${(sale.distance).toFixed(0)}m
            </p>
          </div>
        `, {
          pane: 'sales-popup-pane'
        });
        
        salesLayerRef.current?.addLayer(marker);
      });

      // Add selected property to bounds
      if (selectedProperty?.geometry) {
        const propertyBounds = getPropertyBounds(selectedProperty.geometry);
        if (propertyBounds) {
          bounds.extend(propertyBounds);
        }
      }

      // Add layer to map and fit bounds
      if (salesLayerRef.current) {
        salesLayerRef.current.addTo(map);
        map.fitBounds(bounds, { padding: [50, 50] });
        setIsShowingOnMap(true);
      }

    } catch (error) {
      console.error('Error showing sales on map:', error);
      setIsShowingOnMap(false);
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

      // Clear previous data and show loading state
      if (isMounted) {
        setSalesData(prev => ({
          ...prev,
          loading: true,
          error: null,
          propertyData: {
            lastSaleDate: null,
            lastSalePrice: null
          },
          nearbySales: null
        }));
      }

      try {
        // First fetch the selected property's sale data using propId
        const propertyResponse = await fetch(
          `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?where=propid=${selectedProperty.propId}&outFields=sale_date,price&f=json`,
          { signal: controller.signal }
        );

        if (!propertyResponse.ok) {
          throw new Error('Failed to fetch property sales data');
        }

        const propertyData = await propertyResponse.json();

        // Then fetch nearby sales using geometry
        const rings = selectedProperty.geometry.rings[0].map((coord: number[]) => {
          const x = (coord[0] * 180) / 20037508.34;
          const y = (Math.atan(Math.exp((coord[1] * Math.PI) / 20037508.34)) * 360 / Math.PI - 90);
          return [x, y];
        });

        const centerX = rings.reduce((sum, coord) => sum + coord[0], 0) / rings.length;
        const centerY = rings.reduce((sum, coord) => sum + coord[1], 0) / rings.length;

        const bufferDegrees = 0.01; // roughly 1km
        const bbox = `${centerX-bufferDegrees},${centerY-bufferDegrees},${centerX+bufferDegrees},${centerY+bufferDegrees}`;

        const response = await fetch(
          `https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query?` +
          `where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&` +
          `spatialRel=esriSpatialRelIntersects&outFields=sale_date,price,bp_address&` +
          `returnGeometry=true&outSR=4326&f=json`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch nearby sales data');
        }

        const data = await response.json();

        const today = new Date();
        const twelveMonthsAgo = new Date(today.setMonth(today.getMonth() - 12));

        const nearbySalesFiltered = data.features
          ?.filter((f: any) => {
            const sale = {
              ...f.attributes,
              date: new Date(f.attributes.sale_date)
            };
            return sale.date >= twelveMonthsAgo && f.attributes.propid !== selectedProperty.propId;
          })
          .map((f: any) => {
            return {
              sale_date: f.attributes.sale_date,
              price: f.attributes.price,
              bp_address: f.attributes.bp_address,
              distance: turf.distance(
                turf.point([centerX, centerY]),
                turf.point([f.geometry.x, f.geometry.y]),
                { units: 'meters' }
              ),
              coordinates: [f.geometry.x, f.geometry.y]
            };
          })
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, 10);

        // Only update state if the component is still mounted
        if (isMounted) {
          setSalesData({
            loading: false,
            error: null,
            propertyData: {
              lastSaleDate: propertyData.features?.[0]?.attributes?.sale_date || null,
              lastSalePrice: propertyData.features?.[0]?.attributes?.price || null
            },
            nearbySales: nearbySalesFiltered
          });
        }
      } catch (error: any) {
        // Don't update state if the error is due to abort
        if (error.name === 'AbortError') {
          return;
        }
        
        if (isMounted) {
          setSalesData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to fetch sales data',
            propertyData: {
              lastSaleDate: null,
              lastSalePrice: null
            },
            nearbySales: null
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
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Property Sales History</CardTitle>
          <CardDescription>Last recorded sale for this property</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.propertyData.lastSalePrice ? (
            <div className="space-y-2">
              <p>
                <strong>Last Sale Date:</strong>{' '}
                {new Date(salesData.propertyData.lastSaleDate!).toLocaleDateString('en-AU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p>
                <strong>Sale Price:</strong>{' '}
                {formatPrice(salesData.propertyData.lastSalePrice)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No sales history found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nearby Sales</CardTitle>
          <CardDescription>Recent sales within 1km radius</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.nearbySales && salesData.nearbySales.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground mb-2">
                <div className="col-span-6 pl-8">Address</div>
                <div className="col-span-3 pl-[32px]">Date</div>
                <div className="col-span-2 pl-[16px]">Price</div>
                <div className="col-span-1 text-right">Dist.</div>
              </div>
              {salesData.nearbySales.map((sale, index) => (
                <SaleCard key={index} sale={sale} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No nearby sales found</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleToggleOnMap}
            className="w-full"
            disabled={isLayerLoading || !salesData.nearbySales?.length}
            variant={isShowingOnMap ? "secondary" : "default"}
          >
            {isLayerLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isShowingOnMap ? "Removing from map..." : "Adding to map..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                {isShowingOnMap ? "Hide on Map" : "Show on Map"}
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const createMarkerIcon = (index: number) => {
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center" style="border: 2px solid #ef4444">
          <span class="text-sm font-medium" style="color: #ef4444">${index + 1}</span>
        </div>
      </div>
    `,
    className: 'sale-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};
