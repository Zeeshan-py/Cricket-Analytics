import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const MATCH_PAGE_SIZE = 12;
const DELIVERY_PAGE_SIZE = 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const matchSelect =
  "id,external_id,match_date,end_date,result,status,season_year,season_label,match_number,outcome_type,outcome_margin_runs,outcome_margin_wickets,outcome_margin_innings,toss_decision,balls_per_over,formats(name,slug,code),tournaments(name,slug),venues(name,slug,city,country),team_1:teams!matches_team_1_id_fkey(name,slug),team_2:teams!matches_team_2_id_fkey(name,slug),winner:teams!matches_winner_team_id_fkey(name,slug),toss_winner:teams!matches_toss_winner_team_id_fkey(name,slug)";

type Ref = {
  name: string | null;
  slug: string | null;
};

type FormatRef = Ref & {
  code?: string | null;
};

type VenueRef = Ref & {
  city: string | null;
  country: string | null;
};

type MatchRow = {
  id: string;
  external_id: string | null;
  match_date: string | null;
  end_date: string | null;
  result: string | null;
  status: string;
  season_year: number | null;
  season_label: string | null;
  match_number: string | null;
  outcome_type: string | null;
  outcome_margin_runs: number | null;
  outcome_margin_wickets: number | null;
  outcome_margin_innings: number | null;
  toss_decision: string | null;
  balls_per_over: number;
  formats: FormatRef | null;
  tournaments: Ref | null;
  venues: VenueRef | null;
  team_1: Ref | null;
  team_2: Ref | null;
  winner: Ref | null;
  toss_winner?: Ref | null;
};

type InningsRow = {
  id: string;
  innings_number: number;
  total_runs: number | null;
  total_wickets: number | null;
  balls: number | null;
  overs_text: string | null;
  declared: boolean;
  follow_on: boolean;
  batting_team: Ref | null;
  bowling_team: Ref | null;
};

type BattingRow = {
  id: string;
  innings_id: string | null;
  batting_position: number | null;
  runs: number;
  balls_faced: number | null;
  fours: number;
  sixes: number;
  dismissal_kind: string | null;
  dismissed: boolean;
  player: Ref | null;
  bowler: Ref | null;
  fielder: Ref | null;
  teams: Ref | null;
};

type BowlingRow = {
  id: string;
  innings_id: string | null;
  balls: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  player: Ref | null;
  teams: Ref | null;
};

type DeliveryRow = {
  id: string;
  innings_number: number;
  over_number: number;
  delivery_index: number;
  actual_delivery: string | null;
  runs_batter: number;
  runs_extras: number;
  runs_total: number;
  wickets: unknown;
  batter: Ref | null;
  bowler: Ref | null;
  non_striker: Ref | null;
};

export type MatchSummary = MatchRow;

export type MatchFilters = {
  formats: { name: string; slug: string; code: string }[];
  years: number[];
  teams: { name: string; slug: string }[];
  tournaments: { name: string; slug: string }[];
};

export type MatchExplorerOptions = {
  search?: string;
  formatSlug?: string;
  year?: number;
  teamSlug?: string;
  tournamentSlug?: string;
  winnerSlug?: string;
  sort?: "date-desc" | "date-asc";
  page?: number;
  pageSize?: number;
};

export type MatchExplorerResult = {
  matches: MatchSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: MatchFilters;
};

export type MatchInningsScorecard = InningsRow & {
  batting: BattingRow[];
  bowling: BowlingRow[];
};

export type MatchAward = {
  award_name: string;
  players: Ref | null;
  teams: Ref | null;
};

export type MatchDelivery = DeliveryRow;

export type MatchDetail = {
  match: MatchRow;
  innings: MatchInningsScorecard[];
  awards: MatchAward[];
  deliveries: MatchDelivery[];
  deliveryPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    result: string | null;
    topBatting: BattingRow | null;
    topBowling: BowlingRow | null;
    playerOfMatch: MatchAward[];
  };
};

function pageValue(value: number | undefined, fallback = 1) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function clampPageSize(value: number | undefined, fallback: number, max: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}

