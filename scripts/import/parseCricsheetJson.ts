import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import type {
  CricsheetDelivery,
  CricsheetInnings,
  CricsheetMatch,
  NormalizedCricsheetDelivery,
  NormalizedCricsheetInnings,
  NormalizedCricsheetMatch
} from "@/scripts/import/cricsheetTypes";
import { parseSeason } from "@/scripts/import/parseCricketCsv";
import { slugify } from "@/scripts/import/slug";
import { resolveTeamAlias } from "@/scripts/import/teamAliases";
import type { CricketFormatCode } from "@/types/database";

const nonDismissalKinds = new Set(["retired hurt", "retired not out"]);

export function mapCricsheetFormat(matchType: string): CricketFormatCode {
  const normalized = matchType.trim().toLowerCase();
  if (normalized === "test") return "test";
  if (normalized === "odi") return "odi";
  if (normalized === "t20i") return "t20i";
  if (normalized === "t20") return "t20";
  return "other";
}

export function isLegalDelivery(delivery: CricsheetDelivery) {
  return !delivery.extras?.wides && !delivery.extras?.noballs;
}

export function isDismissalWicket(kind: string) {
  return !nonDismissalKinds.has(kind.toLowerCase());
}

export function formatOversFromBalls(balls: number, ballsPerOver = 6) {
  const overs = Math.floor(balls / ballsPerOver);
  const remainder = balls % ballsPerOver;
  return `${overs}.${remainder}`;
}

export function inferOutcome(info: CricsheetMatch["info"]) {
  const outcome = info.outcome;
  if (!outcome) {
    return {
      winner: null,
      status: "completed" as const,
      outcomeType: "unknown" as const,
      result: null
    };
  }

  const result = outcome.result?.toLowerCase();
  if (result === "draw") {
    return { winner: null, status: "drawn" as const, outcomeType: "draw" as const, result: outcome.result ?? null };
  }
  if (result === "tie") {
    return { winner: null, status: "tied" as const, outcomeType: "tie" as const, result: outcome.result ?? null };
  }
  if (result === "no result") {
    return { winner: null, status: "no-result" as const, outcomeType: "no-result" as const, result: outcome.result ?? null };
  }
  if (result === "abandoned") {
    return { winner: null, status: "abandoned" as const, outcomeType: "abandoned" as const, result: outcome.result ?? null };
  }

  return {
    winner: outcome.winner ?? null,
    status: "completed" as const,
    outcomeType: outcome.winner ? ("winner" as const) : ("unknown" as const),
    result: outcome.winner ? `${outcome.winner} won` : (outcome.result ?? null)
  };
}

function personId(match: CricsheetMatch, name: string) {
  return match.info.registry?.people?.[name] ?? null;
}

function normalizeInnings(
  innings: CricsheetInnings,
  inningsNumber: number,
  teams: string[],
  ballsPerOver: number
): NormalizedCricsheetInnings {
  const bowlingTeam = teams.find((team) => team !== innings.team) ?? "Unknown";
  const deliveries: NormalizedCricsheetDelivery[] = [];
  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;

  innings.overs.forEach((over) => {
    over.deliveries.forEach((delivery, index) => {
      totalRuns += delivery.runs.total;
      if (isLegalDelivery(delivery)) {
        legalBalls += 1;
      }

      const wickets = delivery.wickets?.filter((wicket) => isDismissalWicket(wicket.kind)) ?? [];
      totalWickets += wickets.length;

      deliveries.push({
        inningsNumber,
        overNumber: over.over,
        deliveryIndex: index + 1,
        actualDelivery: delivery.actual_delivery ?? null,
        battingTeam: innings.team,
        bowlingTeam,
        batter: delivery.batter,
        bowler: delivery.bowler,
        nonStriker: delivery.non_striker,
        runsBatter: delivery.runs.batter,
        runsExtras: delivery.runs.extras,
        runsTotal: delivery.runs.total,
        extras: delivery.extras ?? null,
        wickets: delivery.wickets ?? null,
        replacements: delivery.replacements ?? null,
        review: delivery.review ?? null,
        nonBoundary: delivery.runs.non_boundary ?? false,
        rawDelivery: delivery
      });
    });
  });

  return {
    inningsNumber,
    battingTeam: innings.team,
    bowlingTeam,
    totalRuns,
    totalWickets,
    legalBalls,
    oversText: formatOversFromBalls(legalBalls, ballsPerOver),
    declared: innings.declared ?? false,
    targetRuns: innings.target?.runs ?? null,
    targetOvers: innings.target?.overs ?? null,
    powerplays: innings.powerplays ?? null,
    deliveries,
    rawInnings: innings
  };
}

