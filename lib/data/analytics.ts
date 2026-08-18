import "server-only";
import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { ballsToOvers } from "@/lib/data/matches";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const MAX_ANALYTICS_ROWS = 10000;
const DEFAULT_PAGE_SIZE = 25;

type Ref = {
  id?: string | null;
  name: string | null;
  slug: string | null;
};

type FormatRef = Ref & {
  code?: string | null;
};

type MatchRow = {
  id: string;
  match_date: string | null;
  season_year: number | null;
  format_id: string;
  tournament_id: string | null;
  team_1_id: string;
  team_2_id: string;
  winner_team_id: string | null;
  outcome_type: string | null;
  result: string | null;
  formats: FormatRef | null;
  tournaments: Ref | null;
  team_1: Ref | null;
  team_2: Ref | null;
  winner: Ref | null;
};

type InningsRow = {
  id: string;
  match_id: string;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number | null;
  total_wickets: number | null;
  balls: number | null;
  teams: Ref | null;
};

type PlayerMatchRow = {
  match_id: string;
  player_id: string;
  team_id: string;
  format_id: string;
  runs: number;
  balls_faced: number | null;
  wickets: number;
  balls_bowled: number | null;
  runs_conceded: number | null;
  player_of_match: boolean;
  players: Ref | null;
  teams: Ref | null;
};

type BattingRow = {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  runs: number;
  balls_faced: number | null;
  fours: number;
  sixes: number;
  dismissed: boolean;
  players: Ref | null;
  teams: Ref | null;
  matches: { id: string; match_date: string | null; formats: FormatRef | null } | null;
};

type BowlingRow = {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  balls: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  players: Ref | null;
  teams: Ref | null;
  matches: { id: string; match_date: string | null; formats: FormatRef | null } | null;
};

type FieldingRow = {
  player_id: string;
  team_id: string;
  catches: number;
  stumpings: number;
  run_outs: number;
};

export type AnalyticsFilterInput = {
  year?: number;
  formatSlug?: string;
  teamSlug?: string;
  tournamentSlug?: string;
  playerSlug?: string;
};

export type AnalyticsFilterOptions = {
  years: number[];
  formats: { name: string; slug: string; code: string | null }[];
  teams: { name: string; slug: string }[];
  tournaments: { name: string; slug: string }[];
  players: { name: string; slug: string }[];
};

export type AnalyticsSummary = {
  filters: AnalyticsFilterOptions;
  appliedFilters: AnalyticsFilterInput;
  counts: {
    matches: number;
    players: number;
    teams: number;
    deliveries: number;
    runs: number | null;
    wickets: number | null;
    formats: number;
    years: number;
    tournaments: number;
  };
  charts: {
    runsByPlayer: ChartPoint[];
    wicketsByPlayer: ChartPoint[];
    matchesByTeam: ChartPoint[];
    resultDistribution: ChartPoint[];
    yearDistribution: ChartPoint[];
  };
  leaders: {
    topRunScorers: BattingLeader[];
    topWicketTakers: BowlingLeader[];
    highestScores: BattingInningsRecord[];
    bestBowling: BowlingInningsRecord[];
  };
};

export type ChartPoint = {
  label: string;
  value: number;
  href?: string;
};

export type BattingLeader = {
  playerId: string;
  playerName: string;
  playerSlug: string;
  teamName: string | null;
  teamSlug: string | null;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  dismissals: number;
  average: number | null;
  strikeRate: number | null;
  highestScore: number | null;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
};

export type BowlingLeader = {
  playerId: string;
  playerName: string;
  playerSlug: string;
  teamName: string | null;
  teamSlug: string | null;
  matches: number;
  innings: number;
  balls: number;
  overs: string | null;
  runsConceded: number;
  wickets: number;
  average: number | null;
  economy: number | null;
  strikeRate: number | null;
  maidens: number;
  bestWickets: number;
  bestRunsConceded: number | null;
};

export type BattingInningsRecord = {
  id: string;
  matchId: string;
  playerName: string;
  playerSlug: string;
  teamName: string | null;
  teamSlug: string | null;
  runs: number;
  balls: number | null;
  fours: number;
  sixes: number;
  strikeRate: number | null;
  date: string | null;
  formatName: string | null;
};

export type BowlingInningsRecord = {
  id: string;
  matchId: string;
  playerName: string;
  playerSlug: string;
  teamName: string | null;
  teamSlug: string | null;
  wickets: number;
  runsConceded: number;
  balls: number;
  overs: string | null;
  economy: number | null;
  maidens: number;
  date: string | null;
  formatName: string | null;
};

export type LeaderboardResult<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: AnalyticsFilterOptions;
  appliedFilters: AnalyticsFilterInput;
};

