import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { supabase } from '@/lib/supabase';
import type { FeatureRequest } from '@/lib/supabase-types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

export function FeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'feature' | 'data' | 'bug'>('feature');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('feature_requests')
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      setRequests(data);
    };

    fetchRequests();

    const channel = supabase
      .channel('feature_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feature_requests'
        },
        (payload) => {
          setRequests(prev => [payload.new as FeatureRequest, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit feature requests",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !description.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('feature_requests')
        .insert({
          title,
          description,
          type,
          user_id: user.id
        });

      if (error) throw error;

      setTitle('');
      setDescription('');
      toast({
        title: "Success",
        description: "Feature request submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit feature request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-lg border space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{request.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-muted">
                  {request.type}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{request.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{request.profile?.username || 'Anonymous'}</span>
                <span>•</span>
                <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Feature title"
          disabled={isLoading}
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          disabled={isLoading}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'feature' | 'data' | 'bug')}
          className="w-full p-2 rounded-md border"
          disabled={isLoading}
        >
          <option value="feature">Feature Request</option>
          <option value="data">Data Request</option>
          <option value="bug">Bug Report</option>
        </select>
        <Button type="submit" className="w-full" disabled={isLoading}>
          Submit Request
        </Button>
      </form>
    </div>
  );
}
