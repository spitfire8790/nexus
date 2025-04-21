// src/components/profile/user-profile-modal.tsx
import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
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
import { useToast } from '@/hooks/use-toast'; // Assuming a toast hook exists
import { Loader2 } from 'lucide-react';

// Interface for the component props
interface UserProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Modal dialog for displaying user profile information and managing subscription.
 * @param {UserProfileModalProps} props - Component props.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {function} props.onOpenChange - Function to call when the dialog's open state changes.
 */
export function UserProfileModal({ isOpen, onOpenChange }: UserProfileModalProps) {
  const { user } = useAuth(); // Get user data from auth context
  const stripe = useStripe(); // Get stripe instance
  const { toast } = useToast(); // Get toast function
  const [isLoading, setIsLoading] = useState(false);
  // Define possible subscription statuses
  type SubscriptionStatus = 'active' | 'inactive' | 'pending' | 'cancelled'; // Add other relevant statuses if needed
  // Use state for subscription status
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] = useState<SubscriptionStatus>('inactive');

  // TODO: Add a useEffect hook here later to fetch the actual status from the backend
  // and call setCurrentSubscriptionStatus with the result.
  // For now, it defaults to 'inactive'.

  const monthlyPriceId = 'price_1RG66tAcX19VZAPhQ1j2zs4y'; // The Price ID for your monthly plan

  /**
   * Handles the click event for the subscribe button.
   * Creates a Stripe Checkout session and redirects the user.
   */
  const handleSubscribeClick = async () => {
    if (!stripe || !user?.id) {
      console.error('Stripe.js has not loaded yet or user is not available.');
      toast({
        title: 'Error',
        description: 'Payment system is not ready or user not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`[INFO] Creating checkout session for user: ${user.id}, price: ${monthlyPriceId}`);
      // Call your backend endpoint to create a checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: monthlyPriceId,
          userId: user.id, // Pass user ID to potentially link/create Stripe customer and for webhook DB update
          customerEmail: user.email, // Optional: prefill email
        }),
      });

      const session = await response.json();

      if (!response.ok || session.error) {
        throw new Error(session.error?.message || 'Failed to create checkout session.');
      }

      if (!session.sessionId) {
         throw new Error('Checkout session ID missing from response.');
      }

      console.log(`[INFO] Redirecting to Stripe Checkout with session ID: ${session.sessionId}`);
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      // If redirectToCheckout fails (e.g., network error), handle it
      if (error) {
        console.error('[ERROR] Stripe redirectToCheckout failed:', error);
        throw new Error(error.message);
      }
      // No need to setIsLoading(false) here as the page redirects

    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error('[ERROR] Subscription initiation failed:', errorMsg);
      toast({
        title: 'Subscription Error',
        description: `Could not initiate subscription: ${errorMsg}`,
        variant: 'destructive',
      });
      setIsLoading(false); // Only set loading false if there was an error before redirect
    }
  };

  // TODO: Add handleManageSubscriptionClick function later
  // This would typically call another backend endpoint to create a Stripe Customer Portal session

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
            View your account details and manage your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Email</span>
            <span className="col-span-3 text-sm">{user.email ?? 'N/A'}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="text-right text-sm font-medium text-muted-foreground">Subscription</span>
            {/* Use state variable for comparison */}
            <span className={`col-span-3 text-sm font-semibold ${currentSubscriptionStatus === 'active' ? 'text-green-600' : 'text-orange-600'}`}>
              {currentSubscriptionStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <DialogFooter>
          {/* Use state variable for comparison */}
          {currentSubscriptionStatus !== 'active' ? (
            <Button onClick={handleSubscribeClick} disabled={isLoading || !stripe}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Subscribe Monthly
            </Button>
          ) : (
            <Button disabled> {/* TODO: Replace with Manage Subscription Button */}
              Manage Subscription
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
