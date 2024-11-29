import { Loader2 } from "lucide-react";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  let text = "";
  if (users.length === 1) {
    text = `${users[0]} is typing...`;
  } else if (users.length === 2) {
    text = `${users[0]} and ${users[1]} are typing...`;
  } else {
    text = `${users.length} people are typing...`;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground h-4">
      <Loader2 className="h-3 w-3 animate-spin" />
      {text}
    </div>
  );
} 