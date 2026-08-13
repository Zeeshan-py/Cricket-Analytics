import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function getTournamentBySlug(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,name,slug,edition,season_year,host_country,description,image_url,formats(name,slug)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getSeriesSummaries(options: { formatSlug?: string; year?: number; limit?: number } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("imported_series_summaries")
      .select("id,series_name,slug,season_label,season_start_year,winner_name,result_status,margin,match_count,formats(name,slug)")
      .order("season_start_year", { ascending: false })
      .limit(options.limit ?? 50);

    if (options.year) {
      query = query.eq("season_start_year", options.year);
    }

    if (options.formatSlug) {
      query = query.eq("formats.slug", options.formatSlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
