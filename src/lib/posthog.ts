import posthog from 'posthog-js';

// Initialize PostHog with project API key from environment variables
export const initPostHog = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST;

  if (!apiKey || !apiHost) {
    console.error('PostHog configuration missing. Please check environment variables.');
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    // Enable debug mode in development
    loaded: (posthog) => {
      if (import.meta.env.DEV) posthog.debug();
    },
    // Enable capturing only in production
    autocapture: import.meta.env.PROD,
    // Create profiles only for identified users
    person_profiles: 'identified_only',
    // Capture pageviews
    capture_pageview: true,
    // Capture performance metrics
    capture_performance: true
  });
};

export { posthog };
