import { useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as turf from '@turf/turf';
import L from 'leaflet';

interface DevelopmentApplication {
  applicationId: string;
  description: string;
  status: string;
  lodgementDate: string;
  determinationDate?: string;
  coordinates?: [number, number];
  council?: string;
  address?: string;
}

export function DevelopmentTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const map = useMapStore((state) => state.map);
  const [applications, setApplications] = useState<DevelopmentApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnMap, setShowOnMap] = useState(false);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Create markers layer when map is available
  useEffect(() => {
    if (map && !markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }
    return () => {
      markersLayerRef.current?.remove();
      markersLayerRef.current = null;
    };
  }, [map]);

  const createDAIcon = (status: string) => {
    const color = status.toLowerCase().includes('approved') ? 'green' : 
                 status.toLowerCase().includes('rejected') ? 'red' : 'orange';
    
    return L.divIcon({
      html: `
        <div class="w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center text-white shadow-lg border-2 border-white">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      `,
      className: 'da-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const toggleMapMarkers = (show: boolean) => {
    if (!map || !markersLayerRef.current) return;

    if (show) {
      applications.forEach(app => {
        if (app.coordinates) {
          const marker = L.marker(app.coordinates, {
            icon: createDAIcon(app.status)
          }).bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${app.address || 'No address'}</h3>
              <p class="text-sm">${app.description}</p>
              <p class="text-sm mt-2">
                <strong>Status:</strong> ${app.status}<br>
                <strong>Lodged:</strong> ${new Date(app.lodgementDate).toLocaleDateString()}
              </p>
            </div>
          `);
          markersLayerRef.current?.addLayer(marker);
        }
      });
    } else {
      markersLayerRef.current.clearLayers();
    }
    setShowOnMap(show);
  };

  useEffect(() => {
    if (!selectedProperty?.geometry) return;

    const fetchDevelopmentApplications = async () => {
      setLoading(true);
      setError(null);
      console.log('Fetching DAs for property:', selectedProperty);

      try {
        // Get council information from zoning layer
        const zoningResponse = await fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) throw new Error('Failed to fetch council information');
        
        const zoningData = await zoningResponse.json();
        console.log('Zoning data:', zoningData);

        const council = zoningData.find((l: any) => l.layerName === "Land Zoning Map")
          ?.results?.[0]?.["LGA Name"];

        if (!council) throw new Error('Could not determine council area');
        console.log('Property is in council:', council);

        // Query all DAs for this council
        const { data: applications, error: supabaseError } = await supabase
          .from('development_applications')
          .select('*')
          .eq('council_name', council)
          .order('lodgement_date', { ascending: false });

        if (supabaseError) throw supabaseError;
        console.log(`Found ${applications?.length} DAs in ${council}`);

        // Create property polygon for filtering
        const propertyPolygon = turf.polygon([[
          ...selectedProperty.geometry.rings[0].map((coord: number[]) => [
            coord[0] * 180 / 20037508.34,
            Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
          ])
        ]]);

        // Process and filter applications
        const processedApplications = applications
          ?.map(app => ({
            applicationId: app.id,
            description: app.description || 'No description provided',
            status: app.application_status || 'Unknown',
            lodgementDate: app.lodgement_date,
            determinationDate: app.determination_date,
            coordinates: app.location?.[0] ? [
              parseFloat(app.location[0].Y),
              parseFloat(app.location[0].X)
            ] as [number, number] : undefined,
            council: app.council_name,
            address: app.location?.[0]?.FullAddress,
            isWithinProperty: app.location?.[0] ? turf.booleanPointInPolygon(
              turf.point([parseFloat(app.location[0].X), parseFloat(app.location[0].Y)]),
              propertyPolygon
            ) : false
          }))
          .filter(app => app.coordinates) // Only include apps with valid coordinates
          .sort((a, b) => new Date(b.lodgementDate).getTime() - new Date(a.lodgementDate).getTime());

        console.log('Processed applications:', processedApplications);
        setApplications(processedApplications || []);
      } catch (error: any) {
        console.error('Error fetching DAs:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopmentApplications();
  }, [selectedProperty]);

  // Clean up map markers when component unmounts
  useEffect(() => {
    return () => {
      markersLayerRef.current?.clearLayers();
    };
  }, []);

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view development applications</AlertTitle>
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

  const propertyDAs = applications.filter(app => app.isWithinProperty);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Development Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Found {propertyDAs.length} application(s) for this property
                {applications.length > propertyDAs.length && 
                  ` and ${applications.length - propertyDAs.length} in the surrounding area`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleMapMarkers(!showOnMap)}
              >
                {showOnMap ? 'Hide on Map' : 'Show on Map'}
              </Button>
            </div>

            {applications.map((app, index) => (
              <Card key={app.applicationId} className={cn(
                "p-4 hover:bg-accent/50 transition-colors",
                app.isWithinProperty && "border-primary"
              )}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{app.description}</p>
                        <p className="text-sm text-muted-foreground">{app.address}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm px-2 py-1 rounded-full",
                      app.status.toLowerCase().includes('approved') && "bg-green-100 text-green-800",
                      app.status.toLowerCase().includes('rejected') && "bg-red-100 text-red-800",
                      !app.status.toLowerCase().includes('approved') && 
                      !app.status.toLowerCase().includes('rejected') && "bg-orange-100 text-orange-800"
                    )}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Lodged: {new Date(app.lodgementDate).toLocaleDateString()}
                    </div>
                    {app.determinationDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Determined: {new Date(app.determinationDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
