import { useState, useRef, useEffect } from 'react';
import { ChatPanel } from './chat-panel';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/lib/map-store';

export function FloatingChat() {
  const isChatOpen = useMapStore((state) => state.isChatOpen);
  const toggleChat = useMapStore((state) => state.toggleChat);
  const dragRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 620 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition(prev => ({
        x: Math.min(Math.max(0, prev.x + e.movementX), window.innerWidth - 400),
        y: Math.min(Math.max(0, prev.y + e.movementY), window.innerHeight - 600)
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isChatOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col",
        "bg-background border rounded-lg shadow-lg",
        "w-[400px] h-[600px]"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div 
        ref={dragRef}
        className="flex items-center justify-between p-3 border-b cursor-move"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Chat</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => toggleChat()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
} 