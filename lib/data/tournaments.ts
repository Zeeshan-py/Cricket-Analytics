import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { getMatches, matchResultLabel, type MatchExplorerResult, type MatchSummary } from "@/lib/data/matches";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const TOURNAMENT_PAGE_SIZE = 12;

type Ref = {
  name: string | null;
  slug: string | null;
};

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  edition: string | null;
  season_year: number | null;
  host_country: string | null;
  description: string | null;
  image_url: string | null;
  formats: Ref | null;
};

type TournamentMatchRow = {
  id: string;
  tournament_id: string | null;
  match_date: string | null;
  team_1_id: string | null;
  team_2_id: string | null;
};

type PlayerStatRow = {
  player_id: string;
  runs: number;
  wickets: number;
  players: Ref | null;
  teams: Ref | null;
};

type AwardRow = {
  award_name: string;
  players: Ref | null;
  teams: Ref | null;
  matches: { id: string; match_date: string | null } | null;
};

export type TournamentListItem = TournamentRow & {
  matchCount: number;
  teamsCount: number;
  latestMatchDate: string | null;
};

export type TournamentFilters = {
  formats: { name: string; slug: string }[];
  years: number[];
};

export type TournamentExplorerResult = {
  tournaments: TournamentListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: TournamentFilters;
};

export type TournamentDetail = {
  tournament: TournamentRow;
  matches: MatchExplorerResult;
  totalMatches: number;
  teams: { name: string; slug: string; matches: number }[];
  resultSummary: { label: string; matches: number }[];
  topRunScorers: { name: string; slug: string; teamName: string | null; teamSlug: string | null; runs: number }[];
  topWicketTakers: { name: string; slug: string; teamName: string | null; teamSlug: string | null; wickets: number }[];
  awards: { awardName: string; playerName: string | null; playerSlug: string | null; teamName: string | null; teamSlug: string | null; matchDate: string | null }[];
};

function pageValue(value: number | undefined, fallback = 1) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function clampPageSize(value: number | undefined, fallback: number, max: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}

function increment(map: Map<string, { name: string; slug: string; matches: number }>, item: Ref | null) {
  if (!item?.name || !item.slug) return;
  const existing = map.get(item.slug) ?? { name: item.name, slug: item.slug, matches: 0 };
  existing.matches += 1;
  map.set(item.slug, existing);
}

async function getFormatIdBySlug(slug?: string) {
  if (!slug) return undefined;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("formats").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return typeof data?.id === "string" ? data.id : null;
}

