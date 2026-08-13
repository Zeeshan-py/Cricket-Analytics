import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabasePublicConfig() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getSupabasePublishableKey();

  if (!key) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return { url, key };
}

export function createServerSupabaseClient() {
  const { url, key } = getSupabasePublicConfig();

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
