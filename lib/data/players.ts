import { createServerSupabaseClient } from "@/lib/supabase/client";
import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";

export async function getPlayers(options: { limit?: number; query?: string } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    const limit = options.limit ?? 50;
    let query = supabase
      .from("players")
      .select("id,name,slug,full_name,country,role,image_url,created_at")
      .order("name", { ascending: true })
      .limit(limit);

    if (options.query) {
      query = query.ilike("name", `%${options.query}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) {
      throw new DataAccessNotConfiguredError();
    }
    throw error;
  }
}

export async function getPlayerBySlug(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .select(
        "id,name,slug,full_name,country,date_of_birth,batting_style,bowling_style,role,image_url,primary_team_id"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) {
      throw new DataAccessNotConfiguredError();
    }
    throw error;
  }
}

export async function getPlayerStatistics(slug: string) {
  try {
    const player = await getPlayerBySlug(slug);
    if (!player) return null;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("imported_player_career_aggregates")
      .select(
        "id,statistic_type,span_start_year,span_end_year,matches,innings,runs,wickets,batting_average,batting_strike_rate,bowling_average,economy_rate,bowling_strike_rate,formats(name,slug)"
      )
      .eq("player_id", player.id)
      .order("statistic_type", { ascending: true });

    if (error) throw error;
    return { player, aggregates: data ?? [] };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) {
      throw new DataAccessNotConfiguredError();
    }
    throw error;
  }
}

export async function getTopRunScorers(options: { formatSlug?: string; limit?: number } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("imported_player_career_aggregates")
      .select("id,runs,matches,innings,batting_average,batting_strike_rate,players(name,slug,country),formats(name,slug)")
      .eq("statistic_type", "batting")
      .not("runs", "is", null)
      .order("runs", { ascending: false })
      .limit(options.limit ?? 25);

    if (options.formatSlug) {
      query = query.eq("formats.slug", options.formatSlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) {
      throw new DataAccessNotConfiguredError();
    }
    throw error;
  }
}

export async function getTopWicketTakers(options: { formatSlug?: string; limit?: number } = {}) {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("imported_player_career_aggregates")
      .select("id,wickets,matches,innings,bowling_average,economy_rate,bowling_strike_rate,players(name,slug,country),formats(name,slug)")
      .eq("statistic_type", "bowling")
      .not("wickets", "is", null)
      .order("wickets", { ascending: false })
      .limit(options.limit ?? 25);

    if (options.formatSlug) {
      query = query.eq("formats.slug", options.formatSlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) {
      throw new DataAccessNotConfiguredError();
    }
    throw error;
  }
}
