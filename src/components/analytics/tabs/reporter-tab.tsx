import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Type, 
    BarChart, Layout, Save, FileDown, Bold, Italic, 
    AlignLeft, AlignCenter, AlignRight, MapPin,
    LineChart,
    PieChart
} from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { useMapStore } from '@/lib/map-store';
import html2canvas from 'html2canvas';

interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'map' | 'data' | 'table';
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontWeight?: string;
    textAlign?: string;
    dataType?: string; // For data elements: 'overview' | 'development' | 'planning' etc.
  };
}

interface Slide {
  id: number;
  elements: SlideElement[];
}

export function ReporterTab() {
  const { selectedProperty, mapInstance } = useMapStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Initialize with a title slide
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      elements: [
        {
          id: 'title1',
          type: 'text',
          content: 'Property Analysis Report',
          x: 200,
          y: 100,
          width: 400,
          height: 60,
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center'
          }
        },
        {
          id: 'subtitle1',
          type: 'text',
          content: selectedProperty?.address || '',
          x: 200,
          y: 180,
          width: 400,
          height: 40,
          style: {
            fontSize: 20,
            textAlign: 'center'
          }
        }
      ]
    }
  ]);

  // Handle mouse interactions for dragging elements
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (!selectedElement) return;
    
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - rect.left - dragStart.x;
    const deltaY = e.clientY - rect.top - dragStart.y;

    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(
      el => el.id === selectedElement
    );

    if (element) {
      element.x += deltaX;
      element.y += deltaY;

      setSlides(newSlides);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
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
      const canvas = await html2canvas(mapInstance.getContainer(), {
        useCORS: true,
        allowTaint: true
      });

      const newElement: SlideElement = {
        id: `map${Date.now()}`,
        type: 'map',
        content: canvas.toDataURL('image/png'),
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        style: {}
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
            pptSlide.addImage({
              data: element.content,
              x: element.x / 800,
              y: element.y / 800,
              w: element.width / 800,
              h: element.height / 800
            });
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedElement && e.key === 'Delete') {
      const newSlides = [...slides];
      newSlides[currentSlide].elements = newSlides[currentSlide].elements.filter(
        el => el.id !== selectedElement
      );
      setSlides(newSlides);
      setSelectedElement(null);
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

  const handleResize = (e: React.MouseEvent) => {
    if (!isResizing || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(
      el => el.id === selectedElement
    );

    if (element) {
      const newWidth = e.clientX - rect.left - element.x;
      const newHeight = e.clientY - rect.top - element.y;
      
      element.width = Math.max(50, newWidth); // Minimum width
      element.height = Math.max(50, newHeight); // Minimum height
      
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

  return (
    <div className="h-full flex flex-col transition-all duration-300 ease-in-out">
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
            className="bg-white aspect-[16/9] w-full max-w-6xl shadow-lg relative mx-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element.id);
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

                {/* Resize handles when element is selected */}
                {selectedElement === element.id && (
                  <>
                    <div 
                      className="absolute -right-1 -bottom-1 w-3 h-3 bg-white border border-blue-500 cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                      }}
                    />
                    <div 
                      className="absolute right-1/2 -top-4 translate-x-1/2 bg-white p-1 rounded shadow text-xs"
                    >
                      Click to edit, Delete to remove
                    </div>
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
    </div>
  );
}
