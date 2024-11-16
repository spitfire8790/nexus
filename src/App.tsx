// Main layout component that structures the application into panels
// Uses ResizablePanelGroup for flexible panel sizing

// Import UI components and layout panels

import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@/components/ui/resizable";
import { MapLayout } from "@/components/map-layout";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { Globe2, GripVertical } from "lucide-react";
import { useState, useEffect } from 'react';

function App() {
  // Add aspect ratio check
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsVerticalDisplay(window.innerHeight > window.innerWidth * 1.2);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Header bar with app title and description */}
      <header className="border-b bg-card shadow-sm">
        <div className="px-4 flex h-14 items-center">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Globe2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl tracking-tight">Nexus</span>
          </div>
          <span className="text-sm text-muted-foreground ml-2">Property and Planning Analytics</span>
        </div>
      </header>
      <main className="flex-1">
        {/* Main layout with vertical direction */} 
        <ResizablePanelGroup direction="vertical">
          {/* Search panel - fixed 8% height */}
          <ResizablePanel defaultSize={8} minSize={8} maxSize={8}>
            <SearchPanel />
          </ResizablePanel>
          {/* Main panel group - 92% height */}
          <ResizablePanel defaultSize={92}>
            {/* Inner panel group with horizontal direction */}
            <ResizablePanelGroup 
              direction={isVerticalDisplay ? 'vertical' : 'horizontal'} 
              className="h-full"
            >
              {/* Layer control panel - 15% width */}
              <ResizablePanel 
                defaultSize={isVerticalDisplay ? 25 : 15} 
                minSize={isVerticalDisplay ? 15 : 10} 
                maxSize={isVerticalDisplay ? 40 : 30}
              >
                <LayerControl />
              </ResizablePanel>
              <ResizeHandle withHandle>
                <div className={isVerticalDisplay ? 'rotate-90' : ''}>
                  <GripVertical className="h-4 w-4" />
                </div>
              </ResizeHandle>
              {/* Map panel - 50% width */}
              <ResizablePanel 
                defaultSize={isVerticalDisplay ? 50 : 55} 
                minSize={40}
              >
                <MapLayout />
              </ResizablePanel>
              <ResizeHandle withHandle>
                <div className={isVerticalDisplay ? 'rotate-90' : ''}>
                  <GripVertical className="h-4 w-4" />
                </div>
              </ResizeHandle>
              {/* Analytics panel - 35% width */}
              <ResizablePanel 
                defaultSize={isVerticalDisplay ? 25 : 30} 
                minSize={isVerticalDisplay ? 20 : 15} 
                maxSize={50}
              >
                <AnalyticsPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

export default App;