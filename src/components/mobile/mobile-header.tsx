import { Logo } from "@/components/ui/logo";
import { Search, Layers, BookmarkPlus, MousePointerClick, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { SavedPropertiesPane } from "@/components/saved-properties-pane";
import { useMapStore } from "@/lib/map-store";
import { signOut } from '@/lib/auth';

export function MobileHeader() {
  const { mapSelectMode, setMapSelectMode } = useMapStore();
  const toggleChat = useMapStore((state) => state.toggleChat);

  return (
    <header className="mobile-header border-b bg-card shadow-sm">
      <div className="px-4 flex h-14 items-center justify-between">
        <Logo />
        <div className="header-icons flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="h-auto w-auto p-2"
            onClick={toggleChat}
          >
            <MessageSquare className="h-6 w-6" />
            <span>Chat</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-auto w-auto p-2">
                <Search className="h-6 w-6" />
                <span>Search</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <SearchPanel />
            </SheetContent>
          </Sheet>

          <Button
            variant={mapSelectMode ? "default" : "ghost"}
            className="h-auto w-auto p-2"
            onClick={() => setMapSelectMode(!mapSelectMode)}
            data-state={mapSelectMode ? "active" : "inactive"}
          >
            <MousePointerClick className="h-6 w-6" />
            <span>Select</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-auto w-auto p-2">
                <Layers className="h-6 w-6" />
                <span>Layers</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <LayerControl />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-auto w-auto p-2">
                <BookmarkPlus className="h-6 w-6" />
                <span>Saved</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <SavedPropertiesPane />
            </SheetContent>
          </Sheet>

          <Button 
            variant="ghost" 
            className="h-auto w-auto p-2"
            onClick={signOut}
          >
            <LogOut className="h-6 w-6" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}