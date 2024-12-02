// Main layout component that structures the application into panels
// Uses ResizablePanelGroup for flexible panel sizing

// Import UI components and layout panels

import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@/components/ui/resizable";
import { MapLayout } from "@/components/map-layout";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { GripVertical, MessageCircle } from "lucide-react";
import { useState, useEffect } from 'react';
import { ChatPanel } from "@/components/chat/chat-panel";
import { useAuth } from './lib/auth';
import { SplashPage } from '@/components/auth/splash-page';
import { Routes, Route } from 'react-router-dom';
import { AuthCallback } from '@/components/auth/callback';
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

function App() {
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);
  const { user, loading } = useAuth();
  const [isReporterActive] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsVerticalDisplay(window.innerHeight > window.innerWidth * 1.2);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin">
          <Logo className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  // Show splash page if not authenticated
  if (!user) {
    return <SplashPage />;
  }

  // Show main app if authenticated
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={
        <div className="h-screen w-screen flex flex-col overflow-hidden m-0 p-0">
          {/* Header bar with app title and description */}
          <header className="border-b bg-card shadow-sm">
            <div className="px-4 flex h-14 items-center">
              <Logo />
              <span className="text-sm text-muted-foreground ml-2">Property and Planning Analytics</span>
            </div>
          </header>
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Main layout with vertical direction */} 
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Search panel - fixed 8% height */}
              <ResizablePanel defaultSize={6} minSize={6} maxSize={6} className="border-b">
                <SearchPanel />
              </ResizablePanel>
              {/* Main panel group - 92% height */}
              <ResizablePanel defaultSize={92}>
                <ResizablePanelGroup 
                  direction={isVerticalDisplay ? 'vertical' : 'horizontal'} 
                  className="h-full"
                >
                  {/* Left panel group - increasing from 15% to 20% width */}
                  <ResizablePanel 
                    defaultSize={isVerticalDisplay ? 25 : 20} 
                    minSize={isVerticalDisplay ? 15 : 10} 
                    maxSize={isVerticalDisplay ? 40 : 30}
                  >
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel defaultSize={67}>
                        <LayerControl />
                      </ResizablePanel>
                      <ResizeHandle withHandle />
                      <ResizablePanel defaultSize={33}>
                        <Card className="h-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                          <div className="p-4 border-b flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <h2 className="font-semibold text-left">Chat</h2>
                          </div>
                          <div className="h-[calc(100%-60px)]">
                            <ChatPanel />
                          </div>
                        </Card>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>
                  <ResizeHandle withHandle>
                    <div className={isVerticalDisplay ? 'rotate-90' : ''}>
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </ResizeHandle>
                  {/* Map panel - reducing from 55% to 50% width */}
                  <ResizablePanel 
                    defaultSize={isVerticalDisplay ? 50 : 50} 
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
                    className={cn(
                      "transition-all duration-300",
                      isReporterActive ? "!w-screen" : ""
                    )}
                  >
                    <AnalyticsPanel />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </main>
        </div>
      } />
    </Routes>
  );
}

export default App;