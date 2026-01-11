import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// Variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client Supabase typé pour le navigateur (composants client)
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Client Supabase non typé pour éviter les erreurs TypeScript strictes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Client pour les composants serveur
export const createServerClient = (cookies: () => ReturnType<typeof import('next/headers').cookies>) => {
  return createServerComponentClient<Database>({ cookies });
};

// Client pour les composants client (avec hooks React)
export const createBrowserClient = () => {
  return createClientComponentClient<Database>();
};

// Vérification des variables d'environnement
export const checkSupabaseConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration is missing. Please check your environment variables.');
    return false;
  }
  return true;
};

// Types d'erreur Supabase
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Helper pour gérer les erreurs Supabase
export const handleSupabaseError = (error: unknown): SupabaseError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: (error as { message: string }).message,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
      code: (error as { code?: string }).code,
    };
  }
  return { message: 'Une erreur inattendue est survenue' };
};

export default supabase;
