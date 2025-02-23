import { MapView } from './map-view';
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from "@/components/ui/resizable";
import { SiteSearchPanel } from './site-search-panel';
import { SearchResultsPanel } from './search-results-panel';
import { useMapStore } from '@/lib/map-store';
import { GripVertical } from 'lucide-react';

export function MapLayout() {
  const isSiteSearchOpen = useMapStore((state) => state.isSiteSearchOpen);
  const searchResults = useMapStore((state) => state.searchResults);

  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={searchResults ? 70 : 100} minSize={50}>
          <MapView />
        </ResizablePanel>
        {searchResults && (
          <>
            <ResizeHandle withHandle>
              <div>
                <GripVertical className="h-4 w-4" />
              </div>
            </ResizeHandle>
            <ResizablePanel defaultSize={30} minSize={15}>
              <div className="h-full bg-background border-t">
                <SearchResultsPanel />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}