export type TeamAnalyticsRow = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  matches: number;
  wins: number;
  losses: number;
  drawsNoResults: number;
  unknownResults: number;
  winPercentage: number | null;
  runsScored: number;
  wicketsTaken: number;
  topRunScorer: BattingLeader | null;
  topWicketTaker: BowlingLeader | null;
};

export type PlayerComparison = {
  filters: AnalyticsFilterOptions;
  player1: ComparisonPlayer | null;
  player2: ComparisonPlayer | null;
};

export type ComparisonPlayer = {
  name: string;
  slug: string;
  teamName: string | null;
  matches: number;
  runs: number;
  battingAverage: number | null;
  strikeRate: number | null;
  highestScore: number | null;
  fifties: number;
  hundreds: number;
  wickets: number;
  bowlingAverage: number | null;
  economy: number | null;
  bestBowling: string | null;
};

export type RecordsData = {
  batting: DatasetRecord[];
  bowling: DatasetRecord[];
  match: DatasetRecord[];
};

export type DatasetRecord = {
  title: string;
  value: string;
  holder: string;
  href: string;
  context: string;
};

type ResolvedFilters = AnalyticsFilterInput & {
  formatId?: string;
  teamId?: string;
  tournamentId?: string;
  playerId?: string;
};

function round(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function divide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function pageValue(value: number | undefined, fallback = 1) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function pageSizeValue(value: number | undefined) {
  return Math.max(1, Math.min(value ?? DEFAULT_PAGE_SIZE, 100));
}

function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), page: safePage, pageSize, total, totalPages };
}

function slugMatch(row: Ref | null, slug?: string) {
  return !slug || row?.slug === slug;
}

async function selectIdBySlug(table: "formats" | "teams" | "tournaments" | "players", slug?: string) {
  if (!slug) return undefined;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return typeof data?.id === "string" ? data.id : null;
}

async function resolveFilters(filters: AnalyticsFilterInput): Promise<ResolvedFilters | null> {
  const [formatId, teamId, tournamentId, playerId] = await Promise.all([
    selectIdBySlug("formats", filters.formatSlug),
    selectIdBySlug("teams", filters.teamSlug),
    selectIdBySlug("tournaments", filters.tournamentSlug),
    selectIdBySlug("players", filters.playerSlug)
  ]);

  if ((filters.formatSlug && !formatId) || (filters.teamSlug && !teamId) || (filters.tournamentSlug && !tournamentId) || (filters.playerSlug && !playerId)) {
    return null;
  }

  return { ...filters, formatId: formatId ?? undefined, teamId: teamId ?? undefined, tournamentId: tournamentId ?? undefined, playerId: playerId ?? undefined };
}

