import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function getTeams() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,short_name,slug,country,team_type,logo_url")
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTeamBySlug(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,short_name,slug,country,team_type,logo_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
