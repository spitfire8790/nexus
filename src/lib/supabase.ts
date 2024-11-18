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

console.log('Initializing Supabase client with:', { 
  url: supabaseUrl.substring(0, 20) + '...', 
  keyLength: supabaseAnonKey.length 
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey); 