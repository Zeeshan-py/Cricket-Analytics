import { createServerSupabaseClient } from "@/lib/supabase/client";
import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";

const PLAYER_PAGE_SIZE = 24;
const MAX_CURRENT_SAMPLE_ROWS = 5000;

type NullableNumber = number | null | undefined;

type PlayerBase = {
  id: string;
  name: string;
  slug: string;
  full_name: string | null;
  country: string | null;
  role: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  date_of_birth: string | null;
  image_url: string | null;
  primary_team_id: string | null;
  teams?: { name: string | null; slug: string | null; country: string | null } | null;
};

type PlayerMatchRow = {
  player_id: string;
  team_id: string;
  format_id: string;
  match_id: string;
  runs: number;
  balls_faced: number | null;
  wickets: number;
  balls_bowled: number | null;
  runs_conceded: number | null;
  catches: number;
  stumpings: number;
  player_of_match: boolean;
  players?: PlayerBase | null;
  teams?: { name: string | null; slug: string | null; country: string | null } | null;
  formats?: { name: string | null; slug: string | null; code: string | null } | null;
  matches?: {
    id: string;
    external_id: string | null;
    match_date: string | null;
    result: string | null;
    status: string;
    team_1_id: string;
    team_2_id: string;
    winner_team_id: string | null;
    formats?: { name: string | null; slug: string | null; code: string | null } | null;
    team_1?: { name: string | null; slug: string | null } | null;
    team_2?: { name: string | null; slug: string | null } | null;
    winner?: { name: string | null; slug: string | null } | null;
  } | null;
};

type BattingRow = {
  match_id: string;
  innings_id: string | null;
  player_id: string;
  runs: number;
  balls_faced: number | null;
  fours: number;
  sixes: number;
  dismissed: boolean;
  matches?: {
    id: string;
    match_date: string | null;
    formats?: { name: string | null; slug: string | null; code: string | null } | null;
  } | null;
};

type BowlingRow = {
  match_id: string;
  innings_id: string | null;
  player_id: string;
  balls: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  matches?: {
    id: string;
    match_date: string | null;
    formats?: { name: string | null; slug: string | null; code: string | null } | null;
  } | null;
};

export type PlayerSummary = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  role: string | null;
  teamName: string | null;
  teamSlug: string | null;
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number | null;
  strikeRate: number | null;
  ballsFaced: number;
};

export type PlayerExplorerFilters = {
  search?: string;
  country?: string;
  teamSlug?: string;
  formatSlug?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type PlayerExplorerResult = {
  players: PlayerSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  filters: {
    countries: string[];
    teams: { name: string; slug: string }[];
    formats: { name: string; slug: string; code: string }[];
  };
};

export type PlayerCareerOverview = {
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number | null;
  strikeRate: number | null;
  highestScore: number | null;
  fifties: number;
  hundreds: number;
};

export type PlayerBattingStats = {
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  average: number | null;
  strikeRate: number | null;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  highestScore: number | null;
};

export type PlayerBowlingStats = {
  matches: number;
  innings: number;
  balls: number;
  overs: string | null;
  runsConceded: number;
  wickets: number;
  economy: number | null;
  average: number | null;
  strikeRate: number | null;
  maidens: number;
};

export type PlayerFormatStats = {
  formatName: string;
  formatSlug: string;
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number | null;
  strikeRate: number | null;
};

export type PlayerRecentMatch = {
  matchId: string;
  date: string | null;
  formatName: string | null;
  opponentName: string | null;
  opponentSlug: string | null;
  runs: number;
  wickets: number;
  result: string | null;
};

export type PlayerChartPoint = {
  matchId: string;
  label: string;
  date: string | null;
  runs: number;
  wickets: number;
};

export type PlayerProfile = {
  player: PlayerBase;
  summary: PlayerSummary;
  overview: PlayerCareerOverview;
  batting: PlayerBattingStats | null;
  bowling: PlayerBowlingStats | null;
  formats: PlayerFormatStats[];
  recentMatches: PlayerRecentMatch[];
  charts: {
    runsByMatch: PlayerChartPoint[];
    wicketsByMatch: PlayerChartPoint[];
  };
};

function toNumber(value: NullableNumber) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function divide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function ballsToOvers(balls: number) {
  if (balls <= 0) return null;
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  return `${overs}.${remaining}`;
}

function formatMatchLabel(match: PlayerMatchRow["matches"], index: number) {
  if (match?.external_id) return match.external_id;
  if (match?.match_date) return match.match_date.slice(0, 10);
  return `Match ${index + 1}`;
}

function createEmptySummary(player: PlayerBase): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    slug: player.slug,
    country: player.country,
    role: player.role,
    teamName: player.teams?.name ?? null,
    teamSlug: player.teams?.slug ?? null,
    matches: 0,
    runs: 0,
    wickets: 0,
    battingAverage: null,
    strikeRate: null,
    ballsFaced: 0
  };
}

