import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface PresenceState {
  username?: string;
  isTyping: boolean;
  online_at: string;
}

export function useOnlineUsers(channel: string, username?: string) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const presence = supabase.channel(`presence_${channel}`, {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        setOnlineUsers(state as Record<string, PresenceState>);
        
        // Update typing users based on presence state
        const typing = Object.values(state)
          .filter(user => user.isTyping)
          .map(user => user.username)
          .filter(Boolean);
        setTypingUsers(typing);
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
        if (status === 'SUBSCRIBED' && username) {
          await presence.track({
            username,
            isTyping: false,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      presence.unsubscribe();
    };
  }, [channel, username]);

  const setTyping = async (isTyping: boolean) => {
    if (!username) return;

    // Clear existing timeout for this user
    if (typingTimeoutRef.current[username]) {
      clearTimeout(typingTimeoutRef.current[username]);
    }

    // Set a new timeout to clear typing state
    if (isTyping) {
      typingTimeoutRef.current[username] = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }

    await supabase.channel(`presence_${channel}`).track({
      username,
      isTyping,
      online_at: new Date().toISOString()
    });
  };

  return {
    onlineUsers,
    onlineCount: Object.keys(onlineUsers).length,
    typingUsers: typingUsers.filter(user => user !== username),
    setTyping
  };
} 