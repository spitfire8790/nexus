import posthog from 'posthog-js';

// Initialize PostHog with your project API key
// Replace 'your-project-api-key' with your actual PostHog API key
export const initPostHog = () => {
  posthog.init('phc_YOUR_PROJECT_API_KEY', {
    api_host: 'https://app.posthog.com',
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    // Disable capturing by default in development
    autocapture: process.env.NODE_ENV === 'production',
  });
};

export { posthog }; 