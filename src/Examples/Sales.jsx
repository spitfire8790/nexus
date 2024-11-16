import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as turf from '@turf/turf';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Polygon, WMSTileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split(' ');
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return new Date(parseInt(year), months[month], parseInt(day));
};

const formatDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return '';
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const Section = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow p-3 mb-2"
  >
    <div className="flex items-center mb-2">
      <div className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const Legend = ({ salesData }) => (
  <div className="bg-white rounded p-2 shadow-md absolute bottom-4 left-4 z-[1000] max-h-[300px] overflow-y-auto">
    <div className="text-sm font-medium mb-2">Legend</div>
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="w-5 h-5 mr-2 border-2 border-blue-500 bg-blue-100"></div>
        <span className="text-xs">Selected Property</span>
      </div>
      {salesData.map((sale, index) => (
        <div key={index} className="flex items-center">
          <div className="w-5 h-5 mr-2 border-2 border-red-500 bg-red-100 flex items-center justify-center text-[10px] font-medium">
            {index + 1}
          </div>
          <span className="text-xs truncate max-w-[150px]">
            {`${sale.house_no} ${sale.street}`}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MapUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

const SaleCard = ({ sale, index }) => {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 flex-shrink-0 border-2 border-red-500 rounded flex items-center justify-center text-sm font-medium text-red-500">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {`${sale.house_no} ${sale.street}, ${sale.suburb} ${sale.postcode}`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(sale.sale_date)}
          </div>
          <div className="text-sm font-semibold text-blue-600 mt-1">
            {formatPrice(parseInt(sale.price))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Distance to Selected Property: {Math.round(sale.distance)} metres
          </div>
        </div>
      </div>
    </div>
  );
};

const createNumberedIcon = (number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: white; border: 2px solid #ef4444; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: 500; color: #ef4444;">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const SalesMap = ({ selectedFeature, salesData }) => {
  if (!selectedFeature?.geometry) return null;

  // Get the center coordinates
  const center = turf.center(selectedFeature.geometry);
  const [lng, lat] = center.geometry.coordinates;

  // Convert polygon coordinates for selected feature
  const selectedCoordinates = selectedFeature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

  // Calculate bounds to include all properties
  const points = salesData.map(sale => [sale.geometry.y, sale.geometry.x]);
  points.push([lat, lng]); // Add selected property center
  const bounds = L.latLngBounds(points);

  return (
    <div style={{ height: '60vh' }} className="w-full mb-4 rounded-lg overflow-hidden relative">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        scrollWheelZoom={true}
      >
        <MapUpdater bounds={bounds} />
        
        {/* Base map layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Metromap Layer */}
        <WMSTileLayer
          url="https://api.metromap.com.au/ogc/gda2020/key/cstti1v27eq9nu61qu4g5hmzziouk84x211rfim0mb35cujvqpt1tufytqk575pe/service"
          layers="Australia_latest"
          format="image/png"
          transparent={true}
          version="1.3.0"
          attribution="© Metromap"
          crs={L.CRS.EPSG3857}
        />

        {/* Selected Property */}
        <Polygon
          positions={selectedCoordinates}
          pathOptions={{ color: 'blue', weight: 2, fillColor: 'blue', fillOpacity: 0.2 }}
        />

        {/* Sales Points */}
        {salesData.map((sale, index) => (
          <Marker
            key={index}
            position={[sale.geometry.y, sale.geometry.x]}
            icon={createNumberedIcon(index + 1)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{`${sale.house_no} ${sale.street}`}</div>
                <div className="text-gray-600">{formatPrice(parseInt(sale.price))}</div>
                <div className="text-gray-600">{formatDate(sale.sale_date)}</div>
                <div className="text-gray-600">{Math.round(sale.distance)} metres away</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <Legend salesData={salesData} />
      </MapContainer>
    </div>
  );
};

const Sales = ({ selectedFeature }) => {
  const [sales, setSales] = React.useState({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    const fetchSales = async () => {
      if (!selectedFeature?.geometry) return;

      setSales(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Get center point
        const center = turf.center(selectedFeature.geometry);
        
        // Create a 1km buffer in degrees (approximately)
        const bufferDegrees = 0.01; // roughly 1km
        const bbox = `${center.geometry.coordinates[0]-bufferDegrees},${center.geometry.coordinates[1]-bufferDegrees},${center.geometry.coordinates[0]+bufferDegrees},${center.geometry.coordinates[1]+bufferDegrees}`;

        // Build the query URL
        const url = new URL('https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer/1/query');
        url.searchParams.append('where', "1=1");
        url.searchParams.append('geometry', bbox);
        url.searchParams.append('geometryType', 'esriGeometryEnvelope');
        url.searchParams.append('inSR', '4326');
        url.searchParams.append('spatialRel', 'esriSpatialRelIntersects');
        url.searchParams.append('outFields', '*');
        url.searchParams.append('returnGeometry', 'true');
        url.searchParams.append('outSR', '4326');
        url.searchParams.append('f', 'json');

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || 'Error fetching sales data');
        }

        // Calculate date 12 months ago from today
        const today = new Date();
        const twelveMonthsAgo = new Date(today.setMonth(today.getMonth() - 12));

        // Filter and sort sales
        const sortedSales = data.features
          ?.map(f => ({
            ...f.attributes,
            geometry: f.geometry
          }))
          .filter(sale => {
            const saleDate = parseDate(sale.sale_date);
            return saleDate && saleDate >= twelveMonthsAgo;
          })
          .map(sale => {
            const salePoint = turf.point([sale.geometry.x, sale.geometry.y]);
            const distance = turf.distance(center, salePoint, { units: 'meters' });
            return { ...sale, distance };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 10) || [];

        setSales({
          data: sortedSales,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching sales:', error);
        setSales({
          data: null,
          loading: false,
          error: error.message
        });
      }
    };

    fetchSales();
  }, [selectedFeature]);

  if (!selectedFeature) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-full p-2">
        <Section title="Recent Sales - Last 12 Months - 10 Closest Sales" icon={<CurrencyDollarIcon />}>
          <div className="flex flex-col">
            {sales.data && (
              <div className="flex-none">
                <SalesMap selectedFeature={selectedFeature} salesData={sales.data} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
              {sales.loading ? (
                <div className="text-sm text-gray-600">Loading sales data...</div>
              ) : sales.error ? (
                <div className="text-sm text-red-600">Error: {sales.error}</div>
              ) : !sales.data?.length ? (
                <div className="text-sm text-gray-600">No recent sales found in this area</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sales.data.map((sale, index) => (
                    <SaleCard key={index} sale={sale} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Sales;
