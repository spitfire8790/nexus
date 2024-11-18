import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMapStore } from "@/lib/map-store";
import { GeneralChat } from "./general-chat";
import { PropertyChat } from "./property-chat";
import { FeatureRequests } from "./feature-requests";
import { MessageCircle, MessageSquare, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ChatPanel() {
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const [currentTab, setCurrentTab] = useState("general");

  return (
    <div className="h-full">
      <Tabs 
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="h-full flex flex-col"
      >
        <div className="px-4 py-2 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="property" 
              disabled={!selectedProperty}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Property
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="general" className="h-full m-0">
            <GeneralChat />
          </TabsContent>
          
          <TabsContent value="property" className="h-full m-0">
            <PropertyChat />
          </TabsContent>
          
          <TabsContent value="features" className="h-full m-0">
            <FeatureRequests />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 