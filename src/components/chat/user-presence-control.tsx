import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatusBadge } from "./user-status-badge";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function UserPresenceControl() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  const [statusMessage, setStatusMessage] = useState('');

  const updateStatus = async (newStatus: typeof status) => {
    if (!user) return;
    setStatus(newStatus);
    
    await supabase
      .from('profiles')
      .update({ 
        status: newStatus,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);
  };

  const updateStatusMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ 
        status_message: statusMessage,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);
  };

  return (
    <div className="p-3 border-b space-y-3">
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={updateStatus}>
          <SelectTrigger className="w-[140px]">
            <div className="flex items-center gap-2">
              <UserStatusBadge status={status} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="away">Away</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        <form onSubmit={updateStatusMessage} className="flex-1 flex gap-2">
          <Input
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Set a status message..."
            className="flex-1"
          />
          <Button type="submit" size="sm">Update</Button>
        </form>
      </div>
    </div>
  );
} 