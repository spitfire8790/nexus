import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNearmapKey } from '@/hooks/use-nearmap-key';
import { useToast } from '@/hooks/use-toast';

export function NearmapKeyDialog() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { updateApiKey, isLoading } = useNearmapKey();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateApiKey(apiKey);
    
    if (success) {
      toast({
        title: "Success",
        description: "Nearmap API key updated successfully"
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to update Nearmap API key",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Update API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Nearmap API Key</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter your Nearmap API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 