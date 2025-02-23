import { Logo } from "@/components/ui/logo";
import { Search, Layers, MousePointerClick, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSearchPanel } from "./mobile-search-panel";
import { LayerControl } from "@/components/layer-control";
import { useMapStore } from "@/lib/map-store";
import { signOut } from '@/lib/auth';
import { useState } from 'react';

interface MobileHeaderProps {
  onOpenSiteSearch?: () => void;
}

export function MobileHeader({ onOpenSiteSearch }: MobileHeaderProps) {
  const { mapSelectMode, setMapSelectMode } = useMapStore();
  const toggleChat = useMapStore((state) => state.toggleChat);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="mobile-header border-b bg-card shadow-sm">
      <div className="flex items-center justify-between p-2">
        <Logo />
        <div className="header-icons flex items-center gap-0.5">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-auto w-auto p-1.5 flex flex-col items-center gap-1">
                <Search className="h-5 w-5" />
                <span className="text-[10px]">Search</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px] p-0">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="font-semibold">Search Property</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <MobileSearchPanel onSelect={() => setSearchOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            className="h-auto w-auto p-1.5 flex flex-col items-center gap-1"
            onClick={onOpenSiteSearch}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px]">Site</span>
          </Button>

          <Button
            variant={mapSelectMode ? "default" : "ghost"}
            className="h-auto w-auto p-1.5 flex flex-col items-center gap-1"
            onClick={() => setMapSelectMode(!mapSelectMode)}
            data-state={mapSelectMode ? "active" : "inactive"}
          >
            <MousePointerClick className="h-5 w-5" />
            <span className="text-[10px]">Select</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-auto w-auto p-1.5 flex flex-col items-center gap-1">
                <Layers className="h-5 w-5" />
                <span className="text-[10px]">Layers</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <LayerControl />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            className="h-auto w-auto p-1.5 flex flex-col items-center gap-1"
            onClick={() => toggleChat()}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px]">Chat</span>
          </Button>

          <Button
            variant="ghost"
            className="h-auto w-auto p-1.5 flex flex-col items-center gap-1"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px]">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}