function buildSummaries(players: PlayerBase[], matchRows: PlayerMatchRow[], battingRows: BattingRow[]) {
  const summaries = new Map(players.map((player) => [player.id, createEmptySummary(player)]));
  const matchIdsByPlayer = new Map<string, Set<string>>();
  const dismissalsByPlayer = new Map<string, number>();

  for (const row of matchRows) {
    const summary = summaries.get(row.player_id);
    if (!summary) continue;
    summary.runs += toNumber(row.runs);
    summary.wickets += toNumber(row.wickets);
    summary.ballsFaced += toNumber(row.balls_faced);
    if (!matchIdsByPlayer.has(row.player_id)) matchIdsByPlayer.set(row.player_id, new Set());
    matchIdsByPlayer.get(row.player_id)?.add(row.match_id);
  }

  for (const row of battingRows) {
    if (!row.dismissed) continue;
    dismissalsByPlayer.set(row.player_id, (dismissalsByPlayer.get(row.player_id) ?? 0) + 1);
  }

  for (const summary of summaries.values()) {
    summary.matches = matchIdsByPlayer.get(summary.id)?.size ?? 0;
    summary.battingAverage = round(divide(summary.runs, dismissalsByPlayer.get(summary.id) ?? 0));
    summary.strikeRate = round(summary.ballsFaced > 0 ? (summary.runs / summary.ballsFaced) * 100 : null);
  }

  return [...summaries.values()];
}

function sortSummaries(players: PlayerSummary[], sort: string) {
  const sorted = [...players];
  if (sort === "runs") sorted.sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
  else if (sort === "wickets") sorted.sort((a, b) => b.wickets - a.wickets || a.name.localeCompare(b.name));
  else if (sort === "matches") sorted.sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name));
  else if (sort === "strike-rate") sorted.sort((a, b) => toNumber(b.strikeRate) - toNumber(a.strikeRate) || a.name.localeCompare(b.name));
  else sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

async function getReferenceFilters(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const [playersResult, teamsResult, formatsResult] = await Promise.all([
    supabase.from("players").select("country").not("country", "is", null).limit(1000),
    supabase.from("teams").select("name,slug").order("name", { ascending: true }).limit(500),
    supabase.from("formats").select("name,slug,code").order("name", { ascending: true })
  ]);

  if (playersResult.error) throw playersResult.error;
  if (teamsResult.error) throw teamsResult.error;
  if (formatsResult.error) throw formatsResult.error;

  return {
    countries: [...new Set((playersResult.data ?? []).map((row) => row.country).filter(Boolean) as string[])].sort(),
    teams: (teamsResult.data ?? []).filter((team) => team.name && team.slug).map((team) => ({ name: team.name!, slug: team.slug! })),
    formats: (formatsResult.data ?? [])
      .filter((format) => format.name && format.slug && format.code)
      .map((format) => ({ name: format.name!, slug: format.slug!, code: format.code! }))
  };
}

async function getPlayerMatchRows(playerIds: string[], formatSlug?: string) {
  if (playerIds.length === 0) return [];
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("player_match_statistics")
    .select("player_id,team_id,format_id,match_id,runs,balls_faced,wickets,balls_bowled,runs_conceded,catches,stumpings,player_of_match,formats(name,slug,code)")
    .in("player_id", playerIds)
    .limit(MAX_CURRENT_SAMPLE_ROWS);

  if (formatSlug) query = query.eq("formats.slug", formatSlug);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as PlayerMatchRow[]).filter((row) => !formatSlug || row.formats?.slug === formatSlug);
}

async function getPlayerBattingRows(playerIds: string[]) {
  if (playerIds.length === 0) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("batting_statistics")
    .select("match_id,innings_id,player_id,runs,balls_faced,fours,sixes,dismissed,matches(id,match_date,formats(name,slug,code))")
    .in("player_id", playerIds)
    .limit(MAX_CURRENT_SAMPLE_ROWS);
  if (error) throw error;
  return (data ?? []) as BattingRow[];
}

