import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChatPanel } from "./chat-panel";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatModal({ open, onOpenChange }: ChatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] h-[80vh]">
        <ChatPanel />
      </DialogContent>
    </Dialog>
  );
} 