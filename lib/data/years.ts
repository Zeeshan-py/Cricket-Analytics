import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { createServerSupabaseClient } from "@/lib/supabase/client";

type PlayerStatRow = {
  player_id: string;
  team_id: string;
  runs: number;
  wickets: number;
  catches: number;
  stumpings: number;
  players: { name: string | null; slug: string | null } | null;
  teams: { name: string | null; slug: string | null } | null;
};

export type YearSummary = {
  year: number;
  totalMatches: number;
  formats: { name: string; slug: string; matches: number }[];
  teams: { name: string; slug: string; matches: number }[];
  tournaments: { name: string; slug: string; matches: number }[];
  topRunScorers: { name: string; slug: string; teamName: string | null; teamSlug: string | null; runs: number }[];
  topWicketTakers: { name: string; slug: string; teamName: string | null; teamSlug: string | null; wickets: number }[];
  resultSummary: { label: string; matches: number }[];
  matches: MatchSummary[];
};

export type YearListItem = {
  year: number;
  matches: number;
};

function increment(map: Map<string, { name: string; slug: string; matches: number }>, item: { name: string | null; slug: string | null } | null) {
  if (!item?.name || !item.slug) return;
  const existing = map.get(item.slug) ?? { name: item.name, slug: item.slug, matches: 0 };
  existing.matches += 1;
  map.set(item.slug, existing);
}

function sortedCounts<T extends { matches: number; name?: string }>(items: T[]) {
  return items.sort((a, b) => b.matches - a.matches || (a.name ?? "").localeCompare(b.name ?? ""));
}

async function getYearMatchRows(year: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,external_id,match_date,end_date,result,status,season_year,season_label,match_number,outcome_type,outcome_margin_runs,outcome_margin_wickets,outcome_margin_innings,toss_decision,balls_per_over,formats(name,slug,code),tournaments(name,slug),venues(name,slug,city,country),team_1:teams!matches_team_1_id_fkey(name,slug),team_2:teams!matches_team_2_id_fkey(name,slug),winner:teams!matches_winner_team_id_fkey(name,slug),toss_winner:teams!matches_toss_winner_team_id_fkey(name,slug)"
    )
    .eq("season_year", year)
    .order("match_date", { ascending: false, nullsFirst: false })
    .range(0, 1999);

  if (error) throw error;
  return (data ?? []) as MatchSummary[];
}

export async function getYears(): Promise<YearListItem[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("matches")
      .select("season_year")
      .not("season_year", "is", null)
      .order("season_year", { ascending: false })
      .range(0, 4999);

    if (error) throw error;

    const counts = new Map<number, number>();
    (data ?? []).forEach((row) => {
      if (typeof row.season_year === "number") counts.set(row.season_year, (counts.get(row.season_year) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([year, matches]) => ({ year, matches }))
      .sort((a, b) => b.year - a.year);
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getYearSummary(year: number): Promise<YearSummary | null> {
  try {
    if (!Number.isInteger(year) || year < 1800 || year > 2200) return null;

    const supabase = createServerSupabaseClient();
    const matches = await getYearMatchRows(year);
    if (!matches.length) return null;

    const matchIds = matches.map((match) => match.id);
    const { data: playerRows, error: playerError } = await supabase
      .from("player_match_statistics")
      .select("player_id,team_id,runs,wickets,catches,stumpings,players(name,slug),teams(name,slug)")
      .in("match_id", matchIds)
      .range(0, 4999);

    if (playerError) throw playerError;

    const formats = new Map<string, { name: string; slug: string; matches: number }>();
    const teams = new Map<string, { name: string; slug: string; matches: number }>();
    const tournaments = new Map<string, { name: string; slug: string; matches: number }>();
    const results = new Map<string, number>();

    matches.forEach((match) => {
      increment(formats, match.formats);
      increment(teams, match.team_1);
      increment(teams, match.team_2);
      increment(tournaments, match.tournaments);
      const result = matchResultLabel(match);
      results.set(result, (results.get(result) ?? 0) + 1);
    });

    const players = new Map<string, { name: string; slug: string; teamName: string | null; teamSlug: string | null; runs: number; wickets: number }>();
    ((playerRows ?? []) as PlayerStatRow[]).forEach((row) => {
      if (!row.players?.name || !row.players.slug) return;
      const existing = players.get(row.player_id) ?? {
        name: row.players.name,
        slug: row.players.slug,
        teamName: row.teams?.name ?? null,
        teamSlug: row.teams?.slug ?? null,
        runs: 0,
        wickets: 0
      };
      existing.runs += row.runs ?? 0;
      existing.wickets += row.wickets ?? 0;
      players.set(row.player_id, existing);
    });

    const playerList = [...players.values()];

    return {
      year,
      totalMatches: matches.length,
      formats: sortedCounts([...formats.values()]),
      teams: sortedCounts([...teams.values()]),
      tournaments: sortedCounts([...tournaments.values()]),
      topRunScorers: playerList
        .filter((player) => player.runs > 0)
        .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name))
        .slice(0, 10),
      topWicketTakers: playerList
        .filter((player) => player.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets || a.name.localeCompare(b.name))
        .slice(0, 10),
      resultSummary: [...results.entries()]
        .map(([label, matchCount]) => ({ label, matches: matchCount }))
        .sort((a, b) => b.matches - a.matches || a.label.localeCompare(b.label)),
      matches: matches.slice(0, 12)
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
