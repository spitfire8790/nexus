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
import { FloatingChat } from "@/components/chat/floating-chat";
import { SavedPropertiesPane } from "@/components/saved-properties-pane";
import { useSavedProperties } from '@/hooks/use-saved-properties';
import { UserCursors } from "@/components/admin/user-cursors";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  useSavedProperties();
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);
  const { user, loading } = useAuth();
  const [isReporterActive] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768;
      const isVertical = window.innerHeight > window.innerWidth * 1.2;
      setIsVerticalDisplay(isMobile || isVertical);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin">
          <Logo className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <SplashPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/*" 
          element={
            <div className="h-screen w-screen flex flex-col overflow-hidden m-0 p-0">
              {user?.user_metadata?.isAdmin && <UserCursors />}
              {isVerticalDisplay ? (
                <>
                  <MobileHeader />
                  <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel defaultSize={100}>
                        <MapLayout />
                      </ResizablePanel>
                      <ResizablePanel defaultSize={0} minSize={0} maxSize={0}>
                        <AnalyticsPanel />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </main>
                  <FloatingChat />
                </>
              ) : (
                <>
                  <header className="border-b bg-card shadow-sm">
                    <div className="px-4 flex h-14 items-center">
                      <Logo />
                      <span className="text-sm text-muted-foreground ml-2">
                        Property and Planning Analytics
                      </span>
                    </div>
                  </header>
                  <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <ResizablePanelGroup direction="vertical" className="h-full">
                      <ResizablePanel defaultSize={8} minSize={6} maxSize={10} className="border-b">
                        <SearchPanel />
                      </ResizablePanel>
                      <ResizablePanel defaultSize={92}>
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                          <ResizablePanel 
                            defaultSize={20} 
                            minSize={10} 
                            maxSize={30}
                          >
                            <ResizablePanelGroup direction="vertical">
                              <ResizablePanel defaultSize={75}>
                                <LayerControl />
                              </ResizablePanel>
                              <ResizeHandle withHandle>
                                <div>
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              </ResizeHandle>
                              <ResizablePanel defaultSize={25}>
                                <SavedPropertiesPane />
                              </ResizablePanel>
                            </ResizablePanelGroup>
                          </ResizablePanel>
                          <ResizeHandle withHandle>
                            <div className={isVerticalDisplay ? 'rotate-90' : ''}>
                              <GripVertical className="h-4 w-4" />
                            </div>
                          </ResizeHandle>
                          <ResizablePanel 
                            defaultSize={50} 
                            minSize={40}
                          >
                            <MapLayout />
                          </ResizablePanel>
                          <ResizeHandle withHandle>
                            <div className={isVerticalDisplay ? 'rotate-90' : ''}>
                              <GripVertical className="h-4 w-4" />
                            </div>
                          </ResizeHandle>
                          <ResizablePanel 
                            defaultSize={30}
                            minSize={25}
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
                  <FloatingChat />
                </>
              )}
            </div>
          }
        />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;