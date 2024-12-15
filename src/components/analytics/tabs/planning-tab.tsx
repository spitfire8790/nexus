import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Alert, AlertTitle} from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, InfoIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { apiThrottle } from '@/lib/api-throttle';
import { getPlanningDefinition } from '@/lib/planning-definitions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Portal,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { planningDefinitions } from '@/lib/planning-definitions';
import { loadDefinitions, parseCSVLine } from '@/lib/planning-definitions';

interface PermittedUses {
  withConsent: string[] | null;
  withoutConsent: string[] | null;
  prohibited: string[] | null;
  loading: boolean;
  error: string | null;
}

export function PlanningTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const setZoneInfo = useMapStore((state) => state.setZoneInfo);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  const permittedUses = useMapStore((state) => state.permittedUses);
  const setPermittedUses = useMapStore((state) => state.setPermittedUses);

  useEffect(() => {
    async function fetchZoningAndPermittedUses() {
      if (!selectedProperty?.propId) return;

      setPermittedUses(prev => ({ ...prev, loading: true, error: null }));

      try {
        // First fetch zoning information
        const zoningResponse = await apiThrottle.fetch(
          `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/layerintersect?type=property&id=${selectedProperty.propId}&layers=epi`
        );

        if (!zoningResponse.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const zoningData = await zoningResponse.json();
        const zoningLayer = zoningData.find((l: any) => l.layerName === "Land Zoning Map");

        if (!zoningLayer?.results?.[0]) {
          throw new Error('No zoning data found');
        }

        // Get the zone code from the first API response
        const zoneName = zoningLayer.results[0].title;
        const zoneCode = zoneName.split(':')[0].trim(); 

        // Don't set initial zone info here anymore
        // Instead, collect the data
        const lgaName = zoningLayer.results[0]["LGA Name"];

        // Fetch permitted uses
        const response = await apiThrottle.fetch(
          `https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer/19/query?` +
          `geometry=${encodeURIComponent(JSON.stringify(selectedProperty.geometry))}` +
          `&geometryType=esriGeometryPolygon` +
          `&spatialRel=esriSpatialRelIntersects` +
          `&outFields=*` +
          `&returnGeometry=false` +
          `&f=json`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch zoning data');
        }

        const data = await response.json();
        
        if (!data.features?.length) {
          throw new Error('No zoning data found');
        }

        // Find the matching zone data using zoneCode from above
        const zoneData = data.features.find(f => f.attributes.SYM_CODE === zoneCode)?.attributes;

        if (!zoneData) {
          throw new Error(`No zone data found for ${zoneCode}`);
        }

        const epiName = zoneData.EPI_NAME;

        console.log('Zoning Data:', zoneData);
        console.log('Making proxy request with:', {
          epiName,
          zoneCode
        });

        const API_BASE_URL = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5174'
          : 'https://www.nexusapi.xyz';

        console.log('Zone Data from first API:', {
          epiName,
          zoneCode,
          fullZoneData: zoneData
        });

        const permittedResponse = await fetch(`${API_BASE_URL}/api/proxy`, {
          method: 'GET',
          headers: {
            'EPINAME': epiName,
            'ZONECODE': zoneCode,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!permittedResponse.ok) {
          throw new Error('Failed to fetch permitted uses');
        }

        const jsonData = await permittedResponse.json();
        console.log('Permitted uses response:', jsonData);

        const precinct = jsonData?.[0]?.Precinct?.[0];
        const zone = precinct?.Zone?.find((z: any) => z.ZoneCode === zoneCode);
        console.log('Found zone match:', {
          searchingFor: zoneCode,
          foundZone: zone
        });

        const landUse = zone?.LandUse?.[0] || {};

        // Remove duplicates and sort alphabetically
        const withConsentSet: Set<string> = new Set(
          (landUse.PermittedWithConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const withoutConsentSet: Set<string> = new Set(
          (landUse.PermittedWithoutConsent || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );
        const prohibitedSet: Set<string> = new Set(
          (landUse.Prohibited || [])
            .map((use: { Landuse: string }) => use.Landuse)
        );

        setPermittedUses({
          withConsent: [...withConsentSet].sort((a, b) => a.localeCompare(b)),
          withoutConsent: [...withoutConsentSet].sort((a, b) => a.localeCompare(b)),
          prohibited: [...prohibitedSet].sort((a, b) => a.localeCompare(b)),
          loading: false,
          error: null
        });

        // Now set all the zone info at once with complete data
        setZoneInfo({
          zoneName: zoneName,
          lgaName: lgaName,
          epiName: epiName,
          zoneObjective: zone?.ZoneObjective || 'No zone objective available'
        });

      } catch (error: any) {
        console.error('Error in planning tab:', error);
        setPermittedUses(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch planning data'
        }));
      }
    }

    fetchZoningAndPermittedUses();
  }, [selectedProperty?.propId, selectedProperty?.geometry, setZoneInfo, setPermittedUses]);

  interface LandUseDefinition {
    Term: string;
    LandUse: string;
    Definition: string;
  }

  const LandUseItem = ({ use }: { use: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [definitions, setDefinitions] = useState<Record<string, { LandUse: string; Definition: string }>>({});
    
    // Helper function to normalize terms
    const normalizeTerm = (term: string): string => {
      // Convert to lowercase for case-insensitive comparison
      const lowerTerm = term.toLowerCase();
      
      // Define normalizations with lowercase keys
      const normalizations: Record<string, string> = {
        'crematoria': 'Crematorium',
        'crematorium': 'Crematorium',
        // Add other variations here as needed
      };
      
      return normalizations[lowerTerm] || term;
    };
    
    // Get definition with normalization
    const definition = getPlanningDefinition(normalizeTerm(use));
    
    // Load definitions when component mounts
    useEffect(() => {
      const loadDefs = async () => {
        const csvText = await loadDefinitions();
        const lines = csvText.split('\n');
        const defs: Record<string, { LandUse: string; Definition: string }> = {};
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const [term, landUse, definition] = parseCSVLine(lines[i]);
          if (term) {
            defs[term] = { LandUse: landUse, Definition: definition };
            
            // Also add normalized variations
            if (term === 'Crematorium') {
              defs['Crematoria'] = defs[term];
            }
            // Add other variations here as needed
          }
        }
        
        setDefinitions(defs);
      };
      
      loadDefs();
    }, []);
    
    // Check if it's an "Any Other Development" entry
    const otherDevMatch = use.match(/Any Other Development Not Specified In Item\s+([0-9\s,Or]+)/i);
    
    let hasDefinition = false;
    let definitionText = '';
    
    if (otherDevMatch) {
      // Get referenced item numbers
      const itemNumbers = otherDevMatch[1].split(/\s+Or\s+|\s*,\s*/).map(Number);
      
      // Get all valid land uses where LandUse is not "No"
      const validLandUses = Object.entries(planningDefinitions)
        .filter(([_, def]) => def.LandUse !== "No")
        .map(([term, _]) => term)
        .sort()
        .join(", ");
      
      hasDefinition = true;
      definitionText = validLandUses;
    } else {
      hasDefinition = definition !== undefined && definition !== "Nil";
      definitionText = definition || '';
    }

    return (
      <>
        <li className="flex items-center gap-2 list-none">
          <span className="truncate flex-1">{use}</span>
          {hasDefinition && (
            <button onClick={() => setIsOpen(true)} className="shrink-0">
              <InfoIcon className="h-4 w-4 cursor-help text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </li>

        {hasDefinition && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
              className="max-w-[400px] p-6 fixed right-4 top-1/2 -translate-y-1/2 translate-x-0 left-auto"
              style={{ transform: 'translate(0, -50%)' }}
            >
              <div className="space-y-4">
                <h4 className="font-medium text-lg">{use}</h4>
                <p className="text-sm text-muted-foreground">
                  {definitionText}
                </p>
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p>Source: <a 
                    href="https://legislation.nsw.gov.au/view/html/inforce/current/epi-2006-155a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-500 underline"
                  >
                    Standard Instrument
                  </a></p>
                  <p>Date accessed: 15 December 2024</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  };

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view planning controls</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (permittedUses.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (permittedUses.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{permittedUses.error}</AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Local Environment Plan</CardTitle>
          <CardDescription>{zoneInfo?.epiName || 'No planning instrument available'}</CardDescription>
        </CardHeader>
        <CardContent>
          {zoneInfo ? (
            <div className="space-y-2">
              <p><strong>Zone:</strong> {zoneInfo.zoneName}</p>
              <p><strong>Zone Objective:</strong> {zoneInfo.zoneObjective}</p>
              <p><strong>LGA:</strong> {zoneInfo.lgaName}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No zoning information available</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Permitted Uses <CheckCircle2 className="h-6 w-6 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center justify-between">
              <span><strong>Permitted without consent (2)</strong></span>
              <span className="text-sm text-muted-foreground">
                {permittedUses.withoutConsent?.length || 0} uses
              </span>
            </h4>
            {permittedUses.withoutConsent?.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                {permittedUses.withoutConsent.map((use, index) => (
                  <LandUseItem key={index} use={use} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No uses permitted without consent</p>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center justify-between">
              <span><strong>Permitted with consent (3)</strong></span>
              <span className="text-sm text-muted-foreground">
                {permittedUses.withConsent?.length || 0} uses
              </span>
            </h4>
            {permittedUses.withConsent?.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                {permittedUses.withConsent.map((use, index) => (
                  <LandUseItem key={index} use={use} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No uses permitted with consent</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-500">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Prohibited Uses (4) <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground">
              {permittedUses.prohibited?.length || 0} uses
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {permittedUses.prohibited?.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {permittedUses.prohibited.map((use, index) => (
                <LandUseItem key={index} use={use} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No prohibited uses</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
