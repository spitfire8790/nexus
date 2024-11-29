import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onReactionChange: () => void;
}

export function MessageReactions({ messageId, reactions, onReactionChange }: MessageReactionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to messages",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const reaction = reactions.find(r => r.emoji === emoji);
      
      if (reaction?.hasReacted) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .match({ message_id: messageId, user_id: user.id, emoji });
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });
      }
      
      onReactionChange();
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {reactions.map(({ emoji, count, hasReacted }) => (
        <Button
          key={emoji}
          variant={hasReacted ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => handleReaction(emoji)}
          disabled={isLoading}
        >
          {emoji} {count}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isLoading}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" side="top" align="start">
          <EmojiPicker
            onEmojiClick={(emojiObject) => handleReaction(emojiObject.emoji)}
            width="100%"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 