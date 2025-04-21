// pages/api/stripe/create-checkout-session.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
// Removed fs and path imports

// Initialize Stripe client with secret key from environment variables
// Ensure STRIPE_SECRET_KEY is set in your .env file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil', // Updated based on TS error
  typescript: true,
});

// Removed logToFile function

/**
 * @typedef CreateCheckoutSessionRequest
 * @property {string} priceId - The ID of the Stripe Price object for the subscription.
 * @property {string} [userId] - Optional: Your internal user ID to potentially link/create a Stripe Customer.
 * @property {string} [customerEmail] - Optional: User's email to prefill checkout or link/create a Stripe Customer.
 */

/**
 * @typedef CreateCheckoutSessionResponse
 * @property {string} [sessionId] - The ID of the created Stripe Checkout Session.
 * @property {object} [error] - An error object if the request failed.
 * @property {string} error.message - The error message.
 */

/**
 * API handler for creating a Stripe Checkout Session for subscriptions.
 * @param {NextApiRequest} req - The incoming API request. Expects POST method.
 * @param {NextApiResponse<CreateCheckoutSessionResponse>} res - The outgoing API response.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const endpoint = '/api/stripe/create-checkout-session';
  console.log(`[INFO] ${endpoint} - Accessed`, { method: req.method }); // Basic entry log

  if (req.method === 'POST') {
    const { priceId, userId, customerEmail } = req.body;
    console.log(`[INFO] ${endpoint} - Request body`, { priceId, userId, customerEmail }); // Log relevant body parts

    // Basic validation
    if (!priceId) {
      const errorMsg = 'Missing required parameter: priceId';
      console.error(`[ERROR] ${endpoint} - ${errorMsg}`, { body: req.body });
      return res.status(400).json({ error: { message: errorMsg } });
    }

    // Define success and cancel URLs - replace with your actual frontend URLs
    const successUrl = `${req.headers.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.headers.origin}/subscription-cancelled`;

    try {
      console.log(`[INFO] ${endpoint} - Attempting to create Stripe Checkout Session`, { priceId, userId, customerEmail, successUrl, cancelUrl });

      // --- Potential Stripe Customer Logic ---
      // Here you might want to find an existing Stripe Customer based on userId
      // or create a new one if they don't exist yet.
      // Example (needs refinement based on your user model):
      // let customerId: string | undefined;
      // if (userId) {
      //   // Find user in your DB, check if they have a stripe_customer_id
      //   // If yes, use it: customerId = user.stripe_customer_id;
      //   // If no, create a Stripe customer:
      //   // const customer = await stripe.customers.create({ email: customerEmail, metadata: { internalUserId: userId } });
      //   // customerId = customer.id;
      //   // Save customerId to your user record in DB.
      // }
      // --- End Customer Logic ---

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription', // Specify subscription mode
        success_url: successUrl,
        cancel_url: cancelUrl,
        // customer: customerId, // Uncomment and use if managing Stripe Customers
        // customer_email: customerId ? undefined : customerEmail, // Pass email if not linking to existing customer
        // metadata: { // Optional: Add any metadata you need
        //   internalUserId: userId
        // }
      });

      if (!session.id) {
         throw new Error('Failed to create Stripe session - ID missing.');
      }

      console.log(`[INFO] ${endpoint} - Stripe Checkout Session created successfully`, { sessionId: session.id, priceId });
      // Return the session ID to the client
      res.status(200).json({ sessionId: session.id });

    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error(`[ERROR] ${endpoint} - Stripe Checkout Session creation failed`, { error: errorMsg, stack: error.stack, priceId });
      res.status(500).json({ error: { message: `Stripe Checkout Session creation failed: ${errorMsg}` } });
    }
  } else {
    // Handle incorrect method
    console.warn(`[WARN] ${endpoint} - Method Not Allowed`, { method: req.method });
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
