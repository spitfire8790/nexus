import { useEffect, useState } from 'react';
import { useMapStore } from '@/lib/map-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Building2, FileText, AlertTriangle, DollarSign, Coffee, Users, Cloud, Clock, BookOpen } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { DevelopmentTab } from './tabs/development-tab';
import { PlanningTab } from './tabs/planning-tab';
import { ConstraintsTab } from './tabs/constraints-tab';
import { SalesTab } from './tabs/sales-tab';
import { AmenitiesTab } from './tabs/amenities-tab';
import { DemographicsTab } from './tabs/demographics-tab';
import { ClimateTab } from './tabs/climate-tab';
import { ImageryTab } from './tabs/imagery-tab';
import { WikiTab } from './tabs/wiki-tab';
import { cn } from '@/lib/utils';

export function AnalyticsPanel() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const headerAddress = useMapStore((state) => state.headerAddress);
  const setHeaderAddress = useMapStore((state) => state.setHeaderAddress);
  const currentTab = useMapStore((state) => state.currentTab);

  const getHeaderText = (tab: string) => {
    const headerMap: { [key: string]: string } = {
      overview: "Property Details",
      development: "Development Applications",
      planning: "Planning Controls",
      constraints: "Site Constraints",
      sales: "Sales History",
      amenities: "Nearby Amenities",
      demographics: "Local Demographics",
      climate: "Climate",
      imagery: "Historical Imagery",
      wiki: "Nearby Wikipedia Articles"
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
      } else {
        setHeaderAddress(null);
      }
    }

    fetchAddress();
  }, [selectedProperty?.propId, setHeaderAddress]);

  useEffect(() => {
    if (!selectedProperty?.propId) return;

    const fetchAllTabData = async () => {
      try {
        const overviewTabRef = document.createElement('div');
        const planningTabRef = document.createElement('div');
        const developmentTabRef = document.createElement('div');
        const salesTabRef = document.createElement('div');
        const amenitiesTabRef = document.createElement('div');
        const demographicsTabRef = document.createElement('div');
        const climateTabRef = document.createElement('div');
        const imageryTabRef = document.createElement('div');
        const wikiTabRef = document.createElement('div');

        overviewTabRef.innerHTML = '<overview-tab></overview-tab>';
        planningTabRef.innerHTML = '<planning-tab></planning-tab>';
        developmentTabRef.innerHTML = '<development-tab></development-tab>';
        salesTabRef.innerHTML = '<sales-tab></sales-tab>';
        amenitiesTabRef.innerHTML = '<amenities-tab></amenities-tab>';
        demographicsTabRef.innerHTML = '<demographics-tab></demographics-tab>';
        climateTabRef.innerHTML = '<climate-tab></climate-tab>';
        imageryTabRef.innerHTML = '<imagery-tab></imagery-tab>';
        wikiTabRef.innerHTML = '<wiki-tab></wiki-tab>';
      } catch (error) {
        console.error('Error fetching tab data:', error);
      }
    };

    fetchAllTabData();
  }, [selectedProperty]);

  return (
    <div className="h-full bg-card shadow-lg overflow-hidden">
      <Tabs 
        value={currentTab}
        defaultValue="overview" 
        orientation="vertical" 
        onValueChange={(value) => {
          useMapStore.getState().setCurrentTab(value);
        }}
        className="h-full flex analytics-tabs"
      >
        <div className="border-r w-[60px] flex flex-col">
          <div className="h-[180px] border-b"></div>
          <TabsList className="flex flex-col gap-6 p-4">
            <TabsTrigger value="overview" className="w-10 h-10 p-0 relative group">
              <MapPin className="h-6 w-6" />
              <span className="hidden md:hidden">
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="w-10 h-10 p-0 relative group">
              <Building2 className="h-6 w-6" />
              <span className="hidden md:hidden">
                Planning
              </span>
            </TabsTrigger>
            <TabsTrigger value="constraints" className="w-10 h-10 p-0 relative group">
              <AlertTriangle className="h-6 w-6" />
              <span className="hidden md:hidden">
                Constraints
              </span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="w-10 h-10 p-0 relative group">
              <DollarSign className="h-6 w-6" />
              <span className="hidden md:hidden">
                Sales
              </span>
            </TabsTrigger>
            <TabsTrigger value="amenities" className="w-10 h-10 p-0 relative group">
              <Coffee className="h-6 w-6" />
              <span className="hidden md:hidden">
                Amenities
              </span>
            </TabsTrigger>
            <TabsTrigger value="demographics" className="w-10 h-10 p-0 relative group">
              <Users className="h-6 w-6" />
              <span className="hidden md:hidden">
                Demographics
              </span>
            </TabsTrigger>
            <TabsTrigger value="climate" className="w-10 h-10 p-0 relative group">
              <Cloud className="h-6 w-6" />
              <span className="hidden md:hidden">
                Climate
              </span>
            </TabsTrigger>
            <TabsTrigger value="wiki" className="w-10 h-10 p-0 relative group">
              <BookOpen className="h-6 w-6" />
              <span className="hidden md:hidden">
                Wikipedia
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">{getHeaderText(currentTab)}</h2>
            {headerAddress && (
              <p className="text-sm text-muted-foreground">{headerAddress}</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="planning"><PlanningTab /></TabsContent>
            <TabsContent value="constraints"><ConstraintsTab /></TabsContent>
            <TabsContent value="sales"><SalesTab /></TabsContent>
            <TabsContent value="amenities"><AmenitiesTab /></TabsContent>
            <TabsContent value="demographics"><DemographicsTab /></TabsContent>
            <TabsContent value="climate"><ClimateTab /></TabsContent>
            <TabsContent value="wiki"><WikiTab /></TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
