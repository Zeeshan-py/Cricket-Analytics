import { DataAccessNotConfiguredError, isMissingSupabaseConfig } from "@/lib/data/errors";
import { getMatches, type MatchSummary } from "@/lib/data/matches";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const TEAM_PAGE_SIZE = 18;

export type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  team_type: string | null;
  logo_url: string | null;
};

type MatchTeamRow = {
  id: string;
  team_1_id: string;
  team_2_id: string;
  winner_team_id: string | null;
  outcome_type: string | null;
};

type InningsTeamRow = {
  batting_team_id: string;
  total_runs: number | null;
};

type BowlingTeamRow = {
  team_id: string;
  wickets: number;
};

type PlayerTeamRow = {
  id?: string;
  player_id?: string;
  primary_team_id?: string | null;
  team_id?: string | null;
};

type TeamBattingRow = {
  player_id: string;
  runs: number;
  players: { id: string; name: string | null; slug: string | null } | null;
};

type TeamBowlingRow = {
  player_id: string;
  wickets: number;
  players: { id: string; name: string | null; slug: string | null } | null;
};

export type TeamBattingLeader = {
  playerId: string;
  playerName: string;
  playerSlug: string;
  runs: number;
};

export type TeamBowlingLeader = {
  playerId: string;
  playerName: string;
  playerSlug: string;
  wickets: number;
};

export type TeamListItem = TeamRow & {
  matches: number;
  wins: number;
  losses: number;
  drawsNoResults: number;
  players: number;
  runs: number;
  wickets: number;
};

export type TeamExplorerResult = {
  teams: TeamListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type TeamProfile = {
  team: TeamRow;
  summary: Omit<TeamListItem, keyof TeamRow> & {
    winPercentage: number | null;
  };
  players: { id: string; name: string; slug: string; country: string | null; role: string | null }[];
  recentMatches: MatchSummary[];
  topRunScorers: TeamBattingLeader[];
  topWicketTakers: TeamBowlingLeader[];
};

function pageValue(value: number | undefined, fallback = 1) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function pageSizeValue(value: number | undefined) {
  return Math.max(1, Math.min(value ?? TEAM_PAGE_SIZE, 50));
}

function pattern(search: string) {
  return `%${search.trim().replace(/[%*,]/g, " ")}%`;
}

function emptySummary(team: TeamRow): TeamListItem {
  return {
    ...team,
    matches: 0,
    wins: 0,
    losses: 0,
    drawsNoResults: 0,
    players: 0,
    runs: 0,
    wickets: 0
  };
}

function addMatchStats(summary: TeamListItem, match: MatchTeamRow) {
  summary.matches += 1;
  if (match.winner_team_id === summary.id) {
    summary.wins += 1;
    return;
  }
  if (match.winner_team_id && (match.team_1_id === summary.id || match.team_2_id === summary.id)) {
    summary.losses += 1;
    return;
  }
  summary.drawsNoResults += 1;
}

function playerKey(row: PlayerTeamRow) {
  return row.id ?? row.player_id;
}

async function summarizeTeams(teams: TeamRow[]) {
  if (!teams.length) return new Map<string, TeamListItem>();

  const supabase = createServerSupabaseClient();
  const ids = teams.map((team) => team.id);
  const byTeam = new Map(teams.map((team) => [team.id, emptySummary(team)]));

  const [team1Matches, team2Matches, innings, bowling, primaryPlayers, memberships] = await Promise.all([
    supabase.from("matches").select("id,team_1_id,team_2_id,winner_team_id,outcome_type").in("team_1_id", ids).limit(5000),
    supabase.from("matches").select("id,team_1_id,team_2_id,winner_team_id,outcome_type").in("team_2_id", ids).limit(5000),
    supabase.from("match_innings").select("batting_team_id,total_runs").in("batting_team_id", ids).limit(5000),
    supabase.from("bowling_statistics").select("team_id,wickets").in("team_id", ids).limit(5000),
    supabase.from("players").select("id,primary_team_id").in("primary_team_id", ids).limit(5000),
    supabase.from("player_team_memberships").select("player_id,team_id").in("team_id", ids).limit(5000)
  ]);

  for (const response of [team1Matches, team2Matches, innings, bowling, primaryPlayers, memberships]) {
    if (response.error) throw response.error;
  }

  const seenMatches = new Set<string>();
  [...((team1Matches.data ?? []) as MatchTeamRow[]), ...((team2Matches.data ?? []) as MatchTeamRow[])].forEach((match) => {
    if (seenMatches.has(match.id)) return;
    seenMatches.add(match.id);
    const team1 = byTeam.get(match.team_1_id);
    const team2 = byTeam.get(match.team_2_id);
    if (team1) addMatchStats(team1, match);
    if (team2) addMatchStats(team2, match);
  });

  ((innings.data ?? []) as InningsTeamRow[]).forEach((row) => {
    const summary = byTeam.get(row.batting_team_id);
    if (summary) summary.runs += row.total_runs ?? 0;
  });

  ((bowling.data ?? []) as BowlingTeamRow[]).forEach((row) => {
    const summary = byTeam.get(row.team_id);
    if (summary) summary.wickets += row.wickets;
  });

  const playerSets = new Map(ids.map((id) => [id, new Set<string>()]));
  ((primaryPlayers.data ?? []) as PlayerTeamRow[]).forEach((row) => {
    const key = playerKey(row);
    if (row.primary_team_id && key) playerSets.get(row.primary_team_id)?.add(key);
  });
  ((memberships.data ?? []) as PlayerTeamRow[]).forEach((row) => {
    const key = playerKey(row);
    if (row.team_id && key) playerSets.get(row.team_id)?.add(key);
  });
  playerSets.forEach((players, teamId) => {
    const summary = byTeam.get(teamId);
    if (summary) summary.players = players.size;
  });

  return byTeam;
}

function buildTeamBattingLeaders(rows: TeamBattingRow[]) {
  const byPlayer = new Map<string, TeamBattingLeader>();
  rows.forEach((row) => {
    if (!row.players?.name || !row.players.slug) return;
    const existing = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      playerName: row.players.name,
      playerSlug: row.players.slug,
      runs: 0
    };
    existing.runs += row.runs;
    byPlayer.set(row.player_id, existing);
  });
  return [...byPlayer.values()].sort((a, b) => b.runs - a.runs || a.playerName.localeCompare(b.playerName)).slice(0, 5);
}

