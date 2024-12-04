import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CursorPosition, UserPresenceState } from '@/types/cursor';
import { useAuth } from '@/lib/auth';

export function useCursorTracking(channel: string) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const isAdmin = user?.user_metadata?.isAdmin;

  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!user?.user_metadata?.username) return;

    const cursorPosition: CursorPosition = {
      x,
      y,
      timestamp: new Date().toISOString()
    };

    await supabase.channel(`presence_${channel}`).track({
      username: user.user_metadata.username,
      isTyping: false,
      online_at: new Date().toISOString(),
      cursor: cursorPosition,
      isAdmin: user.user_metadata.isAdmin
    });
  }, [channel, user]);

  useEffect(() => {
    if (!isAdmin) return;

    const presence = supabase.channel(`presence_${channel}`);

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState<UserPresenceState>();
        const cursorState: Record<string, CursorPosition> = {};
        
        Object.entries(state).forEach(([key, value]) => {
          if (value.cursor && value.username && !value.isAdmin) {
            cursorState[value.username] = value.cursor;
          }
        });
        
        setCursors(cursorState);
      })
      .subscribe();

    return () => {
      presence.unsubscribe();
    };
  }, [channel, isAdmin]);

  return {
    cursors,
    updateCursorPosition
  };
} 