import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export async function getAwardsByYear(year: number) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("awards")
      .select("id,award_name,slug,award_year,description,players(name,slug),teams(name,slug),tournaments(name,slug),formats(name,slug)")
      .eq("award_year", year)
      .order("award_name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
