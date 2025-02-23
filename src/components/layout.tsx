import { useState } from 'react';
import { SearchPanel } from './search-panel';
import { MobileHeader } from './mobile/mobile-header';
import { PropertyPanel } from './property-panel';
import { LayerControl } from './layer-control';
import { ChatPanel } from './chat-panel';
import { useMapStore } from '@/lib/map-store';
import { X } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const isChatOpen = useMapStore((state) => state.isChatOpen);
  const toggleChat = useMapStore((state) => state.toggleChat);
  const toggleSiteSearch = useMapStore((state) => state.toggleSiteSearch);

  const handleOpenSiteSearch = () => {
    if (isChatOpen) {
      toggleChat(); // Close chat when opening site search
    }
    toggleSiteSearch();
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
            <div className="w-[800px] border-l bg-background">
              <ChatPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 