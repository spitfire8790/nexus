// Main layout component that structures the application into panels
// Uses ResizablePanelGroup for flexible panel sizing

// Import UI components and layout panels

import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@/components/ui/resizable";
import { MapLayout } from "@/components/map-layout";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { GripVertical, MessageCircle, LogOut, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { signOut } from '@/lib/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { SiteSearchPanel } from "@/components/site-search-panel";

const queryClient = new QueryClient();

function App() {
  useSavedProperties();
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);
  const { user, loading } = useAuth();
  const [isReporterActive] = useState(false);
  const [isSiteSearchOpen, setIsSiteSearchOpen] = useState(false);

  const handleOpenSiteSearch = () => {
    console.log('Opening site search from App...');
    setIsSiteSearchOpen(true);
  };

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
                    <ResizablePanelGroup 
                      direction="vertical" 
                      id="mobile-layout"
                      autoSaveId="mobile-layout"
                    >
                      <ResizablePanel 
                        defaultSize={70} 
                        minSize={30}
                        id="map-panel"
                      >
                        <MapLayout />
                      </ResizablePanel>
                      <ResizeHandle withHandle id="mobile-resize-handle">
                        <div className="rotate-90">
                          <GripVertical className="h-4 w-4" />
                        </div>
                      </ResizeHandle>
                      <ResizablePanel 
                        defaultSize={30} 
                        minSize={20}
                        id="analytics-panel"
                      >
                        <AnalyticsPanel />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </main>
                  <FloatingChat />
                </>
              ) : (
                <>
                  <header className="border-b bg-card shadow-sm">
                    <div className="px-4 flex h-14 items-center justify-between">
                      <div className="flex items-center">
                        <Logo />
                        <span className="text-sm text-muted-foreground ml-2">
                          NSW Property Development & Planning Analytics | Interactive Maps & Real-Time Insights
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </header>
                  <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <ResizablePanelGroup direction="vertical" className="h-full">
                      <ResizablePanel defaultSize={8} minSize={6} maxSize={10} className="border-b">
                        <SearchPanel onOpenSiteSearch={handleOpenSiteSearch} />
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
              {isSiteSearchOpen && (
                <div className="fixed top-[calc(7.4rem+2.5rem)] bottom-0 right-0 z-50 w-[400px] sm:w-[540px] bg-background border-l shadow-lg">
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                      <div>
                        <h2 className="font-semibold">Site Search</h2>
                        <p className="text-sm text-muted-foreground">
                          Search properties by location and criteria
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsSiteSearchOpen(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <SiteSearchPanel />
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </Routes>
    </QueryClientProvider>
  );
}

// Add error boundary
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <pre className="text-sm text-red-500 mb-4">{error.message}</pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Wrap the app with error boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  );
}
