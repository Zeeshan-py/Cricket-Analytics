import "server-only";
import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { formatMatchTitle, getMatches, matchResultLabel } from "@/lib/data/matches";
import { getTournaments } from "@/lib/data/tournaments";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;

type SearchRef = {
  title: string;
  href: string;
  description: string;
  meta?: string;
};

type PlayerRow = {
  id: string;
  name: string;
  slug: string;
  full_name: string | null;
  country: string | null;
  role: string | null;
  teams: { name: string | null; slug: string | null } | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  team_type: string | null;
};

type YearRow = {
  season_year: number | null;
};

export type GlobalSearchResult = {
  query: string;
  total: number;
  groups: {
    players: SearchRef[];
    teams: SearchRef[];
    matches: SearchRef[];
    tournaments: SearchRef[];
    years: SearchRef[];
  };
};

function cleanQuery(query: string | null | undefined) {
  return (query ?? "").trim().slice(0, 80);
}

function limitValue(limit?: number) {
  if (!Number.isFinite(limit) || !limit) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.floor(limit), MAX_LIMIT));
}

function searchPattern(query: string) {
  return `%${query.replace(/[%*,]/g, " ")}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export async function searchPlayers(query: string, limit?: number): Promise<SearchRef[]> {
  const q = cleanQuery(query);
  if (!q) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("players")
    .select("id,name,slug,full_name,country,role,teams(name,slug)")
    .or(`name.ilike.${searchPattern(q)},full_name.ilike.${searchPattern(q)},country.ilike.${searchPattern(q)},role.ilike.${searchPattern(q)}`)
    .order("name", { ascending: true })
    .limit(limitValue(limit));

  if (error) throw error;

  return ((data ?? []) as PlayerRow[]).map((player) => ({
    title: player.name,
    href: `/players/${player.slug}`,
    description: [player.full_name && player.full_name !== player.name ? player.full_name : null, player.role].filter(Boolean).join(" | ") || "Player profile",
    meta: [player.country, player.teams?.name].filter(Boolean).join(" | ") || "Current dataset"
  }));
}

export async function searchTeams(query: string, limit?: number): Promise<SearchRef[]> {
  const q = cleanQuery(query);
  if (!q) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id,name,short_name,slug,country,team_type")
    .or(`name.ilike.${searchPattern(q)},short_name.ilike.${searchPattern(q)},country.ilike.${searchPattern(q)},team_type.ilike.${searchPattern(q)}`)
    .order("name", { ascending: true })
    .limit(limitValue(limit));

  if (error) throw error;

  return ((data ?? []) as TeamRow[]).map((team) => ({
    title: team.name,
    href: `/teams/${team.slug}`,
    description: [team.short_name, team.country].filter(Boolean).join(" | ") || "Team profile",
    meta: team.team_type ? team.team_type.replace(/-/g, " ") : "Current dataset"
  }));
}

export async function searchMatches(query: string, limit?: number): Promise<SearchRef[]> {
  const q = cleanQuery(query);
  if (!q) return [];

  const result = await getMatches({ search: q, pageSize: limitValue(limit) });

  return result.matches.map((match) => ({
    title: formatMatchTitle(match),
    href: `/matches/${match.id}`,
    description: matchResultLabel(match),
    meta: [formatDate(match.match_date), match.formats?.name, match.venues?.name].filter(Boolean).join(" | ")
  }));
}

export async function searchTournaments(query: string, limit?: number): Promise<SearchRef[]> {
  const q = cleanQuery(query);
  if (!q) return [];

  const result = await getTournaments({ search: q, pageSize: limitValue(limit) });

  return result.tournaments.map((tournament) => ({
    title: tournament.name,
    href: `/tournaments/${tournament.slug}`,
    description: [tournament.edition, tournament.host_country].filter(Boolean).join(" | ") || "Tournament profile",
    meta: [tournament.season_year, tournament.formats?.name, `${tournament.matchCount} matches`].filter(Boolean).join(" | ")
  }));
}

export async function searchYears(query: string, limit?: number): Promise<SearchRef[]> {
  const q = cleanQuery(query);
  if (!q || !/^\d{1,4}$/.test(q)) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select("season_year")
    .not("season_year", "is", null)
    .order("season_year", { ascending: false })
    .limit(500);

  if (error) throw error;

  const years = [
    ...new Set(
      ((data ?? []) as YearRow[])
        .map((row) => row.season_year)
        .filter((year): year is number => typeof year === "number" && String(year).startsWith(q))
    )
  ];

  return years.slice(0, limitValue(limit)).map((year) => ({
    title: String(year),
    href: `/years/${year}`,
    description: "Season and yearly cricket analytics",
    meta: "Year explorer"
  }));
}

export async function globalSearch(query: string | null | undefined, limit = DEFAULT_LIMIT): Promise<GlobalSearchResult> {
  const q = cleanQuery(query);

  if (!q) {
    return {
      query: "",
      total: 0,
      groups: { players: [], teams: [], matches: [], tournaments: [], years: [] }
    };
  }

  try {
    const [players, teams, matches, tournaments, years] = await Promise.all([
      searchPlayers(q, limit),
      searchTeams(q, limit),
      searchMatches(q, limit),
      searchTournaments(q, limit),
      searchYears(q, limit)
    ]);

    return {
      query: q,
      total: players.length + teams.length + matches.length + tournaments.length + years.length,
      groups: { players, teams, matches, tournaments, years }
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
