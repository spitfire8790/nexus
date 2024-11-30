import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Building2, FileText, AlertTriangle, DollarSign, Coffee, Users, FileDown } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { DevelopmentTab } from './tabs/development-tab';
import { PlanningTab } from './tabs/planning-tab';
import { ConstraintsTab } from './tabs/constraints-tab';
import { SalesTab } from './tabs/sales-tab';
import { AmenitiesTab } from './tabs/amenities-tab';
import { DemographicsTab } from './tabs/demographics-tab';
import { ReporterTab } from './tabs/reporter-tab';
import { cn } from '@/lib/utils';

export function AnalyticsPanel() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [headerAddress, setHeaderAddress] = useState<string | null>(null);
  const currentTab = useMapStore((state) => state.currentTab);
  const [isReporterActive, setIsReporterActive] = useState(false);

  const getHeaderText = (tab: string) => {
    const headerMap: { [key: string]: string } = {
      overview: "Property Details",
      development: "Development Applications",
      planning: "Planning Controls",
      constraints: "Site Constraints",
      sales: "Sales History",
      amenities: "Nearby Amenities",
      demographics: "Local Demographics",
      reporter: "Generate Report"
    };
    return headerMap[tab] || "Property Details";
  };

  useEffect(() => {
    async function fetchAddress() {
      if (selectedProperty?.propId) {
        try {
          const response = await fetch(
            `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?id=${selectedProperty.propId}&Type=property`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }
          
          const addressData = await response.text();
          setHeaderAddress(addressData.replace(/^"|"$/g, ''));
        } catch (error) {
          console.error('Error fetching address:', error);
          setHeaderAddress(null);
        }
      }
    }

    fetchAddress();
  }, [selectedProperty?.propId]);

  return (
    <div className="h-full bg-card shadow-lg">
      <Tabs 
        value={currentTab}
        defaultValue="overview" 
        orientation="vertical" 
        onValueChange={(value) => {
          useMapStore.getState().setCurrentTab(value);
          setIsReporterActive(value === "reporter");
        }}
        className={cn(
          "h-full flex",
          isReporterActive && "!fixed inset-0 z-50 bg-background"
        )}
      >
        <div className={cn(
          "border-r w-[60px] flex flex-col",
          isReporterActive && "border-r-0"
        )}>
          <div className="h-[175px] border-b"></div>
          <TabsList className="flex flex-col gap-6 p-4">
            <TabsTrigger value="overview" className="w-10 h-10 p-0 relative group">
              <MapPin className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="development" className="w-10 h-10 p-0 relative group">
              <Building2 className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Development
              </span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="w-10 h-10 p-0 relative group">
              <FileText className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Planning
              </span>
            </TabsTrigger>
            <TabsTrigger value="constraints" className="w-10 h-10 p-0 relative group">
              <AlertTriangle className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Constraints
              </span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="w-10 h-10 p-0 relative group">
              <DollarSign className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Sales
              </span>
            </TabsTrigger>
            <TabsTrigger value="amenities" className="w-10 h-10 p-0 relative group">
              <Coffee className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Amenities
              </span>
            </TabsTrigger>
            <TabsTrigger value="demographics" className="w-10 h-10 p-0 relative group">
              <Users className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Demographics
              </span>
            </TabsTrigger>
            <TabsTrigger value="reporter" className="w-10 h-10 p-0 relative group">
              <FileDown className="h-6 w-6" />
              <span className="absolute left-[calc(100%+0.5rem)] bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-md z-50">
                Report
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isReporterActive && "w-[calc(100vw-60px)]"
        )}>
          <div className="p-4 border-b">
            <h2 className="font-semibold">{getHeaderText(currentTab)}</h2>
            {headerAddress && (
              <p className="text-sm text-muted-foreground">{headerAddress}</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="development"><DevelopmentTab /></TabsContent>
            <TabsContent value="planning"><PlanningTab /></TabsContent>
            <TabsContent value="constraints"><ConstraintsTab /></TabsContent>
            <TabsContent value="sales"><SalesTab /></TabsContent>
            <TabsContent value="amenities"><AmenitiesTab /></TabsContent>
            <TabsContent value="demographics"><DemographicsTab /></TabsContent>
            <TabsContent value="reporter"><ReporterTab /></TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
