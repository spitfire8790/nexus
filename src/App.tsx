// src/App.tsx
// Main layout component that structures the application into panels
// Uses ResizablePanelGroup for flexible panel sizing

// Import UI components and layout panels

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizeHandle,
} from "@/components/ui/resizable";
import { MapLayout } from "@/components/map-layout";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
// Ensure User icon is imported
import { GripVertical, MessageCircle, LogOut, X, LogIn, User } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/chat/chat-panel"; // Assuming ChatPanel exists if needed by FloatingChat
import { useAuth } from "./lib/auth";
// import { SplashPage } from "@/components/auth/splash-page"; // SplashPage content seems integrated here now
import { Routes, Route } from "react-router-dom";
import { AuthCallback } from "@/components/auth/callback";
// import { Card } from "@/components/ui/card"; // Card not directly used here
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { FloatingChat } from "@/components/chat/floating-chat";
import { SavedPropertiesPane } from "@/components/saved-properties-pane";
import { useSavedProperties } from "@/hooks/use-saved-properties";
import { UserCursors } from "@/components/admin/user-cursors";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { ErrorBoundary } from "react-error-boundary";
import { SiteSearchPanel } from "@/components/site-search-panel";
// Import the new modal
import { UserProfileModal } from "@/components/profile/user-profile-modal";

const queryClient = new QueryClient();

function App() {
  useSavedProperties();
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);
  const { user, loading } = useAuth();
  const [isReporterActive] = useState(false); // Assuming this state is used elsewhere
  const [isSiteSearchOpen, setIsSiteSearchOpen] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  // State for profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenSiteSearch = () => {
    console.log("Opening site search from App...");
    setIsSiteSearchOpen(true);
  };

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768;
      // Adjust vertical check if needed, this seems aggressive
      const isVertical = window.innerHeight > window.innerWidth * 1.2;
      setIsVerticalDisplay(isMobile || isVertical);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
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

  // Splash / Login screen logic
  if (!user && !bypassAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-8">
          <Logo className="scale-150 mb-4" />
          <div className="text-center space-y-2 max-w-lg">
            <h1 className="text-2xl font-semibold text-primary">
              NSW Property Development & Analytics Platform
            </h1>
            <p className="text-muted-foreground">
              Access comprehensive property analytics, interactive zoning maps,
              and real-time development application tracking. Make data-driven
              property decisions with our advanced planning tools.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center mb-8">
          <Button
            className="px-8 py-6 text-lg"
            onClick={() => setBypassAuth(true)}
          >
            Continue as Guest
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              You can explore the platform without logging in, but some features
              may be limited.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          // Assuming /auth/login is handled by your auth provider or backend
          onClick={() => (window.location.href = "/auth/login")}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" />
          Sign in for full access
        </Button>
      </div>
    );
  }

  // Main Application Layout
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/*"
          element={
            <div className="h-screen w-screen flex flex-col overflow-hidden m-0 p-0">
              {/* Admin feature */}
              {user?.user_metadata?.isAdmin && <UserCursors />}

              {/* Mobile Layout */}
              {isVerticalDisplay ? (
                <>
                  <MobileHeader />
                  <main className="flex-1 flex flex-col h-full overflow-hidden">
                    <ResizablePanelGroup
                      direction="vertical"
                      id="mobile-layout"
                      // Consider removing autoSaveId if layout issues persist
                      // autoSaveId="mobile-layout"
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
                // Desktop Layout
                <>
                  <header className="border-b bg-card shadow-sm">
                    <div className="px-4 flex h-14 items-center justify-between">
                      {/* Left side: Logo and Title */}
                      <div className="flex items-center">
                        <Logo />
                        <span className="text-sm text-muted-foreground ml-2">
                           NSW Property Development & Planning Analytics |
                           Interactive Maps & Real-Time Insights
                         </span>
                       </div>
                       {/* Right side: User Controls */}
                       <div className="flex items-center gap-2">
                         {user ? (
                           <>
                             {/* Profile Button */}
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => setIsProfileModalOpen(true)}
                               aria-label="Open user profile"
                             >
                               <User className="h-5 w-5" />
                             </Button>
                             {/* Sign Out Button */}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={signOut}
                               className="gap-2"
                             >
                               <LogOut className="h-4 w-4" />
                               Sign out
                             </Button>
                           </>
                         ) : (
                           // Sign In Button (if bypassAuth is true but user is null)
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => (window.location.href = "/auth/login")}
                             className="gap-2"
                           >
                             <LogIn className="h-4 w-4" />
                             Sign in
                           </Button>
                         )}
                       </div>
                     </div>
                   </header>
                   <main className="flex-1 flex flex-col h-full overflow-hidden">
                     <ResizablePanelGroup
                       direction="vertical"
                       className="h-full"
                     >
                       {/* Top Search Panel */}
                       <ResizablePanel
                         defaultSize={4}
                         minSize={4}
                         maxSize={10}
                         className="border-b"
                       >
                         <SearchPanel onOpenSiteSearch={handleOpenSiteSearch} />
                       </ResizablePanel>
                       {/* Main Content Area */}
                       <ResizablePanel defaultSize={92}>
                         <ResizablePanelGroup
                           direction="horizontal"
                           className="h-full"
                         >
                           {/* Left Panel (Layers & Saved) */}
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
                             <div className={isVerticalDisplay ? "rotate-90" : ""}>
                               <GripVertical className="h-4 w-4" />
                             </div>
                           </ResizeHandle>
                           {/* Center Panel (Map) */}
                           <ResizablePanel defaultSize={50} minSize={40}>
                             <MapLayout />
                           </ResizablePanel>
                           <ResizeHandle withHandle>
                             <div className={isVerticalDisplay ? "rotate-90" : ""}>
                               <GripVertical className="h-4 w-4" />
                             </div>
                           </ResizeHandle>
                           {/* Right Panel (Analytics or Site Search) */}
                           <ResizablePanel
                             defaultSize={30}
                             minSize={25}
                             className={cn(
                               "transition-all duration-300",
                               // isReporterActive might be for a different feature
                               isReporterActive ? "!w-screen" : ""
                             )}
                           >
                             {!isSiteSearchOpen ? (
                               <AnalyticsPanel />
                             ) : (
                               <div className="h-full flex flex-col bg-background">
                                 <div className="p-4 border-b flex justify-between items-center">
                                   <div>
                                     <h2 className="font-semibold">
                                       Site Search
                                     </h2>
                                     <p className="text-sm text-muted-foreground">
                                       Search properties by location and criteria
                                     </p>
                                   </div>
                                   <button
                                     onClick={() => setIsSiteSearchOpen(false)}
                                     className="text-muted-foreground hover:text-foreground"
                                     aria-label="Close site search"
                                   >
                                     <X className="h-4 w-4" />
                                     <span className="sr-only">Close</span>
                                   </button>
                                 </div>
                                 <div className="flex-1 overflow-y-auto">
                                   <SiteSearchPanel />
                                 </div>
                               </div>
                             )}
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
       {/* Render the modal outside the Routes but inside QueryClientProvider */}
       <UserProfileModal isOpen={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
     </QueryClientProvider>
   );
 }

// Add error boundary
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  // Basic error fallback UI
  return (
    <div role="alert" className="flex items-center justify-center h-screen p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2 text-destructive">Something went wrong</h2>
        <pre className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">{error.message}</pre>
        <Button
          onClick={resetErrorBoundary}
          variant="destructive"
        >
          Try again
        </Button>
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
