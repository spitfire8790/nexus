import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useMapStore } from '@/lib/map-store';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface MapSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  elementId: string;
  slides: Slide[];
  currentSlide: number;
  setSlides: (slides: Slide[]) => void;
}

export function MapSettingsDialog({
  open,
  onClose,
  elementId,
  slides,
  currentSlide,
  setSlides
}: MapSettingsDialogProps) {
  const layerGroups = useMapStore((state) => state.layerGroups);
  
  const element = slides[currentSlide].elements.find(el => el.id === elementId);
  if (!element || element.type !== 'map') return null;

  const handleLayerToggle = (layerId: string) => {
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
    if (element && element.mapSettings) {
      const layerIndex = element.mapSettings.layers.findIndex(l => l.id === layerId);
      if (layerIndex >= 0) {
        element.mapSettings.layers[layerIndex].enabled = !element.mapSettings.layers[layerIndex].enabled;
      }
      setSlides(newSlides);
    }
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
    if (element && element.mapSettings) {
      const layerIndex = element.mapSettings.layers.findIndex(l => l.id === layerId);
      if (layerIndex >= 0) {
        element.mapSettings.layers[layerIndex].opacity = opacity;
      }
      setSlides(newSlides);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
    if (element && element.mapSettings) {
      const layers = [...element.mapSettings.layers];
      const [removed] = layers.splice(result.source.index, 1);
      layers.splice(result.destination.index, 0, removed);
      
      // Update order values
      layers.forEach((layer, index) => {
        layer.order = index;
      });
      
      element.mapSettings.layers = layers;
      setSlides(newSlides);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Map Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Show Property Boundary</span>
            <Switch
              checked={element.mapSettings?.showPropertyBoundary}
              onCheckedChange={(checked) => {
                const newSlides = [...slides];
                const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
                if (element && element.mapSettings) {
                  element.mapSettings.showPropertyBoundary = checked;
                }
                setSlides(newSlides);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Show Property Point</span>
            <Switch
              checked={element.mapSettings?.showPropertyPoint}
              onCheckedChange={(checked) => {
                const newSlides = [...slides];
                const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
                if (element && element.mapSettings) {
                  element.mapSettings.showPropertyPoint = checked;
                }
                setSlides(newSlides);
              }}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Layer Order & Visibility</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="layers">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {element.mapSettings?.layers.map((layer, index) => (
                      <Draggable key={layer.id} draggableId={layer.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-2 mb-2 rounded border"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={layer.enabled}
                                  onCheckedChange={() => handleLayerToggle(layer.id)}
                                />
                                <span>{layerGroups.find(g => 
                                  g.layers.find(l => l.id === layer.id)
                                )?.layers.find(l => l.id === layer.id)?.name}</span>
                              </div>
                            </div>
                            {layer.enabled && (
                              <div className="mt-2">
                                <Slider
                                  value={[layer.opacity * 100]}
                                  onValueChange={(value) => handleOpacityChange(layer.id, value[0] / 100)}
                                  min={0}
                                  max={100}
                                  step={1}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 