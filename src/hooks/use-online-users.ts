import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type PresenceState = {
  username: string;
  isTyping: boolean;
  online_at: string;
};

export function useOnlineUsers(channel: string, username?: string) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    const presence = supabase.channel(`presence_${channel}`, {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    let typingTimeout: NodeJS.Timeout;

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        setOnlineUsers(state as Record<string, PresenceState>);
      })
      .on('presence', { event: 'join' }, ({ key, newPresence }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: newPresence }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({
            username,
            isTyping: false,
            online_at: new Date().toISOString()
          });
        }
      });

    const updateTyping = async (typing: boolean) => {
      await presence.track({
        username,
        isTyping: typing,
        online_at: new Date().toISOString()
      });
    };

    return () => {
      clearTimeout(typingTimeout);
      presence.unsubscribe();
    };
  }, [channel, username]);

  const setTyping = async (typing: boolean) => {
    setIsTyping(typing);
    await supabase.channel(`presence_${channel}`).track({
      username,
      isTyping: typing,
      online_at: new Date().toISOString()
    });
  };

  return {
    onlineUsers,
    onlineCount: Object.keys(onlineUsers).length,
    typingUsers: Object.values(onlineUsers).filter(u => u.isTyping && u.username !== username),
    setTyping
  };
} 