function buildTeamBowlingLeaders(rows: TeamBowlingRow[]) {
  const byPlayer = new Map<string, TeamBowlingLeader>();
  rows.forEach((row) => {
    if (!row.players?.name || !row.players.slug) return;
    const existing = byPlayer.get(row.player_id) ?? {
      playerId: row.player_id,
      playerName: row.players.name,
      playerSlug: row.players.slug,
      wickets: 0
    };
    existing.wickets += row.wickets;
    byPlayer.set(row.player_id, existing);
  });
  return [...byPlayer.values()].sort((a, b) => b.wickets - a.wickets || a.playerName.localeCompare(b.playerName)).slice(0, 5);
}

export async function getTeams() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,short_name,slug,country,team_type,logo_url")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as TeamRow[];
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTeamBySlug(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,short_name,slug,country,team_type,logo_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return (data as TeamRow | null) ?? null;
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTeamExplorer(options: { search?: string; page?: number; pageSize?: number } = {}): Promise<TeamExplorerResult> {
  try {
    const supabase = createServerSupabaseClient();
    const page = pageValue(options.page);
    const pageSize = pageSizeValue(options.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("teams")
      .select("id,name,short_name,slug,country,team_type,logo_url", { count: "exact" })
      .order("name", { ascending: true });

    if (options.search?.trim()) {
      const search = pattern(options.search);
      query = query.or(`name.ilike.${search},short_name.ilike.${search},country.ilike.${search},team_type.ilike.${search}`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const teams = (data ?? []) as TeamRow[];
    const summaries = await summarizeTeams(teams);
    const total = count ?? 0;

    return {
      teams: teams.map((team) => summaries.get(team.id) ?? emptySummary(team)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}

export async function getTeamProfile(slug: string): Promise<TeamProfile | null> {
  try {
    const team = await getTeamBySlug(slug);
    if (!team) return null;

    const supabase = createServerSupabaseClient();
    const [summaryMap, recentMatches, players, membershipPlayers, batting, bowling] = await Promise.all([
      summarizeTeams([team]),
      getMatches({ teamSlug: slug, pageSize: 8 }),
      supabase.from("players").select("id,name,slug,country,role").eq("primary_team_id", team.id).order("name", { ascending: true }).limit(30),
      supabase.from("player_team_memberships").select("players(id,name,slug,country,role)").eq("team_id", team.id).limit(80),
      supabase.from("batting_statistics").select("player_id,runs,players!batting_statistics_player_id_fkey(id,name,slug)").eq("team_id", team.id).limit(5000),
      supabase.from("bowling_statistics").select("player_id,wickets,players!bowling_statistics_player_id_fkey(id,name,slug)").eq("team_id", team.id).limit(5000)
    ]);

    if (players.error) throw players.error;
    if (membershipPlayers.error) throw membershipPlayers.error;
    if (batting.error) throw batting.error;
    if (bowling.error) throw bowling.error;

    const roster = new Map<string, { id: string; name: string; slug: string; country: string | null; role: string | null }>();
    (players.data ?? []).forEach((player) => {
      if (player.id && player.name && player.slug) roster.set(player.id, player);
    });
    ((membershipPlayers.data ?? []) as { players: { id: string; name: string; slug: string; country: string | null; role: string | null } | null }[]).forEach((row) => {
      if (row.players?.id && row.players.name && row.players.slug) roster.set(row.players.id, row.players);
    });

    const summary = summaryMap.get(team.id) ?? emptySummary(team);
    const decided = summary.wins + summary.losses;

    return {
      team,
      summary: {
        matches: summary.matches,
        wins: summary.wins,
        losses: summary.losses,
        drawsNoResults: summary.drawsNoResults,
        players: summary.players,
        runs: summary.runs,
        wickets: summary.wickets,
        winPercentage: decided > 0 ? Number(((summary.wins / decided) * 100).toFixed(2)) : null
      },
      players: [...roster.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 30),
      recentMatches: recentMatches.matches,
      topRunScorers: buildTeamBattingLeaders((batting.data ?? []) as TeamBattingRow[]),
      topWicketTakers: buildTeamBowlingLeaders((bowling.data ?? []) as TeamBowlingRow[])
    };
  } catch (error) {
    if (isMissingSupabaseConfig(error)) throw new DataAccessNotConfiguredError();
    throw error;
  }
}
