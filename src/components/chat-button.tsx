import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMapStore } from '@/lib/map-store';

export function ChatButton() {
  const setChatOpen = useMapStore((state) => state.setChatOpen);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => setChatOpen(true)}
    >
      <MessageSquare className="h-5 w-5" />
      <span className="hidden sm:inline">Chat</span>
    </Button>
  );
} 