import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile } from "lucide-react";
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase-types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { getUsernameColor } from '@/lib/username-color';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOnlineUsers } from '@/hooks/use-online-users';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function GeneralChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastMessageTimeRef = useRef<Date>();
  const messageCountRef = useRef(0);
  const { onlineUsers, onlineCount, typingUsers, setTyping } = useOnlineUsers('general', user?.user_metadata?.username);

  useEffect(() => {
    console.log('Auth state:', { user, isAuthenticated: !!user });
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profile:profiles(
            username,
            avatar_url
          )
        `)
        .eq('is_general', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data);
    };

    fetchMessages();

    const channel = supabase
    .channel('general_chat')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'is_general=eq.true'
      },
      async (payload: { new: ChatMessage }) => {
        // Fetch the complete message with profile information
        const { data: messageWithProfile } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profile:profiles(
              username,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();
  
        if (messageWithProfile) {
          setMessages(prev => [messageWithProfile, ...prev]);
        }
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user) {
      console.log('Auth state during send:', { user, isAuthenticated: !!user });
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages",
        variant: "destructive"
      });
      return;
    }

    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      let locationStr = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });
        locationStr = `(${position.coords.latitude},${position.coords.longitude})`;
      } catch (geoError) {
        console.log('Geolocation failed:', geoError);
      }

      const { data: messageWithProfile, error } = await supabase
        .from('chat_messages')
        .insert({
          message: newMessage,
          user_id: user.id,
          is_general: true,
          location: locationStr
        })
        .select(`
          *,
          profile:profiles(
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (messageWithProfile) {
        setMessages(prev => [messageWithProfile, ...prev]);
      }

      setNewMessage('');
      messageCountRef.current++;
      lastMessageTimeRef.current = new Date();
    } catch (error) {
      console.error('Detailed error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">General Chat</h3>
          <HoverCard>
            <HoverCardTrigger>
              <div className="text-sm text-muted-foreground cursor-help">
                {onlineCount} online
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-48">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Online Users</h4>
                <div className="text-sm space-y-1">
                  {Object.values(onlineUsers)
                    .filter(user => user.username)
                    .map(user => (
                      <div key={user.username} className={getUsernameColor(user.username)}>
                        {user.username}
                      </div>
                    ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className={`font-medium ${getUsernameColor(message.profile?.username || 'Anonymous')}`}>
                  {message.profile?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {message.moderated_message}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <div className="flex-1 flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  type="button"
                  className="h-10 w-10"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0" 
                side="top" 
                align="start"
              >
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width="100%"
                />
              </PopoverContent>
            </Popover>
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
} 