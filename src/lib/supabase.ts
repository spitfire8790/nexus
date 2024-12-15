import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL');
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

// Create a single instance of the Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'nexus-auth-token'
  }
});

// Export the singleton instance
export { supabase };

// Prevent multiple instances by not exporting createClient
export type { Database }; 