import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMapStore } from "@/lib/map-store";
import { Loader2, Home, Building2, Building, Hotel, Store, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropertyData } from "../hooks/use-property-data";

interface DwellingType {
  name: string;
  icon: React.ReactNode;
  id: string;
}

interface ConsentStatus {
  status: 'withConsent' | 'withoutConsent' | null;
}

const RESIDENTIAL_TYPES: DwellingType[] = [
  { name: "Attached Dwellings", icon: <Building2 className="h-5 w-5" />, id: "Attached Dwellings" },
  { name: "Dual Occupancies", icon: <Building2 className="h-5 w-5" />, id: "Dual Occupancies" },
  { name: "Dwelling Houses", icon: <Home className="h-5 w-5" />, id: "Dwelling Houses" },
  { name: "Multi Dwelling Housing", icon: <Building className="h-5 w-5" />, id: "Multi Dwelling Housing" },
  { name: "Residential Flat Buildings", icon: <Building className="h-5 w-5" />, id: "Residential Flat Buildings" },
  { name: "Semi-Detached Dwellings", icon: <Building2 className="h-5 w-5" />, id: "Semi-Detached Dwellings" },
  { name: "Seniors Housing", icon: <Hotel className="h-5 w-5" />, id: "Seniors Housing" },
  { name: "Shop Top Housing", icon: <Store className="h-5 w-5" />, id: "Shop Top Housing" }
];

// Add new custom status icons
function StatusIcon({ type }: { type: 'withConsent' | 'withoutConsent' | 'notPermitted' }) {
  if (type === 'withoutConsent') {
    return (
      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="h-3 w-3 text-white" />
      </div>
    );
  }
  if (type === 'withConsent') {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center">
        <Check className="h-3 w-3 text-green-500" />
      </div>
    );
  }
  return <X className="h-5 w-5 text-red-500" />;
}

export function HousingFeasibilityTab() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const permittedUses = useMapStore((state) => state.permittedUses);
  const zoneInfo = useMapStore((state) => state.zoneInfo);
  
  // Add the hook to trigger data fetching
  usePropertyData();

  if (!selectedProperty) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>Select a property to view housing feasibility</AlertTitle>
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
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Housing Feasibility</CardTitle>
          <CardDescription>
            Permitted residential development types in {zoneInfo?.zoneName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-green-500 bg-white flex items-center justify-center">
                <Check className="h-3 w-3 text-green-500" />
              </div>
              <span className="text-green-700">With Consent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-green-700">Without Consent</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-700">Not Permitted</span>
            </div>
          </div>

          <div className="relative">
            {/* Header */}
            <div className="grid grid-cols-[200px_100px_1fr] mb-4 border-b pb-2">
              <div>Dwelling Type</div>
              <div>Permissibility</div>
              <div>{/* Reserved for future columns */}</div>
            </div>
            
            {/* Rows */}
            <div className="space-y-4">
              {RESIDENTIAL_TYPES.map((type) => {
                const isWithoutConsent = permittedUses.withoutConsent?.includes(type.id);
                const isWithConsent = permittedUses.withConsent?.includes(type.id);
                const status = isWithoutConsent ? 'withoutConsent' : isWithConsent ? 'withConsent' : 'notPermitted';

                return (
                  <div 
                    key={type.id}
                    className="grid grid-cols-[200px_100px_1fr] items-center"
                  >
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <span className="text-sm">{type.name}</span>
                    </div>
                    <div className="flex justify-center">
                      <StatusIcon type={status} />
                    </div>
                    <div>{/* Reserved for future columns */}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 