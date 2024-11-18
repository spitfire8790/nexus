import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Star } from "lucide-react";
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase-types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { useMapStore } from '@/lib/map-store';
import { Rating } from '@/components/ui/rating';
import { Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOnlineUsers } from '@/hooks/use-online-users';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getUsernameColor } from '@/lib/username-color';

export function PropertyChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const lastMessageTimeRef = useRef<Date>();
  const messageCountRef = useRef(0);
  const { onlineUsers, onlineCount, typingUsers, setTyping } = useOnlineUsers(
    `property_${selectedProperty?.propId}`,
    user?.user_metadata?.username
  );

  useEffect(() => {
    if (!selectedProperty?.propId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profile:profiles!chat_messages_user_id_profiles_fkey(
            username,
            avatar_url
          )
        `)
        .eq('property_id', selectedProperty.propId)
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
      .channel(`property_${selectedProperty.propId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `property_id=eq.${selectedProperty.propId}`
        },
        async (payload: { new: ChatMessage }) => {
          // Fetch the complete message with profile information
          const { data: messageWithProfile } = await supabase
            .from('chat_messages')
            .select(`
              *,
              profile:profiles!chat_messages_user_id_profiles_fkey(
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithProfile) {
            setMessages(prev => [...prev, messageWithProfile]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProperty?.propId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !selectedProperty?.propId) return;

    const now = new Date();
    if (lastMessageTimeRef.current) {
      if (messageCountRef.current >= 5 && 
          now.getTime() - lastMessageTimeRef.current.getTime() < 60000) {
        toast({
          title: "Rate limit exceeded",
          description: "You can only send 5 messages per minute",
          variant: "destructive"
        });
        return;
      }
      
      if (now.getTime() - lastMessageTimeRef.current.getTime() >= 60000) {
        messageCountRef.current = 0;
      }
    }

    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { data: messageWithProfile, error } = await supabase
        .from('chat_messages')
        .insert({
          message: newMessage,
          user_id: user.id,
          property_id: selectedProperty.propId,
          rating,
          is_general: false,
          location: `(${position.coords.latitude},${position.coords.longitude})`
        })
        .select(`
          *,
          profile:profiles!chat_messages_user_id_profiles_fkey(
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (messageWithProfile) {
        setMessages(prev => [...prev, messageWithProfile]);
      }

      setNewMessage('');
      setRating(0);
      messageCountRef.current++;
      lastMessageTimeRef.current = now;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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
          <div className="flex flex-col">
            <h3 className="font-semibold">Property Chat</h3>
            <span className="text-xs text-muted-foreground">
              {selectedProperty?.address}
            </span>
          </div>
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
                {message.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{message.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {message.moderated_message}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Rating value={rating} onValueChange={setRating} />
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