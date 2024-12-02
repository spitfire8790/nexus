import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Type, 
    BarChart, Layout, Save, FileDown, Bold, Italic, 
    AlignLeft, AlignCenter, AlignRight, MapPin,
    LineChart,
    PieChart,
    Settings
} from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { useMapStore } from '@/lib/map-store';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MapSettingsDialog } from './map-settings-dialog';
import { saveTemplate, loadTemplates } from '@/lib/templates';
import { Template } from '@/types/reporter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { fetchPropertyData } from '@/lib/property-data';
import { usePropertyDataStore } from '@/lib/property-data-store';


interface MapLayerSettings {
  id: string;
  enabled: boolean;
  opacity: number;
  order: number;
}

interface MapSettings {
  showPropertyBoundary: boolean;
  showPropertyPoint: boolean;
  layers: MapLayerSettings[];
}

interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'map' | 'data' | 'table' | 'image';
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    dataType?: string;
  };
  mapSettings?: MapSettings;
}

interface Slide {
  id: number;
  elements: SlideElement[];
}

interface LocalTemplate {
  id: string;
  name: string;
  userId: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

// Add this helper function near the top of the file, before the components
const getResizeHandlePosition = (position: string) => {
  const positions = {
    nw: { top: '-4px', left: '-4px' },
    n: { top: '-4px', left: '50%', transform: 'translateX(-50%)' },
    ne: { top: '-4px', right: '-4px' },
    e: { top: '50%', right: '-4px', transform: 'translateY(-50%)' },
    se: { bottom: '-4px', right: '-4px' },
    s: { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: '-4px', left: '-4px' },
    w: { top: '50%', left: '-4px', transform: 'translateY(-50%)' }
  };
  return positions[position as keyof typeof positions];
};

// Add this function after the component imports but before the ReporterTab component
const createOverviewSlide = (selectedProperty: any, data: PropertyData, mapScreenshot: string | null): Slide => ({
  id: 2,
  elements: [
    {
      id: 'overview-title',
      type: 'text',
      content: 'Property Overview',
      x: 50,
      y: 50,
      width: 700,
      height: 50,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left'
      }
    },
    {
      id: 'overview-map',
      type: 'map',
      content: mapScreenshot,
      x: 400,
      y: 120,
      width: 350,
      height: 350,
      style: {
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }
    },
    {
      id: 'overview-details',
      type: 'text',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold mb-2">Location</h3>
            <div className="flex items-center justify-between">
              <span className="font-medium">Address:</span>
              <span>{data.propertyAddress || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Local Government Area:</span>
              <span>{data.lgaName || '-'}</span>
            </div>
            
            <h3 className="font-semibold mt-4 mb-2">Dimensions</h3>
            <div className="flex items-center justify-between">
              <span className="font-medium">Property Area:</span>
              <span>{data.area ? `${data.area.toLocaleString('en-AU', { maximumFractionDigits: 0 })} m²` : '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Minimum Width:</span>
              <span>{data.width ? `${Math.round(data.width).toLocaleString('en-AU')}m` : '-'}</span>
            </div>

            <h3 className="font-semibold mt-4 mb-2">Planning</h3>
            <div className="flex items-center justify-between">
              <span className="font-medium">Land Zone:</span>
              <span>{data.zoneInfo || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Height of Building:</span>
              <span>{data.maxHeight || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Minimum Lot Size:</span>
              <span>{data.minLotSize || '-'}</span>
            </div>

            {data.heritage && data.heritage.length > 0 && (
              <>
                <h3 className="font-semibold mt-4 mb-2">Heritage</h3>
                {data.heritage.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div>Class: {item.class}</div>
                    <div>Significance: {item.significance}</div>
                    <div>Name: {item.name}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ),
      x: 50,
      y: 120,
      width: 350,
      height: 500,
      style: {
        fontSize: 14,
        textAlign: 'left'
      }
    }
  ]
});

const captureMapWithSettings = async (mapInstance: L.Map, mapSettings: MapSettings) => {
  // Store current layer states
  const layerGroups = useMapStore.getState().layerGroups;
  const originalStates = layerGroups.flatMap(g => g.layers).map(layer => ({
    id: layer.id,
    enabled: layer.enabled,
    opacity: layer.opacity
  }));

  try {
    // Apply map settings
    const layers = layerGroups.flatMap(g => g.layers);
    mapSettings.layers.forEach(layerSetting => {
      const layer = layers.find(l => l.id === layerSetting.id);
      if (layer) {
        layer.enabled = layerSetting.enabled;
        layer.opacity = layerSetting.opacity;
      }
    });

    // Force a map redraw
    mapInstance.invalidateSize();
    
    // Wait for tiles to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture screenshot with specific options
    const canvas = await html2canvas(mapInstance.getContainer(), {
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
      logging: true,
      removeContainer: false,
      scale: window.devicePixelRatio, // Use device pixel ratio for better quality
      onclone: (document, element) => {
        // Force all map panes to be visible in the clone
        const mapPane = element.querySelector('.leaflet-map-pane');
        if (mapPane) {
          const style = window.getComputedStyle(mapPane);
          const transform = style.transform || style.webkitTransform;
          (mapPane as HTMLElement).style.transform = transform;
        }
      }
    });

    return canvas.toDataURL('image/png');
  } finally {
    // Restore original layer states
    const layers = layerGroups.flatMap(g => g.layers);
    originalStates.forEach(state => {
      const layer = layers.find(l => l.id === state.id);
      if (layer) {
        layer.enabled = state.enabled;
        layer.opacity = state.opacity;
      }
    });
  }
};

// Add this type near your other interfaces
type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

// Update the ResizeHandles component
const ResizeHandles = ({ 
  element,
  setIsResizing,
  setResizeDirection 
}: { 
  element: SlideElement;
  setIsResizing: (value: boolean) => void;
  setResizeDirection: (direction: ResizeDirection | null) => void;
}) => {
  return (
    <>
      {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeDirection[]).map(position => (
        <div
          key={position}
          className="absolute w-3 h-3 bg-white border border-blue-500"
          style={{
            ...getResizeHandlePosition(position),
            cursor: `${position}-resize`,
            zIndex: 100
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeDirection(position);
          }}
        />
      ))}
    </>
  );
};

const ContextMenu = ({ x, y, onClose, slides, currentSlide, setSlides, selectedElement, setSelectedElement }: {
  x: number;
  y: number;
  onClose: () => void;
  slides: Slide[];
  currentSlide: number;
  setSlides: (slides: Slide[]) => void;
  selectedElement: string | null;
  setSelectedElement: (element: string | null) => void;
}) => {
  return (
    <div
      className="fixed bg-white shadow-lg rounded-md py-1 z-50"
      style={{ left: x, top: y }}
    >
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
          copySelectedElements(selectedElement, slides, currentSlide);
          onClose();
        }}
      >
        Copy
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
          pasteElements(slides, currentSlide, setSlides);
          onClose();
        }}
      >
        Paste
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100"
        onClick={() => {
          deleteSelectedElements(selectedElement, slides, currentSlide, setSlides, setSelectedElement);
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
};

// Add these functions before the ReporterTab component
const copySelectedElements = (selectedElement: string | null, slides: Slide[], currentSlide: number) => {
  if (!selectedElement) return;
  const elementToCopy = slides[currentSlide].elements.find(el => el.id === selectedElement);
  if (elementToCopy) {
    localStorage.setItem('copiedElement', JSON.stringify(elementToCopy));
  }
};

const pasteElements = (slides: Slide[], currentSlide: number, setSlides: (slides: Slide[]) => void) => {
  const copiedElementString = localStorage.getItem('copiedElement');
  if (!copiedElementString) return;

  try {
    const copiedElement = JSON.parse(copiedElementString);
    const newElement = {
      ...copiedElement,
      id: `${copiedElement.type}-${Date.now()}`,
      x: copiedElement.x + 20,
      y: copiedElement.y + 20
    };
    
    const newSlides = [...slides];
    newSlides[currentSlide].elements.push(newElement);
    setSlides(newSlides);
  } catch (error) {
    console.error('Error pasting element:', error);
  }
};

const deleteSelectedElements = (
  selectedElement: string | null,
  slides: Slide[],
  currentSlide: number,
  setSlides: (slides: Slide[]) => void,
  setSelectedElement: (element: string | null) => void
) => {
  if (!selectedElement) return;
  
  const newSlides = [...slides];
  newSlides[currentSlide].elements = newSlides[currentSlide].elements.filter(
    el => el.id !== selectedElement
  );
  setSlides(newSlides);
  setSelectedElement(null);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  // Implement your drop logic here
  console.log('Drop event:', e);
};

// Update the PropertyData type to include the missing properties
interface PropertyData {
  area?: number;
  maxHeight?: string;
  minLotSize?: string;
  propertyAddress?: string;
  zoneInfo?: string;
  lgaName?: string;
  width?: number;
  heritage?: Array<{
    significance: string;
    name: string;
    class: string;
  }>;
}

// Add this helper function to convert coordinates
const convertToGeoJSON = (geometry: any) => {
  if (!geometry?.rings?.[0]) return null;
  
  // Convert Web Mercator coordinates to [longitude, latitude]
  const coordinates = geometry.rings[0].map((coord: number[]) => [
    coord[0] * 180 / 20037508.34,
    Math.atan(Math.exp(coord[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90
  ]);

  // Ensure the polygon is closed
  if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
    coordinates.push([...coordinates[0]]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    },
    properties: {}
  };
};

export function ReporterTab() {
  const { selectedProperty, headerAddress, mapInstance } = useMapStore();
  const { propertyData } = usePropertyDataStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<LocalTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

  // Initialize with a title slide
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      elements: [
        {
          id: 'logo',
          type: 'text',
          content: (
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="w-full h-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                  </linearGradient>
                </defs>
                <g stroke="hsl(var(--muted-foreground)/20)" fill="none" strokeWidth="2">
                  <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(-30 50 50)" />
                  <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(30 50 50)" />
                  <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(90 50 50)" />
                </g>
              </svg>
              <span className="text-xl font-bold text-foreground tracking-wider">NEXUS</span>
            </div>
          ),
          x: 50,
          y: 50,
          width: 200,
          height: 60,
          style: {}
        },
        {
          id: 'title1',
          type: 'text',
          content: 'Property Analysis Report',
          x: 50,
          y: 200,
          width: 700,
          height: 60,
          style: {
            fontSize: 36,
            fontWeight: 'bold',
            textAlign: 'left',
          }
        },
        {
          id: 'address',
          type: 'text',
          content: headerAddress || 'Select a property',
          x: 50,
          y: 280,
          width: 700,
          height: 40,
          style: {
            fontSize: 24,
            textAlign: 'left',
          }
        },
        {
          id: 'date',
          type: 'text',
          content: new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          x: 50,
          y: 340,
          width: 700,
          height: 30,
          style: {
            fontSize: 18,
            textAlign: 'left',
          }
        }
      ]
    },
    // Add the overview slide
    createOverviewSlide(selectedProperty, {}, null)
  ]);

  // Add this effect to update the second slide when data changes
  useEffect(() => {
    if (selectedProperty && mapInstance) {
      const loadData = async () => {
        try {
          // Fetch property data
          const propertyData = await fetchPropertyData(selectedProperty);
          
          // Configure map for screenshot
          const originalZoom = mapInstance.getZoom();
          const originalCenter = mapInstance.getCenter();

          // Convert geometry and create bounds
          const geoJSON = convertToGeoJSON(selectedProperty.geometry);
          if (!geoJSON) {
            console.error('Invalid property geometry');
            return;
          }

          // Fit map to property bounds with padding
          const propertyBounds = L.geoJSON(geoJSON).getBounds();
          mapInstance.fitBounds(propertyBounds, { padding: [50, 50] });

          // Ensure NSW Imagery layer is visible
          const layerGroups = useMapStore.getState().layerGroups;
          const imageryLayer = layerGroups.flatMap(g => g.layers).find(l => l.id === 'nsw-imagery');
          if (imageryLayer) {
            const originalState = imageryLayer.enabled;
            imageryLayer.enabled = true;

            // Wait for map and tiles to settle
            setTimeout(async () => {
              try {
                const mapScreenshot = await captureMapWithSettings(mapInstance, {
                  showPropertyBoundary: true,
                  showPropertyPoint: false,
                  layers: layerGroups.flatMap(g => g.layers).map(layer => ({
                    id: layer.id,
                    enabled: layer.id === 'nsw-imagery' || layer.id === 'property-boundary',
                    opacity: layer.opacity,
                    order: layer.order
                  }))
                });

                // Update the second slide with new data
                const newSlides = [...slides];
                newSlides[1] = createOverviewSlide(selectedProperty, propertyData, mapScreenshot);
                setSlides(newSlides);

                // Restore original map state
                mapInstance.setView(originalCenter, originalZoom);
                if (imageryLayer) {
                  imageryLayer.enabled = originalState;
                }
              } catch (error) {
                console.error('Error capturing map:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Error loading property data:', error);
        }
      };

      loadData();
    }
  }, [selectedProperty, headerAddress, mapInstance]);

  // Handle mouse interactions for dragging elements
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation(); // Prevent event bubbling
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    
    if (!canvasRect) return;
    
    setIsDragging(true);
    setSelectedElement(elementId);
    setDragStart({
      x: e.clientX - (rect.left - canvasRect.left),
      y: e.clientY - (rect.top - canvasRect.top)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(el => el.id === selectedElement);
    
    if (element) {
      // Calculate new position relative to canvas
      const newX = e.clientX - canvasRect.left - dragStart.x;
      const newY = e.clientY - canvasRect.top - dragStart.y;
      
      // Add snap to grid (every 10 pixels)
      element.x = Math.round(newX / 10) * 10;
      element.y = Math.round(newY / 10) * 10;
      
      setSlides(newSlides);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add data element to slide
  const addDataElement = (dataType: string) => {
    const newElement: SlideElement = {
      id: `data${Date.now()}`,
      type: 'data',
      content: null,
      x: 100,
      y: 100,
      width: 600,
      height: 300,
      style: {
        dataType
      }
    };

    const newSlides = [...slides];
    newSlides[currentSlide].elements.push(newElement);
    setSlides(newSlides);
    setSelectedElement(newElement.id);
  };

  // Add map screenshot
  const addMapElement = async () => {
    if (!mapInstance) return;

    try {
      const mapSettings: MapSettings = {
        showPropertyBoundary: true,
        showPropertyPoint: false,
        layers: useMapStore.getState().layerGroups.flatMap(group => 
          group.layers.map((layer, index) => ({
            id: layer.id,
            enabled: layer.enabled,
            opacity: layer.opacity,
            order: index
          }))
        )
      };

      const imageData = await captureMapWithSettings(mapInstance, mapSettings);
      const newElement: SlideElement = {
        id: `map${Date.now()}`,
        type: 'map',
        content: imageData,
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        style: {},
        mapSettings
      };

      const newSlides = [...slides];
      newSlides[currentSlide].elements.push(newElement);
      setSlides(newSlides);
      setSelectedElement(newElement.id);
    } catch (error) {
      console.error('Error capturing map:', error);
    }
  };

  // Generate PowerPoint
  const generatePowerPoint = async () => {
    const pptx = new PptxGenJS();
    
    for (const slide of slides) {
      const pptSlide = pptx.addSlide();
      
      for (const element of slide.elements) {
        switch (element.type) {
          case 'text':
            pptSlide.addText(element.content, {
              x: element.x / 800, // Convert to inches (assuming 800px = 10 inches)
              y: element.y / 800,
              w: element.width / 800,
              h: element.height / 800,
              fontSize: element.style.fontSize,
              bold: element.style.fontWeight === 'bold',
              align: element.style.textAlign as any
            });
            break;
          
          case 'map':
            if (mapInstance && element.mapSettings) {
              const imageData = await captureMapWithSettings(mapInstance, element.mapSettings);
              pptSlide.addImage({
                data: imageData,
                x: element.x / 800,
                y: element.y / 800,
                w: element.width / 800,
                h: element.height / 800
              });
            }
            break;
          
          case 'data':
            // Handle data elements - fetch and format data
            // Similar to your existing getData implementation
            break;
        }
      }
    }

    await pptx.writeFile({ 
      fileName: `Property_Report_${selectedProperty?.address?.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pptx` 
    });
  };

  // Add handlers for ribbon buttons
  const handleAddText = () => {
    const newElement: SlideElement = {
      id: `text${Date.now()}`,
      type: 'text',
      content: 'Click to edit text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      style: {
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'left'
      }
    };

    const newSlides = [...slides];
    newSlides[currentSlide].elements.push(newElement);
    setSlides(newSlides);
    setSelectedElement(newElement.id);
  };

  const handleFormatText = (format: 'bold' | 'italic' | 'left' | 'center' | 'right') => {
    if (!selectedElement) return;

    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(
      el => el.id === selectedElement
    );

    if (element && element.type === 'text') {
      switch (format) {
        case 'bold':
          element.style.fontWeight = element.style.fontWeight === 'bold' ? 'normal' : 'bold';
          break;
        case 'italic':
          element.style.fontStyle = element.style.fontStyle === 'italic' ? 'normal' : 'italic';
          break;
        case 'left':
        case 'center':
        case 'right':
          element.style.textAlign = format;
          break;
      }
      setSlides(newSlides);
    }
  };

  const addTableElement = () => {
    const newElement: SlideElement = {
      id: `table${Date.now()}`,
      type: 'table',
      content: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
        ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
      ],
      x: 100,
      y: 100,
      width: 300,
      height: 150,
      style: {}
    };

    const newSlides = [...slides];
    newSlides[currentSlide].elements.push(newElement);
    setSlides(newSlides);
    setSelectedElement(newElement.id);
  };

  // Add delete handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedElement) return;

    switch (e.key) {
      case 'Delete':
        deleteSelectedElements();
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) copySelectedElements();
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) pasteElements();
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey) redo();
          else undo();
        }
        break;
    }
  };

  // Add text editing handler
  const handleTextEdit = (elementId: string, newContent: string) => {
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(
      el => el.id === elementId
    );
    if (element) {
      element.content = newContent;
      setSlides(newSlides);
    }
  };

  // Update the handleResize function to handle different directions
  const handleResize = (e: React.MouseEvent) => {
    if (!isResizing || !selectedElement || !canvasRef.current || !resizeDirection) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(
      el => el.id === selectedElement
    );

    if (element) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (resizeDirection.includes('e')) {
        element.width = Math.max(50, mouseX - element.x);
      }
      if (resizeDirection.includes('s')) {
        element.height = Math.max(50, mouseY - element.y);
      }
      if (resizeDirection.includes('w')) {
        const newWidth = element.x + element.width - mouseX;
        if (newWidth >= 50) {
          element.width = newWidth;
          element.x = mouseX;
        }
      }
      if (resizeDirection.includes('n')) {
        const newHeight = element.y + element.height - mouseY;
        if (newHeight >= 50) {
          element.height = newHeight;
          element.y = mouseY;
        }
      }
      
      setSlides(newSlides);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    async function fetchTemplates() {
      setIsLoadingTemplates(true);
      try {
        const data = await loadTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async () => {
    try {
      await saveTemplate(templateName, slides);
      setIsSaveDialogOpen(false);
      setTemplateName('');
      // Refresh templates list
      const data = await loadTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleLoadTemplate = (template: LocalTemplate) => {
    setSlides(template.slides);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setSelectionBox({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top
      });
    }
  };

  // Simple undo/redo implementation
  const undo = () => {
    // Implement undo logic here
    console.log('Undo not implemented');
  };

  const redo = () => {
    // Implement redo logic here
    console.log('Redo not implemented');
  };

  return (
    <div className="h-full flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
      {/* Ribbon UI */}
      <div className="bg-white border-b">
        <div className="flex p-1 gap-1 border-b bg-gray-50">
          <Button variant="ghost" className="text-sm px-3">
            File
          </Button>
          <Button variant="ghost" className="text-sm px-3">
            Home
          </Button>
          <Button variant="ghost" className="text-sm px-3">
            Insert
          </Button>
        </div>
        
        <div className="p-1 flex items-center gap-4">
          {/* Insert group */}
          <div className="border-r pr-4 flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-2 h-auto"
              onClick={handleAddText}
            >
              <Type className="w-5 h-5" />
              <span className="text-xs">Text</span>
            </Button>
            <Button 
              variant="outline"
              className="flex flex-col items-center p-2 h-auto"
              onClick={addMapElement}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-xs">Map</span>
            </Button>
            <Button 
              variant="outline"
              className="flex flex-col items-center p-2 h-auto"
              onClick={() => addDataElement('overview')}
            >
              <BarChart className="w-5 h-5" />
              <span className="text-xs">Chart</span>
            </Button>
            <Button 
              variant="outline"
              className="flex flex-col items-center p-2 h-auto"
              onClick={addTableElement}
            >
              <Layout className="w-5 h-5" />
              <span className="text-xs">Table</span>
            </Button>
          </div>

          {/* Format group */}
          <div className="border-r pr-4 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFormatText('bold')}
              className={selectedElement && slides[currentSlide].elements.find(el => el.id === selectedElement)?.style.fontWeight === 'bold' 
                ? 'bg-gray-100' 
                : ''}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFormatText('italic')}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-gray-200" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFormatText('left')}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFormatText('center')}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFormatText('right')}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Export group */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={generatePowerPoint}
            >
              <FileDown className="w-4 h-4" />
              Export to PowerPoint
            </Button>
          </div>

          {/* Template group */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="w-4 h-4" />
              Save Template
            </Button>
            
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                  <Button onClick={handleSaveTemplate}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Load Template</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isLoadingTemplates ? (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : templates.length === 0 ? (
                  <DropdownMenuItem disabled>No templates saved</DropdownMenuItem>
                ) : (
                  templates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main editor area - update the flex container */}
      <div className="flex-1 flex">
        {/* Slide thumbnails - add transition */}
        <div className="w-48 bg-gray-50 border-r overflow-y-auto p-2 space-y-2 transition-all duration-300">
          {slides.map((slide, index) => (
            <div 
              key={slide.id}
              className={`
                aspect-[16/9] bg-white border rounded cursor-pointer p-1
                ${currentSlide === index ? 'ring-2 ring-blue-500' : ''}
                hover:bg-gray-50 transition-colors
              `}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="text-xs text-center pt-1">
                Slide {index + 1}
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={() => {
              setSlides([...slides, {
                id: Date.now(),
                elements: []
              }]);
            }}
          >
            <Plus className="w-4 h-4" />
            New Slide
          </Button>
        </div>

        {/* Slide canvas - update to take remaining space */}
        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-hidden">
          <div 
            ref={canvasRef}
            className={cn(
              "bg-white aspect-[16/9] w-full max-w-6xl shadow-lg relative mx-auto",
              isDraggingOver && "ring-2 ring-blue-400 ring-opacity-50"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              handleDrop(e);
            }}
          >
            {slides[currentSlide].elements.map(element => (
              <div
                key={element.id}
                className={`
                  absolute cursor-move
                  ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}
                `}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === 'text' && (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full h-full outline-none cursor-text"
                    style={element.style}
                    onClick={(e) => e.stopPropagation()} // Prevent drag when editing
                    onBlur={(e) => handleTextEdit(element.id, e.target.innerText)}
                  >
                    {element.content}
                  </div>
                )}

                {element.type === 'table' && (
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      {element.content.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              contentEditable
                              suppressContentEditableWarning
                              className="border p-1 cursor-text"
                              onClick={(e) => e.stopPropagation()} // Prevent drag when editing
                              onBlur={(e) => {
                                const newSlides = [...slides];
                                const el = newSlides[currentSlide].elements.find(
                                  el => el.id === element.id
                                );
                                if (el && Array.isArray(el.content)) {
                                  el.content[rowIndex][cellIndex] = e.target.innerText;
                                  setSlides(newSlides);
                                }
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {element.type === 'image' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${element.content})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )}

                {/* Resize handles when element is selected */}
                {selectedElement === element.id && (
                  <>
                    <ResizeHandles 
                      element={element} 
                      setIsResizing={setIsResizing} 
                      setResizeDirection={setResizeDirection}
                    />
                    <div 
                      className="absolute right-1/2 -top-4 translate-x-1/2 bg-white p-1 rounded shadow text-xs"
                    >
                      Click to edit, Delete to remove
                    </div>
                  </>
                )}

                {element.type === 'map' && (
                  <>
                    <img 
                      src={element.content} 
                      alt="Map" 
                      className="w-full h-full object-cover"
                    />
                    {selectedElement === element.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMapSettingsOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clear selection when clicking empty space */}
        <div 
          className="absolute inset-0" 
          onClick={() => setSelectedElement(null)}
          style={{ pointerEvents: selectedElement ? 'auto' : 'none' }}
        />

        {/* Properties panel */}
        {selectedElement && (
          <div className="w-64 bg-white border-l p-4">
            <h3 className="font-medium mb-4">Format</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Position</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-xs">X</label>
                    <input 
                      type="number" 
                      className="w-full border rounded px-2 py-1"
                      value={Math.round(slides[currentSlide].elements.find(
                        el => el.id === selectedElement
                      )?.x || 0)}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        const element = newSlides[currentSlide].elements.find(
                          el => el.id === selectedElement
                        );
                        if (element) {
                          element.x = parseInt(e.target.value);
                          setSlides(newSlides);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs">Y</label>
                    <input 
                      type="number"
                      className="w-full border rounded px-2 py-1"
                      value={Math.round(slides[currentSlide].elements.find(
                        el => el.id === selectedElement
                      )?.y || 0)}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        const element = newSlides[currentSlide].elements.find(
                          el => el.id === selectedElement
                        );
                        if (element) {
                          element.y = parseInt(e.target.value);
                          setSlides(newSlides);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MapSettingsDialog
        open={isMapSettingsOpen}
        onClose={() => {
          setIsMapSettingsOpen(false);
          setSelectedMapId(null);
        }}
        elementId={selectedMapId || ''}
        slides={slides}
        currentSlide={currentSlide}
        setSlides={setSlides}
      />
    </div>
  );
}
