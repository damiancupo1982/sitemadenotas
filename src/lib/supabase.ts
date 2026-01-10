import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Business {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Note {
  id: string;
  business_id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  user_id: string;
  created_at: string;
}