export async function readCricsheetMatch(filePath: string): Promise<NormalizedCricsheetMatch> {
  const raw = await readFile(filePath, "utf8");
  const match = JSON.parse(raw) as CricsheetMatch;
  const fileName = basename(filePath);
  const cricsheetId = basename(filePath, extname(filePath));
  const info = match.info;
  const dates = [...info.dates].sort();
  const ballsPerOver = info.balls_per_over ?? 6;
  const season = info.season ? parseSeason(info.season) : { seasonStartYear: null, seasonEndYear: null };
  const eventName = info.event?.name ?? null;
  const eventSlug = eventName ? slugify(`${eventName}-${info.season ?? dates[0]}`) : null;
  const outcome = inferOutcome(info);
  const teams = info.teams.map((team) => {
    const alias = resolveTeamAlias(team);
    return {
      name: alias.name,
      slug: alias.slug,
      shortName: alias.shortName,
      country: alias.country ?? null,
      teamType: alias.teamType ?? "international"
    };
  });
  const playerMap = new Map<string, { name: string; slug: string; cricsheetId: string | null; teamName: string | null }>();

  for (const [teamName, players] of Object.entries(info.players ?? {})) {
    for (const playerName of players) {
      playerMap.set(playerName, {
        name: playerName,
        slug: slugify(playerName),
        cricsheetId: personId(match, playerName),
        teamName
      });
    }
  }

  const officials = Object.entries(info.officials ?? {}).flatMap(([role, names]) =>
    names.map((name) => ({
      role,
      name,
      cricsheetId: personId(match, name)
    }))
  );

  return {
    cricsheetId,
    sourceFile: fileName,
    format: mapCricsheetFormat(info.match_type),
    startDate: dates[0],
    endDate: dates.length > 1 ? dates[dates.length - 1] : null,
    seasonLabel: info.season ?? null,
    seasonYear: season.seasonStartYear,
    eventName,
    eventSlug,
    matchNumber: info.event?.match_number === undefined ? null : String(info.event.match_number),
    city: info.city ?? null,
    venueName: info.venue ?? null,
    venueSlug: info.venue ? slugify(`${info.venue}-${info.city ?? ""}`) : null,
    teams,
    players: [...playerMap.values()],
    officials,
    tossWinner: info.toss?.winner ?? null,
    tossDecision: info.toss?.decision ?? null,
    winner: outcome.winner,
    status: outcome.status,
    outcomeType: outcome.outcomeType,
    outcomeMarginRuns: info.outcome?.by?.runs ?? null,
    outcomeMarginWickets: info.outcome?.by?.wickets ?? null,
    outcomeMarginInnings: info.outcome?.by?.innings ?? null,
    result: outcome.result,
    ballsPerOver,
    gender: info.gender ?? null,
    teamType: info.team_type ?? null,
    matchTypeNumber: info.match_type_number ?? null,
    playerOfMatch: info.player_of_match ?? [],
    innings: (match.innings ?? []).map((innings, index) => normalizeInnings(innings, index + 1, info.teams, ballsPerOver)),
    dataVersion: match.meta?.data_version ?? null,
    revision: match.meta?.revision ?? null,
    rawInfo: info
  };
}
