import { useState } from 'react';
import { SearchPanel } from './search-panel';
import { SiteSearchPanel } from './site-search-panel';
import { MobileHeader } from './mobile/mobile-header';
import { PropertyPanel } from './property-panel';
import { LayerControl } from './layer-control';
import { ChatPanel } from './chat-panel';
import { useMapStore } from '@/lib/map-store';
import { X } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSiteSearchOpen, setIsSiteSearchOpen] = useState(false);
  const isChatOpen = useMapStore((state) => state.isChatOpen);

  const handleOpenSiteSearch = () => {
    console.log('Opening site search...'); // Debug log
    setIsSiteSearchOpen(true);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="md:hidden">
        <MobileHeader onOpenSiteSearch={handleOpenSiteSearch} />
      </div>
      <div className="flex-1 flex">
        <div className="hidden md:block">
          <SearchPanel onOpenSiteSearch={handleOpenSiteSearch} />
        </div>
        <main className="flex-1 relative">
          {children}
        </main>
        <div className="relative">
          <PropertyPanel />
          {isChatOpen && (
            <div className="w-[400px] border-l bg-background">
              <ChatPanel />
            </div>
          )}
          {isSiteSearchOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-[400px] sm:w-[540px] bg-background border-l shadow-lg">
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
      </div>
    </div>
  );
} 