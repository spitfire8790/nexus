import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, type RouterOptions } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import App from './App.tsx';
import './index.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthCallback } from '@/components/auth/callback';
import { initPostHog } from '@/lib/posthog';

// Initialize PostHog
initPostHog();

const routerOptions: RouterOptions = {
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
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  </StrictMode>
);
