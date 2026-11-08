import { createClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_data: {
        Row: {
          user_id: string;
          data: Json;
          updated_at: string;
          deletion_requested_at: string | null;
          scheduled_delete_at: string | null;
        };
        Insert: {
          user_id: string;
          data: Json;
          updated_at?: string;
          deletion_requested_at?: string | null;
          scheduled_delete_at?: string | null;
        };
        Update: {
          user_id?: string;
          data?: Json;
          updated_at?: string;
          deletion_requested_at?: string | null;
          scheduled_delete_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (Boolean(supabaseUrl) !== Boolean(supabasePublishableKey)) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY juntos.');
}

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const supabaseConfigured = supabase !== null;