export async function getAnalyticsFilterOptions(): Promise<AnalyticsFilterOptions> {
  try {
    const supabase = createServerSupabaseClient();
    const [matches, formats, teams, tournaments, players] = await Promise.all([
      supabase.from("matches").select("season_year").not("season_year", "is", null).range(0, MAX_ANALYTICS_ROWS - 1),
      supabase.from("formats").select("name,slug,code").order("name", { ascending: true }),
      supabase.from("teams").select("name,slug").order("name", { ascending: true }).limit(1000),
      supabase.from("tournaments").select("name,slug").order("name", { ascending: true }).limit(1000),
      supabase.from("players").select("name,slug").order("name", { ascending: true }).limit(1000)
    ]);

    for (const result of [matches, formats, teams, tournaments, players]) {
      if (result.error) throw result.error;
    }

    const yearSet = new Set<number>();
    matches.data?.forEach((row) => {
      if (typeof row.season_year === "number") yearSet.add(row.season_year);
    });

    return {
      years: [...yearSet].sort((a, b) => b - a),
      formats: (formats.data ?? []).filter((row) => row.name && row.slug).map((row) => ({ name: row.name!, slug: row.slug!, code: row.code ?? null })),
      teams: (teams.data ?? []).filter((row) => row.name && row.slug).map((row) => ({ name: row.name!, slug: row.slug! })),
      tournaments: (tournaments.data ?? []).filter((row) => row.name && row.slug).map((row) => ({ name: row.name!, slug: row.slug! })),
      players: (players.data ?? []).filter((row) => row.name && row.slug).map((row) => ({ name: row.name!, slug: row.slug! }))
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

async function getFilteredMatches(filters: ResolvedFilters): Promise<MatchRow[]> {
  const supabase = createServerSupabaseClient();

  let playerMatchIds: string[] | null = null;
  if (filters.playerId) {
    const { data, error } = await supabase.from("player_match_statistics").select("match_id").eq("player_id", filters.playerId).limit(MAX_ANALYTICS_ROWS);
    if (error) throw error;
    playerMatchIds = [...new Set((data ?? []).map((row) => row.match_id).filter(Boolean) as string[])];
    if (!playerMatchIds.length) return [];
  }

  let query = supabase
    .from("matches")
    .select(
      "id,match_date,season_year,format_id,tournament_id,team_1_id,team_2_id,winner_team_id,outcome_type,result,formats(id,name,slug,code),tournaments(id,name,slug),team_1:teams!matches_team_1_id_fkey(id,name,slug),team_2:teams!matches_team_2_id_fkey(id,name,slug),winner:teams!matches_winner_team_id_fkey(id,name,slug)"
    )
    .order("match_date", { ascending: false, nullsFirst: false })
    .limit(MAX_ANALYTICS_ROWS);

  if (typeof filters.year === "number") query = query.eq("season_year", filters.year);
  if (filters.formatId) query = query.eq("format_id", filters.formatId);
  if (filters.tournamentId) query = query.eq("tournament_id", filters.tournamentId);
  if (filters.teamId) query = query.or(`team_1_id.eq.${filters.teamId},team_2_id.eq.${filters.teamId}`);
  if (playerMatchIds) query = query.in("id", playerMatchIds);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MatchRow[];
}

async function countTableForMatches(table: "match_deliveries", matchIds: string[]) {
  if (!matchIds.length) return 0;
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).in("match_id", matchIds);
  if (error) throw error;
  return count ?? 0;
}

async function getInningsRows(matchIds: string[], filters: ResolvedFilters) {
  if (!matchIds.length) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase.from("match_innings").select("id,match_id,batting_team_id,bowling_team_id,total_runs,total_wickets,balls,teams!match_innings_batting_team_id_fkey(id,name,slug)").in("match_id", matchIds).limit(MAX_ANALYTICS_ROWS);
  if (filters.teamId) query = query.eq("batting_team_id", filters.teamId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InningsRow[];
}

async function getPlayerMatchRows(matchIds: string[], filters: ResolvedFilters) {
  if (!matchIds.length) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("player_match_statistics")
    .select("match_id,player_id,team_id,format_id,runs,balls_faced,wickets,balls_bowled,runs_conceded,player_of_match,players(id,name,slug),teams(id,name,slug)")
    .in("match_id", matchIds)
    .limit(MAX_ANALYTICS_ROWS);
  if (filters.teamId) query = query.eq("team_id", filters.teamId);
  if (filters.playerId) query = query.eq("player_id", filters.playerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PlayerMatchRow[];
}

async function getBattingRows(matchIds: string[], filters: ResolvedFilters) {
  if (!matchIds.length) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("batting_statistics")
    .select("id,match_id,player_id,team_id,runs,balls_faced,fours,sixes,dismissed,players!batting_statistics_player_id_fkey(id,name,slug),teams(id,name,slug),matches(id,match_date,formats(id,name,slug,code))")
    .in("match_id", matchIds)
    .limit(MAX_ANALYTICS_ROWS);
  if (filters.teamId) query = query.eq("team_id", filters.teamId);
  if (filters.playerId) query = query.eq("player_id", filters.playerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BattingRow[];
}

async function getBowlingRows(matchIds: string[], filters: ResolvedFilters) {
  if (!matchIds.length) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("bowling_statistics")
    .select("id,match_id,player_id,team_id,balls,maidens,runs_conceded,wickets,players!bowling_statistics_player_id_fkey(id,name,slug),teams(id,name,slug),matches(id,match_date,formats(id,name,slug,code))")
    .in("match_id", matchIds)
    .limit(MAX_ANALYTICS_ROWS);
  if (filters.teamId) query = query.eq("team_id", filters.teamId);
  if (filters.playerId) query = query.eq("player_id", filters.playerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BowlingRow[];
}

async function getFieldingRows(matchIds: string[], filters: ResolvedFilters) {
  if (!matchIds.length) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase.from("fielding_statistics").select("player_id,team_id,catches,stumpings,run_outs").in("match_id", matchIds).limit(MAX_ANALYTICS_ROWS);
  if (filters.teamId) query = query.eq("team_id", filters.teamId);
  if (filters.playerId) query = query.eq("player_id", filters.playerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FieldingRow[];
}

function buildBattingLeaders(rows: BattingRow[]): BattingLeader[] {
  const byPlayer = new Map<string, BattingLeader & { matchIds: Set<string> }>();
  rows.forEach((row) => {
    if (!row.players?.name || !row.players.slug) return;
    const existing = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      playerName: row.players.name,
      playerSlug: row.players.slug,
      teamName: row.teams?.name ?? null,
      teamSlug: row.teams?.slug ?? null,
      matches: 0,
      innings: 0,
      runs: 0,
      balls: 0,
      dismissals: 0,
      average: null,
      strikeRate: null,
      highestScore: null,
      fifties: 0,
      hundreds: 0,
      fours: 0,
      sixes: 0,
      matchIds: new Set<string>()
    };
    existing.matchIds.add(row.match_id);
    existing.innings += 1;
    existing.runs += row.runs;
    existing.balls += row.balls_faced ?? 0;
    existing.dismissals += row.dismissed ? 1 : 0;
    existing.highestScore = Math.max(existing.highestScore ?? 0, row.runs);
    existing.fifties += row.runs >= 50 && row.runs < 100 ? 1 : 0;
    existing.hundreds += row.runs >= 100 ? 1 : 0;
    existing.fours += row.fours;
    existing.sixes += row.sixes;
    byPlayer.set(row.player_id, existing);
  });

  return [...byPlayer.values()].map((row) => ({
    ...row,
    matches: row.matchIds.size,
    average: round(divide(row.runs, row.dismissals)),
    strikeRate: round(row.balls > 0 ? (row.runs / row.balls) * 100 : null),
    matchIds: undefined
  })).map(({ matchIds: _matchIds, ...row }) => row);
}

function buildBowlingLeaders(rows: BowlingRow[]): BowlingLeader[] {
  const byPlayer = new Map<string, BowlingLeader & { matchIds: Set<string> }>();
  rows.forEach((row) => {
    if (!row.players?.name || !row.players.slug) return;
    const existing = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      playerName: row.players.name,
      playerSlug: row.players.slug,
      teamName: row.teams?.name ?? null,
      teamSlug: row.teams?.slug ?? null,
      matches: 0,
      innings: 0,
      balls: 0,
      overs: null,
      runsConceded: 0,
      wickets: 0,
      average: null,
      economy: null,
      strikeRate: null,
      maidens: 0,
      bestWickets: 0,
      bestRunsConceded: null,
      matchIds: new Set<string>()
    };
    existing.matchIds.add(row.match_id);
    existing.innings += 1;
    existing.balls += row.balls;
    existing.runsConceded += row.runs_conceded;
    existing.wickets += row.wickets;
    existing.maidens += row.maidens;
    if (row.wickets > existing.bestWickets || (row.wickets === existing.bestWickets && (existing.bestRunsConceded === null || row.runs_conceded < existing.bestRunsConceded))) {
      existing.bestWickets = row.wickets;
      existing.bestRunsConceded = row.runs_conceded;
    }
    byPlayer.set(row.player_id, existing);
  });

  return [...byPlayer.values()].map((row) => ({
    ...row,
    matches: row.matchIds.size,
    overs: ballsToOvers(row.balls),
    average: round(divide(row.runsConceded, row.wickets)),
    economy: round(row.balls > 0 ? row.runsConceded / (row.balls / 6) : null),
    strikeRate: round(divide(row.balls, row.wickets)),
    matchIds: undefined
  })).map(({ matchIds: _matchIds, ...row }) => row);
}

function battingInningsRecords(rows: BattingRow[]): BattingInningsRecord[] {
  return rows
    .filter((row) => row.players?.name && row.players.slug)
    .map((row) => ({
      id: row.id,
      matchId: row.match_id,
      playerName: row.players!.name!,
      playerSlug: row.players!.slug!,
      teamName: row.teams?.name ?? null,
      teamSlug: row.teams?.slug ?? null,
      runs: row.runs,
      balls: row.balls_faced,
      fours: row.fours,
      sixes: row.sixes,
      strikeRate: round(row.balls_faced && row.balls_faced > 0 ? (row.runs / row.balls_faced) * 100 : null),
      date: row.matches?.match_date ?? null,
      formatName: row.matches?.formats?.name ?? null
    }));
}

function bowlingInningsRecords(rows: BowlingRow[]): BowlingInningsRecord[] {
  return rows
    .filter((row) => row.players?.name && row.players.slug)
    .map((row) => ({
      id: row.id,
      matchId: row.match_id,
      playerName: row.players!.name!,
      playerSlug: row.players!.slug!,
      teamName: row.teams?.name ?? null,
      teamSlug: row.teams?.slug ?? null,
      wickets: row.wickets,
      runsConceded: row.runs_conceded,
      balls: row.balls,
      overs: ballsToOvers(row.balls),
      economy: round(row.balls > 0 ? row.runs_conceded / (row.balls / 6) : null),
      maidens: row.maidens,
      date: row.matches?.match_date ?? null,
      formatName: row.matches?.formats?.name ?? null
    }));
}

function sortBatting(rows: BattingLeader[], sort = "runs") {
  const sorted = [...rows];
  if (sort === "highest-score") sorted.sort((a, b) => (b.highestScore ?? 0) - (a.highestScore ?? 0) || b.runs - a.runs);
  else if (sort === "average") sorted.sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || b.runs - a.runs);
  else if (sort === "strike-rate") sorted.sort((a, b) => (b.strikeRate ?? -1) - (a.strikeRate ?? -1) || b.runs - a.runs);
  else if (sort === "fifties") sorted.sort((a, b) => b.fifties - a.fifties || b.runs - a.runs);
  else if (sort === "hundreds") sorted.sort((a, b) => b.hundreds - a.hundreds || b.runs - a.runs);
  else if (sort === "fours") sorted.sort((a, b) => b.fours - a.fours || b.runs - a.runs);
  else if (sort === "sixes") sorted.sort((a, b) => b.sixes - a.sixes || b.runs - a.runs);
  else sorted.sort((a, b) => b.runs - a.runs || a.playerName.localeCompare(b.playerName));
  return sorted;
}

function sortBowling(rows: BowlingLeader[], sort = "wickets") {
  const sorted = [...rows];
  if (sort === "best-figures") sorted.sort((a, b) => b.bestWickets - a.bestWickets || (a.bestRunsConceded ?? 999) - (b.bestRunsConceded ?? 999));
  else if (sort === "economy") sorted.sort((a, b) => (a.economy ?? 999) - (b.economy ?? 999) || b.wickets - a.wickets);
  else if (sort === "average") sorted.sort((a, b) => (a.average ?? 999) - (b.average ?? 999) || b.wickets - a.wickets);
  else if (sort === "maidens") sorted.sort((a, b) => b.maidens - a.maidens || b.wickets - a.wickets);
  else if (sort === "overs") sorted.sort((a, b) => b.balls - a.balls || b.wickets - a.wickets);
  else if (sort === "runs-conceded") sorted.sort((a, b) => b.runsConceded - a.runsConceded || b.wickets - a.wickets);
  else sorted.sort((a, b) => b.wickets - a.wickets || (a.bestRunsConceded ?? 999) - (b.bestRunsConceded ?? 999));
  return sorted;
}

function resultLabel(match: MatchRow) {
  if (match.result) return match.result;
  if (match.winner?.name) return `${match.winner.name} won`;
  if (match.outcome_type) return match.outcome_type.replace(/-/g, " ");
  return "Unknown";
}

function chartFromMap(map: Map<string, ChartPoint>, limit = 10) {
  return [...map.values()].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, limit);
}

async function buildSummary(filters: AnalyticsFilterInput): Promise<AnalyticsSummary | null> {
  const [options, resolved] = await Promise.all([getAnalyticsFilterOptions(), resolveFilters(filters)]);
  if (!resolved) return null;
  const matches = await getFilteredMatches(resolved);
  const matchIds = matches.map((match) => match.id);
  const [innings, battingRows, bowlingRows, deliveries] = await Promise.all([
    getInningsRows(matchIds, resolved),
    getBattingRows(matchIds, resolved),
    getBowlingRows(matchIds, resolved),
    countTableForMatches("match_deliveries", matchIds)
  ]);

  const battingLeaders = buildBattingLeaders(battingRows);
  const bowlingLeaders = buildBowlingLeaders(bowlingRows);
  const teamIds = new Set<string>();
  const playerIds = new Set<string>();
  const formatIds = new Set<string>();
  const years = new Set<number>();
  const tournamentIds = new Set<string>();
  const matchesByTeam = new Map<string, ChartPoint>();
  const results = new Map<string, ChartPoint>();
  const yearDistribution = new Map<string, ChartPoint>();

  matches.forEach((match) => {
    if (match.team_1_id) teamIds.add(match.team_1_id);
    if (match.team_2_id) teamIds.add(match.team_2_id);
    if (match.format_id) formatIds.add(match.format_id);
    if (match.tournament_id) tournamentIds.add(match.tournament_id);
    if (typeof match.season_year === "number") years.add(match.season_year);
    [match.team_1, match.team_2].forEach((team) => {
      if (!team?.name || !team.slug) return;
      const current = matchesByTeam.get(team.slug) ?? { label: team.name, value: 0, href: `/teams/${team.slug}` };
      current.value += 1;
      matchesByTeam.set(team.slug, current);
    });
    const label = resultLabel(match);
    const current = results.get(label) ?? { label, value: 0 };
    current.value += 1;
    results.set(label, current);
    if (typeof match.season_year === "number") {
      const yearKey = String(match.season_year);
      const currentYear = yearDistribution.get(yearKey) ?? { label: yearKey, value: 0, href: `/analytics/year/${yearKey}` };
      currentYear.value += 1;
      yearDistribution.set(yearKey, currentYear);
    }
  });

  battingRows.forEach((row) => playerIds.add(row.player_id));
  bowlingRows.forEach((row) => playerIds.add(row.player_id));

  const totalRuns = innings.length ? innings.reduce((sum, row) => sum + (row.total_runs ?? 0), 0) : null;
  const totalWickets = innings.length ? innings.reduce((sum, row) => sum + (row.total_wickets ?? 0), 0) : null;

  return {
    filters: options,
    appliedFilters: filters,
    counts: {
      matches: matches.length,
      players: playerIds.size,
      teams: teamIds.size,
      deliveries,
      runs: totalRuns,
      wickets: totalWickets,
      formats: formatIds.size,
      years: years.size,
      tournaments: tournamentIds.size
    },
    charts: {
      runsByPlayer: sortBatting(battingLeaders).slice(0, 8).map((row) => ({ label: row.playerName, value: row.runs, href: `/players/${row.playerSlug}` })),
      wicketsByPlayer: sortBowling(bowlingLeaders).slice(0, 8).map((row) => ({ label: row.playerName, value: row.wickets, href: `/players/${row.playerSlug}` })),
      matchesByTeam: chartFromMap(matchesByTeam, 8),
      resultDistribution: chartFromMap(results, 8),
      yearDistribution: [...yearDistribution.values()].sort((a, b) => Number(a.label) - Number(b.label))
    },
    leaders: {
      topRunScorers: sortBatting(battingLeaders).slice(0, 10),
      topWicketTakers: sortBowling(bowlingLeaders).slice(0, 10),
      highestScores: battingInningsRecords(battingRows).sort((a, b) => b.runs - a.runs || (b.balls ?? 999) - (a.balls ?? 999)).slice(0, 10),
      bestBowling: bowlingInningsRecords(bowlingRows).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded).slice(0, 10)
    }
  };
}

export async function getAnalyticsOverview(filters: AnalyticsFilterInput = {}) {
  try {
    return await buildSummary(filters);
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getYearAnalytics(year: number) {
  if (!Number.isInteger(year) || year < 1800 || year > 2200) return null;
  return getAnalyticsOverview({ year });
}

export async function getFormatAnalytics(formatSlug: string) {
  return getAnalyticsOverview({ formatSlug });
}

export async function getBattingLeaderboard(options: AnalyticsFilterInput & { sort?: string; page?: number; pageSize?: number } = {}): Promise<LeaderboardResult<BattingLeader> | null> {
  try {
    const [filters, resolved] = await Promise.all([getAnalyticsFilterOptions(), resolveFilters(options)]);
    if (!resolved) return null;
    const matches = await getFilteredMatches(resolved);
    const rows = await getBattingRows(matches.map((match) => match.id), resolved);
    const sorted = sortBatting(buildBattingLeaders(rows), options.sort);
    const page = pageValue(options.page);
    const pageSize = pageSizeValue(options.pageSize);
    return { ...paginate(sorted, page, pageSize), filters, appliedFilters: options };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getBowlingLeaderboard(options: AnalyticsFilterInput & { sort?: string; page?: number; pageSize?: number } = {}): Promise<LeaderboardResult<BowlingLeader> | null> {
  try {
    const [filters, resolved] = await Promise.all([getAnalyticsFilterOptions(), resolveFilters(options)]);
    if (!resolved) return null;
    const matches = await getFilteredMatches(resolved);
    const rows = await getBowlingRows(matches.map((match) => match.id), resolved);
    const sorted = sortBowling(buildBowlingLeaders(rows), options.sort);
    const page = pageValue(options.page);
    const pageSize = pageSizeValue(options.pageSize);
    return { ...paginate(sorted, page, pageSize), filters, appliedFilters: options };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTeamAnalytics(filters: AnalyticsFilterInput = {}) {
  try {
    const [filterOptions, resolved] = await Promise.all([getAnalyticsFilterOptions(), resolveFilters(filters)]);
    if (!resolved) return null;
    const matches = await getFilteredMatches(resolved);
    const matchIds = matches.map((match) => match.id);
    const [innings, battingRows, bowlingRows] = await Promise.all([getInningsRows(matchIds, { ...resolved, teamId: undefined }), getBattingRows(matchIds, { ...resolved, teamId: undefined }), getBowlingRows(matchIds, { ...resolved, teamId: undefined })]);
    const battingLeaders = buildBattingLeaders(battingRows);
    const bowlingLeaders = buildBowlingLeaders(bowlingRows);
    const teams = new Map<string, TeamAnalyticsRow>();

    function ensureTeam(team: Ref | null, id: string | null | undefined) {
      if (!id || !team?.name || !team.slug) return null;
      const existing = teams.get(id) ?? {
        teamId: id,
        teamName: team.name,
        teamSlug: team.slug,
        matches: 0,
        wins: 0,
        losses: 0,
        drawsNoResults: 0,
        unknownResults: 0,
        winPercentage: null,
        runsScored: 0,
        wicketsTaken: 0,
        topRunScorer: null,
        topWicketTaker: null
      };
      teams.set(id, existing);
      return existing;
    }

    matches.forEach((match) => {
      const participants = [
        ensureTeam(match.team_1, match.team_1_id),
        ensureTeam(match.team_2, match.team_2_id)
      ].filter(Boolean) as TeamAnalyticsRow[];
      participants.forEach((team) => {
        team.matches += 1;
        if (match.winner_team_id === team.teamId) team.wins += 1;
        else if (match.winner_team_id && match.winner_team_id !== team.teamId) team.losses += 1;
        else if (match.outcome_type && match.outcome_type !== "winner") team.drawsNoResults += 1;
        else team.unknownResults += 1;
      });
    });

    innings.forEach((row) => {
      const team = teams.get(row.batting_team_id);
      if (team) team.runsScored += row.total_runs ?? 0;
    });
    bowlingRows.forEach((row) => {
      const team = teams.get(row.team_id);
      if (team) team.wicketsTaken += row.wickets;
    });
    teams.forEach((team) => {
      const decisive = team.wins + team.losses;
      team.winPercentage = round(decisive > 0 ? (team.wins / decisive) * 100 : null);
      team.topRunScorer = battingLeaders.filter((row) => row.teamSlug === team.teamSlug).sort((a, b) => b.runs - a.runs)[0] ?? null;
      team.topWicketTaker = bowlingLeaders.filter((row) => row.teamSlug === team.teamSlug).sort((a, b) => b.wickets - a.wickets)[0] ?? null;
    });

    return {
      filters: filterOptions,
      appliedFilters: filters,
      teams: [...teams.values()].filter((team) => slugMatch({ name: team.teamName, slug: team.teamSlug }, filters.teamSlug)).sort((a, b) => b.matches - a.matches || a.teamName.localeCompare(b.teamName))
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getPlayerComparison(player1Slug?: string, player2Slug?: string): Promise<PlayerComparison> {
  const filters = await getAnalyticsFilterOptions();
  const selected = [player1Slug, player2Slug].filter(Boolean) as string[];
  if (!selected.length) return { filters, player1: null, player2: null };
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("players").select("id,name,slug,teams!players_primary_team_id_fkey(name,slug)").in("slug", selected);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; name: string; slug: string; teams: Ref | null }[];
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  async function build(slug?: string): Promise<ComparisonPlayer | null> {
    if (!slug) return null;
    const player = bySlug.get(slug);
    if (!player) return null;
    const resolved: ResolvedFilters = { playerSlug: slug, playerId: player.id };
    const matches = await getFilteredMatches(resolved);
    const [battingRows, bowlingRows] = await Promise.all([getBattingRows(matches.map((match) => match.id), resolved), getBowlingRows(matches.map((match) => match.id), resolved)]);
    const batting = buildBattingLeaders(battingRows)[0];
    const bowling = buildBowlingLeaders(bowlingRows)[0];
    return {
      name: player.name,
      slug: player.slug,
      teamName: player.teams?.name ?? null,
      matches: new Set([...battingRows.map((row) => row.match_id), ...bowlingRows.map((row) => row.match_id)]).size,
      runs: batting?.runs ?? 0,
      battingAverage: batting?.average ?? null,
      strikeRate: batting?.strikeRate ?? null,
      highestScore: batting?.highestScore ?? null,
      fifties: batting?.fifties ?? 0,
      hundreds: batting?.hundreds ?? 0,
      wickets: bowling?.wickets ?? 0,
      bowlingAverage: bowling?.average ?? null,
      economy: bowling?.economy ?? null,
      bestBowling: bowling && bowling.bestRunsConceded !== null ? `${bowling.bestWickets}/${bowling.bestRunsConceded}` : null
    };
  }

  const [player1, player2] = await Promise.all([build(player1Slug), build(player2Slug)]);
  return { filters, player1, player2 };
}

export async function getRecords(): Promise<RecordsData> {
  const summary = await getAnalyticsOverview();
  if (!summary) return { batting: [], bowling: [], match: [] };
  const batting = summary.leaders.topRunScorers;
  const bowling = summary.leaders.topWicketTakers;
  const highestScores = summary.leaders.highestScores;
  const bestBowling = summary.leaders.bestBowling;
  const all = await buildSummary({});
  const records: RecordsData = { batting: [], bowling: [], match: [] };

  const topRuns = batting[0];
  const highScore = highestScores[0];
  const topSixes = [...batting].sort((a, b) => b.sixes - a.sixes || b.runs - a.runs)[0];
  const topFours = [...batting].sort((a, b) => b.fours - a.fours || b.runs - a.runs)[0];
  const topHundreds = [...batting].sort((a, b) => b.hundreds - a.hundreds || b.runs - a.runs)[0];
  const topFifties = [...batting].sort((a, b) => b.fifties - a.fifties || b.runs - a.runs)[0];
  const topWickets = bowling[0];
  const bestFigure = bestBowling[0];
  const topMaidens = [...bowling].sort((a, b) => b.maidens - a.maidens || b.wickets - a.wickets)[0];
  const bestEconomy = [...bowling].filter((row) => row.balls >= 12 && row.economy !== null).sort((a, b) => (a.economy ?? 999) - (b.economy ?? 999))[0];

  if (highScore) records.batting.push({ title: "Highest individual score", value: String(highScore.runs), holder: highScore.playerName, href: `/players/${highScore.playerSlug}`, context: `vs current dataset, ${highScore.formatName ?? "format unavailable"}` });
  if (topRuns) records.batting.push({ title: "Most runs", value: String(topRuns.runs), holder: topRuns.playerName, href: `/players/${topRuns.playerSlug}`, context: `${topRuns.matches} matches` });
  if (topSixes) records.batting.push({ title: "Most sixes", value: String(topSixes.sixes), holder: topSixes.playerName, href: `/players/${topSixes.playerSlug}`, context: "Boundary count from batting scorecards" });
  if (topFours) records.batting.push({ title: "Most fours", value: String(topFours.fours), holder: topFours.playerName, href: `/players/${topFours.playerSlug}`, context: "Boundary count from batting scorecards" });
  if (topHundreds) records.batting.push({ title: "Most centuries", value: String(topHundreds.hundreds), holder: topHundreds.playerName, href: `/players/${topHundreds.playerSlug}`, context: "Scores of 100 or more" });
  if (topFifties) records.batting.push({ title: "Most fifties", value: String(topFifties.fifties), holder: topFifties.playerName, href: `/players/${topFifties.playerSlug}`, context: "Scores from 50 to 99" });

  if (topWickets) records.bowling.push({ title: "Most wickets", value: String(topWickets.wickets), holder: topWickets.playerName, href: `/players/${topWickets.playerSlug}`, context: `${topWickets.overs ?? "-"} overs` });
  if (bestFigure) records.bowling.push({ title: "Best bowling figures", value: `${bestFigure.wickets}/${bestFigure.runsConceded}`, holder: bestFigure.playerName, href: `/players/${bestFigure.playerSlug}`, context: bestFigure.formatName ?? "Format unavailable" });
  if (topMaidens) records.bowling.push({ title: "Most maidens", value: String(topMaidens.maidens), holder: topMaidens.playerName, href: `/players/${topMaidens.playerSlug}`, context: "Maiden overs from bowling scorecards" });
  if (bestEconomy) records.bowling.push({ title: "Best economy", value: String(bestEconomy.economy), holder: bestEconomy.playerName, href: `/players/${bestEconomy.playerSlug}`, context: "Minimum 2 overs in the current dataset" });

  if (all) {
    const matches = await getFilteredMatches({});
    const innings = await getInningsRows(matches.map((match) => match.id), {});
    const highestTotal = [...innings].filter((row) => row.total_runs !== null).sort((a, b) => (b.total_runs ?? 0) - (a.total_runs ?? 0))[0];
    const lowestTotal = [...innings].filter((row) => row.total_runs !== null && (row.total_wickets ?? 0) >= 10).sort((a, b) => (a.total_runs ?? 9999) - (b.total_runs ?? 9999))[0];
    const largestRuns = [...matches].filter((match) => /run/.test(match.result ?? "")).sort((a, b) => {
      const ar = Number((a.result ?? "").match(/(\d+) run/)?.[1] ?? 0);
      const br = Number((b.result ?? "").match(/(\d+) run/)?.[1] ?? 0);
      return br - ar;
    })[0];
    if (highestTotal?.teams?.name) records.match.push({ title: "Highest team total", value: String(highestTotal.total_runs), holder: highestTotal.teams.name, href: highestTotal.teams.slug ? `/teams/${highestTotal.teams.slug}` : "/teams", context: "Team innings total" });
    if (lowestTotal?.teams?.name) records.match.push({ title: "Lowest all-out team total", value: String(lowestTotal.total_runs), holder: lowestTotal.teams.name, href: lowestTotal.teams.slug ? `/teams/${lowestTotal.teams.slug}` : "/teams", context: "Completed innings only" });
    if (largestRuns?.winner?.name) records.match.push({ title: "Largest winning margin by runs", value: largestRuns.result ?? "Margin unavailable", holder: largestRuns.winner.name, href: largestRuns.winner.slug ? `/teams/${largestRuns.winner.slug}` : "/teams", context: "From match result text" });
    if (topWickets) records.match.push({ title: "Most wickets by a player", value: String(topWickets.wickets), holder: topWickets.playerName, href: `/players/${topWickets.playerSlug}`, context: "Aggregate wickets in current dataset" });
  }

  return records;
}
