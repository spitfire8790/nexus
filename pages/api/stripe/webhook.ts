// pages/api/stripe/webhook.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro'; // Helper to read raw body
// Removed fs and path imports
import { supabase } from '../../../src/lib/supabase'; // Import the singleton Supabase client using relative path

// Initialize Stripe client with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil', // Match the version used elsewhere
  typescript: true,
});

// Get webhook secret from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Removed logToFile function

// Disable Next.js body parsing for this route
// Stripe requires the raw body to verify the webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API handler for Stripe Webhooks.
 * @param {NextApiRequest} req - The incoming API request (from Stripe).
 * @param {NextApiResponse} res - The outgoing API response.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const endpoint = '/api/stripe/webhook';
  if (req.method === 'POST') {
    if (!webhookSecret) {
      console.error(`[ERROR] ${endpoint} - Missing STRIPE_WEBHOOK_SECRET environment variable.`);
      return res.status(500).send('Webhook Error: Server configuration error.');
    }

    const sig = req.headers['stripe-signature'] as string;
    // Read the raw request body
    const buf = await buffer(req);
    const rawBody = buf.toString('utf8');

    let event: Stripe.Event;

    try {
      // Verify the event signature and construct the event object
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log(`[INFO] ${endpoint} - Received Stripe event: ${event.type}`, { id: event.id });
    } catch (err: any) {
      // On error, log and respond with 400
      const errorMsg = `Webhook signature verification failed: ${err.message}`;
      console.error(`[ERROR] ${endpoint} - ${errorMsg}`, { signature: sig }); // Avoid logging rawBody unless debugging
      return res.status(400).send(`Webhook Error: ${errorMsg}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[INFO] ${endpoint} - Handling checkout.session.completed`, { sessionId: session.id, customer: session.customer, subscription: session.subscription, clientRefId: session.client_reference_id });

          // --- Database Update Logic ---
          // Check if we have the necessary IDs to update the user profile
          if (session.subscription && session.customer && session.client_reference_id) {
            const userId = session.client_reference_id; // Assumes this is your internal user ID (e.g., Supabase auth ID)
            const stripeCustomerId = session.customer as string;
            const stripeSubscriptionId = session.subscription as string;
            const subscriptionStatus = 'active'; // Or derive from session/subscription object if needed

            console.log(`[INFO] ${endpoint} - Attempting to update profile for user ${userId}`, { stripeCustomerId, stripeSubscriptionId, subscriptionStatus });

            // Update the user's profile in Supabase
            // ASSUMPTION: 'profiles' table with 'id', 'stripe_customer_id', 'stripe_subscription_id', 'subscription_status' columns
            const { data, error } = await supabase
              .from('profiles')
              .update({
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId,
                subscription_status: subscriptionStatus,
              })
              .eq('id', userId) // Match the user ID passed during checkout creation
              .select() // Optionally select to confirm update
              .single(); // Expect only one row

            if (error) {
              console.error(`[ERROR] ${endpoint} - Supabase profile update failed for user ${userId}`, { error, userId, stripeCustomerId, stripeSubscriptionId });
              // Decide if this is critical enough to return 500, or just log
            } else if (data) {
              console.log(`[INFO] ${endpoint} - Successfully updated profile for user ${userId}`, { updatedData: data });
            } else {
               console.warn(`[WARN] ${endpoint} - Profile update query ran for user ${userId} but no matching row found or returned.`, { userId, stripeCustomerId, stripeSubscriptionId });
            }

          } else {
            console.warn(`[WARN] ${endpoint} - checkout.session.completed event missing required data for DB update`, { sessionId: session.id, customer: session.customer, subscription: session.subscription, clientRefId: session.client_reference_id });
          }
          break;

        // case 'customer.subscription.updated':
        //   const subscriptionUpdated = event.data.object as Stripe.Subscription;
        //   console.log(`[INFO] ${endpoint} - Handling customer.subscription.updated`, { subId: subscriptionUpdated.id, status: subscriptionUpdated.status });
        //   // Update subscription status, plan, etc., in your DB based on subscriptionUpdated.status and other fields
        //   // Find user by subscriptionUpdated.customer ID
        //   break;

        // case 'customer.subscription.deleted':
        //   const subscriptionDeleted = event.data.object as Stripe.Subscription;
        //   console.log(`[INFO] ${endpoint} - Handling customer.subscription.deleted`, { subId: subscriptionDeleted.id, status: subscriptionDeleted.status });
        //   // Mark subscription as cancelled in your DB
        //   // Find user by subscriptionDeleted.customer ID
        //   break;

        // ... handle other event types as needed

        default:
          console.warn(`[WARN] ${endpoint} - Unhandled Stripe event type: ${event.type}`, { id: event.id });
      }

      // Return a 200 response to acknowledge receipt of the event
      res.status(200).json({ received: true });

    } catch (error: any) {
       // Catch any unexpected errors during event handling
       const errorMsg = `Error handling event ${event.type}: ${error.message}`;
       console.error(`[ERROR] ${endpoint} - ${errorMsg}`, { eventId: event.id, error: error.stack });
       // Consider returning 500 to signal failure to Stripe, which might retry
       res.status(500).json({ error: "Internal server error during webhook processing." });
    }

  } else {
    console.warn(`[WARN] ${endpoint} - Method Not Allowed`, { method: req.method });
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
