// src/components/profile/user-profile-modal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth'; // Assuming useAuth provides user info

// Interface for the component props
interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Modal dialog for displaying user profile information.
 * @param {UserProfileModalProps} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {function} props.onOpenChange - Function to call when the dialog's open state changes.
 */
export function UserProfileModal({ isOpen, onOpenChange }: UserProfileModalProps) {
  const { user } = useAuth(); // Get user data from auth context

  if (!user) {
    // Should not happen if modal is only shown for logged-in users, but good practice
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View your account details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Email</span>
            <span className="col-span-3 text-sm">{user.email ?? 'N/A'}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">User ID</span>
            <span className="col-span-3 text-sm font-mono text-xs">{user.id}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
