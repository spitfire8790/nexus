import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Removed RouterOptions import
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import App from './App.tsx';
import './index.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthCallback } from '@/components/auth/callback';
import { initPostHog } from '@/lib/posthog';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize PostHog
initPostHog();

// Load Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error("Missing VITE_STRIPE_PUBLISHABLE_KEY");
  throw new Error("Missing VITE_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise = loadStripe(stripePublishableKey);

// Removed incorrect RouterOptions type annotation
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_partialHydration: true,
    v7_normalizeFormMethod: true,
    v7_skipActionErrorRevalidation: true
  }
};

const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
    children: [
      {
        path: 'auth/callback',
        element: <AuthCallback />
      }
    ]
  }
], routerOptions);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <RouterProvider router={router} />
        <Toaster />
      </Elements>
    </AuthProvider>
  </StrictMode>
);