function toId(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function ballsToOvers(balls: number | null | undefined) {
  const value = typeof balls === "number" && Number.isFinite(balls) ? balls : 0;
  return `${Math.floor(value / 6)}.${value % 6}`;
}

export function strikeRate(runs: number, balls: number | null | undefined) {
  return balls && balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : null;
}

export function economyRate(runs: number, balls: number | null | undefined) {
  return balls && balls > 0 ? Number((runs / (balls / 6)).toFixed(2)) : null;
}

export function formatMatchTitle(match: Pick<MatchRow, "team_1" | "team_2" | "season_label" | "match_number">) {
  const teams = `${match.team_1?.name ?? "Team 1"} vs ${match.team_2?.name ?? "Team 2"}`;
  const detail = [match.match_number ? `Match ${match.match_number}` : null, match.season_label].filter(Boolean).join(", ");
  return detail ? `${teams} - ${detail}` : teams;
}

function buildResultLabel(match: MatchRow) {
  if (match.result) return match.result;
  if (match.winner?.name) return `${match.winner.name} won`;
  if (match.outcome_type) return match.outcome_type.replace(/-/g, " ");
  return match.status;
}

export function matchResultLabel(match: MatchRow) {
  return buildResultLabel(match);
}

async function getIdBySlug(table: "formats" | "teams" | "tournaments", slug?: string) {
  if (!slug) return undefined;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return toId(data?.id);
}

export async function getMatchFilterOptions(): Promise<MatchFilters> {
  try {
    const supabase = createServerSupabaseClient();
    const [formats, teams, tournaments, years] = await Promise.all([
      supabase.from("formats").select("name,slug,code").order("name", { ascending: true }),
      supabase.from("teams").select("name,slug").order("name", { ascending: true }),
      supabase.from("tournaments").select("name,slug").order("name", { ascending: true }),
      supabase.from("matches").select("season_year").not("season_year", "is", null).order("season_year", { ascending: false }).range(0, 4999)
    ]);

    for (const response of [formats, teams, tournaments, years]) {
      if (response.error) throw response.error;
    }

    const yearSet = new Set<number>();
    years.data?.forEach((row) => {
      if (typeof row.season_year === "number") yearSet.add(row.season_year);
    });

    return {
      formats: (formats.data ?? []).filter((row) => row.name && row.slug && row.code) as MatchFilters["formats"],
      teams: (teams.data ?? []).filter((row) => row.name && row.slug) as MatchFilters["teams"],
      tournaments: (tournaments.data ?? []).filter((row) => row.name && row.slug) as MatchFilters["tournaments"],
      years: [...yearSet].sort((a, b) => b - a)
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

async function buildSearchPredicates(search: string) {
  const supabase = createServerSupabaseClient();
  const term = search.trim();
  if (!term) return [];

  const escaped = term.replace(/[%*,]/g, " ");
  const pattern = `%${escaped}%`;
  const predicates = [
    `external_id.ilike.${pattern}`,
    `match_number.ilike.${pattern}`,
    `season_label.ilike.${pattern}`,
    `result.ilike.${pattern}`
  ];

  if (isUuid(term)) predicates.push(`id.eq.${term}`);

  const [teams, tournaments, venues] = await Promise.all([
    supabase.from("teams").select("id").ilike("name", pattern).limit(20),
    supabase.from("tournaments").select("id").ilike("name", pattern).limit(20),
    supabase.from("venues").select("id").ilike("name", pattern).limit(20)
  ]);

  for (const response of [teams, tournaments, venues]) {
    if (response.error) throw response.error;
  }

  teams.data?.forEach((row) => {
    if (row.id) {
      predicates.push(`team_1_id.eq.${row.id}`);
      predicates.push(`team_2_id.eq.${row.id}`);
    }
  });
  tournaments.data?.forEach((row) => row.id && predicates.push(`tournament_id.eq.${row.id}`));
  venues.data?.forEach((row) => row.id && predicates.push(`venue_id.eq.${row.id}`));

  return predicates;
}

export async function getMatches(options: MatchExplorerOptions = {}): Promise<MatchExplorerResult> {
  try {
    const supabase = createServerSupabaseClient();
    const page = pageValue(options.page);
    const pageSize = clampPageSize(options.pageSize, MATCH_PAGE_SIZE, 50);
    const [formatId, teamId, tournamentId, winnerId, filters, searchPredicates] = await Promise.all([
      getIdBySlug("formats", options.formatSlug),
      getIdBySlug("teams", options.teamSlug),
      getIdBySlug("tournaments", options.tournamentSlug),
      getIdBySlug("teams", options.winnerSlug),
      getMatchFilterOptions(),
      options.search ? buildSearchPredicates(options.search) : Promise.resolve([])
    ]);

    if ((options.formatSlug && !formatId) || (options.teamSlug && !teamId) || (options.tournamentSlug && !tournamentId) || (options.winnerSlug && !winnerId)) {
      return { matches: [], page, pageSize, total: 0, totalPages: 1, filters };
    }

    let query = supabase.from("matches").select(matchSelect, { count: "exact" });

    if (formatId) query = query.eq("format_id", formatId);
    if (typeof options.year === "number") query = query.eq("season_year", options.year);
    if (tournamentId) query = query.eq("tournament_id", tournamentId);
    if (winnerId) query = query.eq("winner_team_id", winnerId);
    if (teamId) query = query.or(`team_1_id.eq.${teamId},team_2_id.eq.${teamId}`);
    if (searchPredicates.length) query = query.or(searchPredicates.join(","));

    const ascending = options.sort === "date-asc";
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query
      .order("match_date", { ascending, nullsFirst: false })
      .order("created_at", { ascending })
      .range(from, to);

    if (error) throw error;
    const total = count ?? 0;

    return {
      matches: (data ?? []) as MatchSummary[],
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

export async function getMatchById(matchId: string, options: { deliveryPage?: number; deliveryPageSize?: number } = {}) {
  try {
    if (!isUuid(matchId)) return null;
    const supabase = createServerSupabaseClient();
    const { data: match, error: matchError } = await supabase.from("matches").select(matchSelect).eq("id", matchId).maybeSingle();

    if (matchError) throw matchError;
    if (!match) return null;

    const deliveryPage = pageValue(options.deliveryPage);
    const deliveryPageSize = clampPageSize(options.deliveryPageSize, DELIVERY_PAGE_SIZE, 120);
    const deliveryFrom = (deliveryPage - 1) * deliveryPageSize;
    const deliveryTo = deliveryFrom + deliveryPageSize - 1;

    const [innings, batting, bowling, awards, deliveries] = await Promise.all([
      supabase
        .from("match_innings")
        .select("id,innings_number,total_runs,total_wickets,balls,overs_text,declared,follow_on,batting_team:teams!match_innings_batting_team_id_fkey(name,slug),bowling_team:teams!match_innings_bowling_team_id_fkey(name,slug)")
        .eq("match_id", matchId)
        .order("innings_number", { ascending: true }),
      supabase
        .from("batting_statistics")
        .select("id,innings_id,batting_position,runs,balls_faced,fours,sixes,dismissal_kind,dismissed,player:players!batting_statistics_player_id_fkey(name,slug),bowler:players!batting_statistics_bowler_id_fkey(name,slug),fielder:players!batting_statistics_fielder_id_fkey(name,slug),teams(name,slug)")
        .eq("match_id", matchId)
        .order("batting_position", { ascending: true, nullsFirst: false }),
      supabase
        .from("bowling_statistics")
        .select("id,innings_id,balls,maidens,runs_conceded,wickets,player:players!bowling_statistics_player_id_fkey(name,slug),teams(name,slug)")
        .eq("match_id", matchId)
        .order("wickets", { ascending: false }),
      supabase
        .from("awards")
        .select("award_name,players(name,slug),teams(name,slug)")
        .eq("match_id", matchId)
        .order("award_name", { ascending: true }),
      supabase
        .from("match_deliveries")
        .select("id,innings_number,over_number,delivery_index,actual_delivery,runs_batter,runs_extras,runs_total,wickets,batter:players!match_deliveries_batter_id_fkey(name,slug),bowler:players!match_deliveries_bowler_id_fkey(name,slug),non_striker:players!match_deliveries_non_striker_id_fkey(name,slug)", { count: "exact" })
        .eq("match_id", matchId)
        .order("innings_number", { ascending: true })
        .order("over_number", { ascending: true })
        .order("delivery_index", { ascending: true })
        .range(deliveryFrom, deliveryTo)
    ]);

    for (const response of [innings, batting, bowling, awards, deliveries]) {
      if (response.error) throw response.error;
    }

    const battingRows = (batting.data ?? []) as BattingRow[];
    const bowlingRows = (bowling.data ?? []) as BowlingRow[];
    const scorecards = ((innings.data ?? []) as InningsRow[]).map((item) => ({
      ...item,
      batting: battingRows.filter((row) => row.innings_id === item.id),
      bowling: bowlingRows.filter((row) => row.innings_id === item.id)
    }));

    const topBatting = [...battingRows].sort((a, b) => b.runs - a.runs || (b.balls_faced ?? 0) - (a.balls_faced ?? 0))[0] ?? null;
    const topBowling = [...bowlingRows].sort((a, b) => b.wickets - a.wickets || a.runs_conceded - b.runs_conceded)[0] ?? null;
    const awardRows = (awards.data ?? []) as MatchAward[];

    return {
      match: match as MatchRow,
      innings: scorecards,
      awards: awardRows,
      deliveries: (deliveries.data ?? []) as DeliveryRow[],
      deliveryPagination: {
        page: deliveryPage,
        pageSize: deliveryPageSize,
        total: deliveries.count ?? 0,
        totalPages: Math.max(1, Math.ceil((deliveries.count ?? 0) / deliveryPageSize))
      },
      summary: {
        result: buildResultLabel(match as MatchRow),
        topBatting,
        topBowling,
        playerOfMatch: awardRows.filter((award) => award.award_name.toLowerCase().includes("player of the match"))
      }
    } satisfies MatchDetail;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getMatchesByYear(year: number, options: { limit?: number } = {}) {
  const result = await getMatches({ year, pageSize: options.limit ?? 50 });
  return result.matches;
}

export async function getMatchesByTeam(teamSlug: string, options: { limit?: number } = {}) {
  const result = await getMatches({ teamSlug, pageSize: options.limit ?? 50 });
  return result.matches;
}

export async function getMatchesByTournament(tournamentSlug: string, options: { limit?: number } = {}) {
  const result = await getMatches({ tournamentSlug, pageSize: options.limit ?? 50 });
  return result.matches;
}

export async function getMatchesByFormat(formatSlug: string, options: { limit?: number } = {}) {
  const result = await getMatches({ formatSlug, pageSize: options.limit ?? 50 });
  return result.matches;
}