export async function getPlayers(options: PlayerExplorerFilters = {}): Promise<PlayerExplorerResult> {
  try {
    const supabase = createServerSupabaseClient();
    const pageSize = Math.max(1, Math.min(options.pageSize ?? PLAYER_PAGE_SIZE, 48));
    const page = Math.max(1, options.page ?? 1);
    const sort = options.sort ?? "name";
    const filters = await getReferenceFilters(supabase);

    let query = supabase
      .from("players")
      .select("id,name,slug,full_name,country,role,batting_style,bowling_style,date_of_birth,image_url,primary_team_id,teams!players_primary_team_id_fkey(name,slug,country)")
      .order("name", { ascending: true })
      .limit(1000);

    if (options.search) query = query.ilike("name", `%${options.search}%`);
    if (options.country) query = query.eq("country", options.country);
    if (options.teamSlug) query = query.eq("teams.slug", options.teamSlug);

    const { data, error } = await query;
    if (error) throw error;

    let players = ((data ?? []) as PlayerBase[]).filter((player) => !options.teamSlug || player.teams?.slug === options.teamSlug);
    const matchRows = await getPlayerMatchRows(players.map((player) => player.id), options.formatSlug);
    const representedPlayerIds = new Set(matchRows.map((row) => row.player_id));
    if (options.formatSlug) players = players.filter((player) => representedPlayerIds.has(player.id));
    const battingRows = await getPlayerBattingRows(players.map((player) => player.id));
    const summaries = sortSummaries(buildSummaries(players, matchRows, battingRows), sort);
    const total = summaries.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (Math.min(page, totalPages) - 1) * pageSize;

    return {
      players: summaries.slice(start, start + pageSize),
      page: Math.min(page, totalPages),
      pageSize,
      total,
      totalPages,
      filters
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getPlayerBySlug(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .select("id,name,slug,full_name,country,date_of_birth,batting_style,bowling_style,role,image_url,primary_team_id,teams!players_primary_team_id_fkey(name,slug,country)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data as PlayerBase | null;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getPlayerProfile(slug: string): Promise<PlayerProfile | null> {
  try {
    const player = await getPlayerBySlug(slug);
    if (!player) return null;
    const supabase = createServerSupabaseClient();

    const [matchResult, battingResult, bowlingResult] = await Promise.all([
      supabase
        .from("player_match_statistics")
        .select("player_id,team_id,format_id,match_id,runs,balls_faced,wickets,balls_bowled,runs_conceded,catches,stumpings,player_of_match,teams(name,slug,country),formats(name,slug,code),matches(id,external_id,match_date,result,status,team_1_id,team_2_id,winner_team_id,formats(name,slug,code),team_1:teams!matches_team_1_id_fkey(name,slug),team_2:teams!matches_team_2_id_fkey(name,slug),winner:teams!matches_winner_team_id_fkey(name,slug))")
        .eq("player_id", player.id)
        .order("match_date", { referencedTable: "matches", ascending: false })
        .limit(500),
      supabase
        .from("batting_statistics")
        .select("match_id,innings_id,player_id,runs,balls_faced,fours,sixes,dismissed,matches(id,match_date,formats(name,slug,code))")
        .eq("player_id", player.id)
        .limit(500),
      supabase
        .from("bowling_statistics")
        .select("match_id,innings_id,player_id,balls,maidens,runs_conceded,wickets,matches(id,match_date,formats(name,slug,code))")
        .eq("player_id", player.id)
        .limit(500)
    ]);

    if (matchResult.error) throw matchResult.error;
    if (battingResult.error) throw battingResult.error;
    if (bowlingResult.error) throw bowlingResult.error;

    const matchRows = (matchResult.data ?? []) as PlayerMatchRow[];
    const battingRows = (battingResult.data ?? []) as BattingRow[];
    const bowlingRows = (bowlingResult.data ?? []) as BowlingRow[];
    const [summary] = buildSummaries([player], matchRows, battingRows);

    const battingMatches = new Set(battingRows.map((row) => row.match_id));
    const battingRuns = battingRows.reduce((sum, row) => sum + toNumber(row.runs), 0);
    const battingBalls = battingRows.reduce((sum, row) => sum + toNumber(row.balls_faced), 0);
    const dismissals = battingRows.filter((row) => row.dismissed).length;
    const highestScore = battingRows.length ? Math.max(...battingRows.map((row) => row.runs)) : null;
    const batting: PlayerBattingStats | null = battingRows.length
      ? {
          matches: battingMatches.size,
          innings: battingRows.length,
          runs: battingRuns,
          balls: battingBalls,
          average: round(divide(battingRuns, dismissals)),
          strikeRate: round(battingBalls > 0 ? (battingRuns / battingBalls) * 100 : null),
          fifties: battingRows.filter((row) => row.runs >= 50 && row.runs < 100).length,
          hundreds: battingRows.filter((row) => row.runs >= 100).length,
          fours: battingRows.reduce((sum, row) => sum + toNumber(row.fours), 0),
          sixes: battingRows.reduce((sum, row) => sum + toNumber(row.sixes), 0),
          highestScore
        }
      : null;

    const bowlingMatches = new Set(bowlingRows.map((row) => row.match_id));
    const bowlingBalls = bowlingRows.reduce((sum, row) => sum + toNumber(row.balls), 0);
    const bowlingRuns = bowlingRows.reduce((sum, row) => sum + toNumber(row.runs_conceded), 0);
    const bowlingWickets = bowlingRows.reduce((sum, row) => sum + toNumber(row.wickets), 0);
    const bowling: PlayerBowlingStats | null = bowlingRows.length
      ? {
          matches: bowlingMatches.size,
          innings: bowlingRows.length,
          balls: bowlingBalls,
          overs: ballsToOvers(bowlingBalls),
          runsConceded: bowlingRuns,
          wickets: bowlingWickets,
          economy: round(bowlingBalls > 0 ? bowlingRuns / (bowlingBalls / 6) : null),
          average: round(divide(bowlingRuns, bowlingWickets)),
          strikeRate: round(divide(bowlingBalls, bowlingWickets)),
          maidens: bowlingRows.reduce((sum, row) => sum + toNumber(row.maidens), 0)
        }
      : null;

    const formatsBySlug = new Map<string, PlayerFormatStats & { ballsFaced: number; dismissals: number; matchIds: Set<string> }>();
    for (const row of matchRows) {
      const slug = row.formats?.slug ?? "unknown";
      const existing = formatsBySlug.get(slug) ?? {
        formatName: row.formats?.name ?? "Unknown",
        formatSlug: slug,
        matches: 0,
        runs: 0,
        wickets: 0,
        battingAverage: null,
        strikeRate: null,
        ballsFaced: 0,
        dismissals: 0,
        matchIds: new Set<string>()
      };
      existing.matchIds.add(row.match_id);
      existing.runs += toNumber(row.runs);
      existing.wickets += toNumber(row.wickets);
      existing.ballsFaced += toNumber(row.balls_faced);
      formatsBySlug.set(slug, existing);
    }
    for (const row of battingRows) {
      if (!row.dismissed) continue;
      const slug = row.matches?.formats?.slug ?? "unknown";
      const format = formatsBySlug.get(slug);
      if (format) format.dismissals += 1;
    }
    const formats = [...formatsBySlug.values()].map((format) => ({
      formatName: format.formatName,
      formatSlug: format.formatSlug,
      matches: format.matchIds.size,
      runs: format.runs,
      wickets: format.wickets,
      battingAverage: round(divide(format.runs, format.dismissals)),
      strikeRate: round(format.ballsFaced > 0 ? (format.runs / format.ballsFaced) * 100 : null)
    }));

    const recentMatches = matchRows.slice(0, 10).map((row) => {
      const match = row.matches;
      const opponent = match?.team_1_id === row.team_id ? match?.team_2 : match?.team_1;
      return {
        matchId: row.match_id,
        date: match?.match_date ?? null,
        formatName: match?.formats?.name ?? row.formats?.name ?? null,
        opponentName: opponent?.name ?? null,
        opponentSlug: opponent?.slug ?? null,
        runs: toNumber(row.runs),
        wickets: toNumber(row.wickets),
        result: match?.result ?? match?.status ?? null
      };
    });

    const chronological = [...matchRows].reverse();
    const runsByMatch = chronological
      .filter((row) => toNumber(row.runs) > 0)
      .slice(-12)
      .map((row, index) => ({ matchId: row.match_id, label: formatMatchLabel(row.matches, index), date: row.matches?.match_date ?? null, runs: row.runs, wickets: row.wickets }));
    const wicketsByMatch = chronological
      .filter((row) => toNumber(row.wickets) > 0)
      .slice(-12)
      .map((row, index) => ({ matchId: row.match_id, label: formatMatchLabel(row.matches, index), date: row.matches?.match_date ?? null, runs: row.runs, wickets: row.wickets }));

    return {
      player,
      summary,
      overview: {
        matches: summary.matches,
        runs: summary.runs,
        wickets: summary.wickets,
        battingAverage: summary.battingAverage,
        strikeRate: summary.strikeRate,
        highestScore: batting?.highestScore ?? null,
        fifties: batting?.fifties ?? 0,
        hundreds: batting?.hundreds ?? 0
      },
      batting,
      bowling,
      formats,
      recentMatches,
      charts: { runsByMatch, wicketsByMatch }
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getPlayerStatistics(slug: string) {
  const profile = await getPlayerProfile(slug);
  if (!profile) return null;
  return { player: profile.player, aggregates: profile.formats };
}

export async function getTopRunScorers(options: { formatSlug?: string; limit?: number } = {}) {
  const result = await getPlayers({ formatSlug: options.formatSlug, sort: "runs", pageSize: options.limit ?? 25 });
  return result.players;
}

export async function getTopWicketTakers(options: { formatSlug?: string; limit?: number } = {}) {
  const result = await getPlayers({ formatSlug: options.formatSlug, sort: "wickets", pageSize: options.limit ?? 25 });
  return result.players;
}