export async function getTournamentFilters(): Promise<TournamentFilters> {
  try {
    const supabase = createServerSupabaseClient();
    const [formats, years] = await Promise.all([
      supabase.from("formats").select("name,slug").order("name", { ascending: true }),
      supabase.from("tournaments").select("season_year").not("season_year", "is", null).order("season_year", { ascending: false }).range(0, 4999)
    ]);

    if (formats.error) throw formats.error;
    if (years.error) throw years.error;

    const yearSet = new Set<number>();
    years.data?.forEach((row) => {
      if (typeof row.season_year === "number") yearSet.add(row.season_year);
    });

    return {
      formats: (formats.data ?? []).filter((row) => row.name && row.slug) as TournamentFilters["formats"],
      years: [...yearSet].sort((a, b) => b - a)
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTournamentBySlug(slug: string): Promise<TournamentRow | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("id,name,slug,start_date,end_date,edition,season_year,host_country,description,image_url,formats(name,slug)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return (data as TournamentRow | null) ?? null;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTournaments(options: { search?: string; formatSlug?: string; year?: number; page?: number; pageSize?: number } = {}): Promise<TournamentExplorerResult> {
  try {
    const supabase = createServerSupabaseClient();
    const page = pageValue(options.page);
    const pageSize = clampPageSize(options.pageSize, TOURNAMENT_PAGE_SIZE, 50);
    const [filters, formatId] = await Promise.all([getTournamentFilters(), getFormatIdBySlug(options.formatSlug)]);

    if (options.formatSlug && !formatId) {
      return { tournaments: [], page, pageSize, total: 0, totalPages: 1, filters };
    }

    let query = supabase
      .from("tournaments")
      .select("id,name,slug,start_date,end_date,edition,season_year,host_country,description,image_url,formats(name,slug)", { count: "exact" });

    if (formatId) query = query.eq("format_id", formatId);
    if (typeof options.year === "number") query = query.eq("season_year", options.year);
    if (options.search?.trim()) {
      const pattern = `%${options.search.trim().replace(/[%*,]/g, " ")}%`;
      query = query.or(`name.ilike.${pattern},edition.ilike.${pattern},host_country.ilike.${pattern}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.order("season_year", { ascending: false, nullsFirst: false }).order("name", { ascending: true }).range(from, to);
    if (error) throw error;

    const tournaments = (data ?? []) as TournamentRow[];
    const tournamentIds = tournaments.map((item) => item.id);
    const summaries = new Map<string, { matchCount: number; teams: Set<string>; latestMatchDate: string | null }>();

    if (tournamentIds.length) {
      const { data: matchRows, error: matchError } = await supabase
        .from("matches")
        .select("id,tournament_id,match_date,team_1_id,team_2_id")
        .in("tournament_id", tournamentIds)
        .range(0, 4999);

      if (matchError) throw matchError;

      ((matchRows ?? []) as TournamentMatchRow[]).forEach((match) => {
        if (!match.tournament_id) return;
        const existing = summaries.get(match.tournament_id) ?? { matchCount: 0, teams: new Set<string>(), latestMatchDate: null };
        existing.matchCount += 1;
        if (match.team_1_id) existing.teams.add(match.team_1_id);
        if (match.team_2_id) existing.teams.add(match.team_2_id);
        if (match.match_date && (!existing.latestMatchDate || match.match_date > existing.latestMatchDate)) {
          existing.latestMatchDate = match.match_date;
        }
        summaries.set(match.tournament_id, existing);
      });
    }

    const total = count ?? 0;

    return {
      tournaments: tournaments.map((tournament) => {
        const summary = summaries.get(tournament.id);
        return {
          ...tournament,
          matchCount: summary?.matchCount ?? 0,
          teamsCount: summary?.teams.size ?? 0,
          latestMatchDate: summary?.latestMatchDate ?? null
        };
      }),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      filters
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTournamentMatches(tournamentSlug: string, options: { page?: number; pageSize?: number } = {}) {
  return getMatches({
    tournamentSlug,
    page: options.page,
    pageSize: options.pageSize ?? 10
  });
}

export async function getTournamentDetail(slug: string, options: { page?: number; pageSize?: number } = {}): Promise<TournamentDetail | null> {
  try {
    const supabase = createServerSupabaseClient();
    const tournament = await getTournamentBySlug(slug);
    if (!tournament) return null;

    const [matches, allMatches] = await Promise.all([
      getTournamentMatches(slug, { page: options.page, pageSize: options.pageSize ?? 10 }),
      getMatches({ tournamentSlug: slug, pageSize: 200 })
    ]);

    const matchIds = allMatches.matches.map((match) => match.id);
    const teams = new Map<string, { name: string; slug: string; matches: number }>();
    const results = new Map<string, number>();

    allMatches.matches.forEach((match: MatchSummary) => {
      increment(teams, match.team_1);
      increment(teams, match.team_2);
      const label = matchResultLabel(match);
      results.set(label, (results.get(label) ?? 0) + 1);
    });

    let playerRows: PlayerStatRow[] = [];
    let awardRows: AwardRow[] = [];

    if (matchIds.length) {
      const [players, awards] = await Promise.all([
        supabase
          .from("player_match_statistics")
          .select("player_id,runs,wickets,players(name,slug),teams(name,slug)")
          .in("match_id", matchIds)
          .range(0, 9999),
        supabase
          .from("awards")
          .select("award_name,players(name,slug),teams(name,slug),matches(id,match_date)")
          .eq("tournament_id", tournament.id)
          .range(0, 999)
      ]);

      if (players.error) throw players.error;
      if (awards.error) throw awards.error;
      playerRows = (players.data ?? []) as PlayerStatRow[];
      awardRows = (awards.data ?? []) as AwardRow[];
    }

    const players = new Map<string, { name: string; slug: string; teamName: string | null; teamSlug: string | null; runs: number; wickets: number }>();
    playerRows.forEach((row) => {
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
      tournament,
      matches,
      totalMatches: allMatches.total,
      teams: [...teams.values()].sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name)),
      resultSummary: [...results.entries()]
        .map(([label, matchCount]) => ({ label, matches: matchCount }))
        .sort((a, b) => b.matches - a.matches || a.label.localeCompare(b.label)),
      topRunScorers: playerList
        .filter((player) => player.runs > 0)
        .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name))
        .slice(0, 10),
      topWicketTakers: playerList
        .filter((player) => player.wickets > 0)
        .sort((a, b) => b.wickets - a.wickets || a.name.localeCompare(b.name))
        .slice(0, 10),
      awards: awardRows.map((award) => ({
        awardName: award.award_name,
        playerName: award.players?.name ?? null,
        playerSlug: award.players?.slug ?? null,
        teamName: award.teams?.name ?? null,
        teamSlug: award.teams?.slug ?? null,
        matchDate: award.matches?.match_date ?? null
      }))
    };
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
