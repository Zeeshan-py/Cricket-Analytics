import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const matchSelect =
  "id,external_id,match_date,result,status,season_year,season_label,match_number,formats(name,slug),tournaments(name,slug),venues(name,slug,city,country),team_1:teams!matches_team_1_id_fkey(name,slug),team_2:teams!matches_team_2_id_fkey(name,slug),winner:teams!matches_winner_team_id_fkey(name,slug)";

export async function getMatchById(matchId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("matches").select(matchSelect).eq("id", matchId).maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getMatchesByYear(year: number, options: { limit?: number } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("matches")
      .select(matchSelect)
      .eq("season_year", year)
      .order("match_date", { ascending: false })
      .limit(options.limit ?? 50);

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getMatchesByFormat(formatSlug: string, options: { limit?: number } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: format, error: formatError } = await supabase
      .from("formats")
      .select("id")
      .eq("slug", formatSlug)
      .maybeSingle();

    if (formatError) throw formatError;
    if (!format) return [];

    const { data, error } = await supabase
      .from("matches")
      .select(matchSelect)
      .eq("format_id", format.id)
      .order("match_date", { ascending: false })
      .limit(options.limit ?? 50);

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
