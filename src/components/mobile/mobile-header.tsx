import { Logo } from "@/components/ui/logo";
import { Search, Layers, BookmarkPlus, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchPanel } from "@/components/search-panel";
import { LayerControl } from "@/components/layer-control";
import { SavedPropertiesPane } from "@/components/saved-properties-pane";
import { useMapStore } from "@/lib/map-store";

export function MobileHeader() {
  const { mapSelectMode, setMapSelectMode } = useMapStore();

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="px-4 flex h-14 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <SearchPanel />
            </SheetContent>
          </Sheet>

          <Button 
            variant={mapSelectMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setMapSelectMode(!mapSelectMode)}
            title="Search on map"
          >
            <MousePointerClick className="h-5 w-5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Layers className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <LayerControl />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <BookmarkPlus className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[540px]">
              <SavedPropertiesPane />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}