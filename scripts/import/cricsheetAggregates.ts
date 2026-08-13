import { isDismissalWicket, isLegalDelivery } from "@/scripts/import/parseCricsheetJson";
import type { NormalizedCricsheetInnings, NormalizedCricsheetMatch } from "@/scripts/import/cricsheetTypes";

export type BattingLine = {
  player: string;
  team: string;
  inningsNumber: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissed: boolean;
  dismissalKind: string | null;
  bowler: string | null;
  fielder: string | null;
};

export type BowlingLine = {
  player: string;
  team: string;
  inningsNumber: number;
  balls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  dotBalls: number;
  wides: number;
  noBalls: number;
};

export type FieldingLine = {
  player: string;
  team: string;
  inningsNumber: number;
  catches: number;
  stumpings: number;
  runOuts: number;
};

function ensureBattingLine(lines: Map<string, BattingLine>, player: string, team: string, inningsNumber: number) {
  const key = `${inningsNumber}:${player}`;
  const existing = lines.get(key);
  if (existing) return existing;

  const line = {
    player,
    team,
    inningsNumber,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    dismissed: false,
    dismissalKind: null,
    bowler: null,
    fielder: null
  };
  lines.set(key, line);
  return line;
}

function ensureBowlingLine(lines: Map<string, BowlingLine>, player: string, team: string, inningsNumber: number) {
  const key = `${inningsNumber}:${player}`;
  const existing = lines.get(key);
  if (existing) return existing;

  const line = {
    player,
    team,
    inningsNumber,
    balls: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    dotBalls: 0,
    wides: 0,
    noBalls: 0
  };
  lines.set(key, line);
  return line;
}

function ensureFieldingLine(lines: Map<string, FieldingLine>, player: string, team: string, inningsNumber: number) {
  const key = `${inningsNumber}:${player}`;
  const existing = lines.get(key);
  if (existing) return existing;

  const line = {
    player,
    team,
    inningsNumber,
    catches: 0,
    stumpings: 0,
    runOuts: 0
  };
  lines.set(key, line);
  return line;
}

function bowlingCreditWicket(kind: string) {
  return !["run out", "retired hurt", "retired not out", "obstructing the field"].includes(kind.toLowerCase());
}

export function aggregateInningsPlayerStats(match: NormalizedCricsheetMatch, innings: NormalizedCricsheetInnings) {
  const battingLines = new Map<string, BattingLine>();
  const bowlingLines = new Map<string, BowlingLine>();
  const fieldingLines = new Map<string, FieldingLine>();
  const bowlingTeam = innings.bowlingTeam;

  for (const delivery of innings.deliveries) {
    const batting = ensureBattingLine(battingLines, delivery.batter, innings.battingTeam, innings.inningsNumber);
    const bowling = ensureBowlingLine(bowlingLines, delivery.bowler, bowlingTeam, innings.inningsNumber);
    batting.runs += delivery.runsBatter;

    if (isLegalDelivery(delivery.rawDelivery)) {
      batting.ballsFaced += 1;
      bowling.balls += 1;
    }

    if (delivery.runsBatter === 4 && !delivery.nonBoundary) batting.fours += 1;
    if (delivery.runsBatter === 6 && !delivery.nonBoundary) batting.sixes += 1;

    const byes = delivery.extras?.byes ?? 0;
    const legbyes = delivery.extras?.legbyes ?? 0;
    bowling.runsConceded += delivery.runsTotal - byes - legbyes;
    bowling.wides += delivery.extras?.wides ?? 0;
    bowling.noBalls += delivery.extras?.noballs ?? 0;

    if (delivery.runsTotal === 0) {
      bowling.dotBalls += 1;
    }

    delivery.wickets?.forEach((wicket) => {
      if (isDismissalWicket(wicket.kind)) {
        const dismissed = ensureBattingLine(battingLines, wicket.player_out, innings.battingTeam, innings.inningsNumber);
        dismissed.dismissed = true;
        dismissed.dismissalKind = wicket.kind;
        dismissed.bowler = bowlingCreditWicket(wicket.kind) ? delivery.bowler : null;
        dismissed.fielder = wicket.fielders?.[0]?.name ?? null;
      }

      if (bowlingCreditWicket(wicket.kind)) {
        bowling.wickets += 1;
      }

      wicket.fielders?.forEach((fielder) => {
        const fielding = ensureFieldingLine(fieldingLines, fielder.name, bowlingTeam, innings.inningsNumber);
        if (wicket.kind === "caught" || wicket.kind === "caught and bowled") fielding.catches += 1;
        if (wicket.kind === "stumped") fielding.stumpings += 1;
        if (wicket.kind === "run out") fielding.runOuts += 1;
      });
    });
  }

  const maidensByBowler = new Map<string, number>();
  for (const over of innings.rawInnings.overs) {
    const bowler = over.deliveries[0]?.bowler;
    if (!bowler) continue;
    const conceded = over.deliveries.reduce((total, delivery) => {
      const byes = delivery.extras?.byes ?? 0;
      const legbyes = delivery.extras?.legbyes ?? 0;
      return total + delivery.runs.total - byes - legbyes;
    }, 0);
    if (conceded === 0) {
      maidensByBowler.set(bowler, (maidensByBowler.get(bowler) ?? 0) + 1);
    }
  }

  maidensByBowler.forEach((maidens, bowler) => {
    const line = ensureBowlingLine(bowlingLines, bowler, bowlingTeam, innings.inningsNumber);
    line.maidens = maidens;
  });

  return {
    batting: [...battingLines.values()],
    bowling: [...bowlingLines.values()],
    fielding: [...fieldingLines.values()]
  };
}

export function aggregateMatchPlayerStats(match: NormalizedCricsheetMatch) {
  const lines = new Map<
    string,
    {
      player: string;
      team: string;
      runs: number;
      ballsFaced: number;
      wickets: number;
      ballsBowled: number;
      runsConceded: number;
      catches: number;
      stumpings: number;
      playerOfMatch: boolean;
    }
  >();

  const ensure = (player: string, team: string) => {
    const existing = lines.get(player);
    if (existing) return existing;
    const line = {
      player,
      team,
      runs: 0,
      ballsFaced: 0,
      wickets: 0,
      ballsBowled: 0,
      runsConceded: 0,
      catches: 0,
      stumpings: 0,
      playerOfMatch: match.playerOfMatch.includes(player)
    };
    lines.set(player, line);
    return line;
  };

  for (const innings of match.innings) {
    const aggregate = aggregateInningsPlayerStats(match, innings);
    aggregate.batting.forEach((line) => {
      const summary = ensure(line.player, line.team);
      summary.runs += line.runs;
      summary.ballsFaced += line.ballsFaced;
    });
    aggregate.bowling.forEach((line) => {
      const summary = ensure(line.player, line.team);
      summary.wickets += line.wickets;
      summary.ballsBowled += line.balls;
      summary.runsConceded += line.runsConceded;
    });
    aggregate.fielding.forEach((line) => {
      const summary = ensure(line.player, line.team);
      summary.catches += line.catches;
      summary.stumpings += line.stumpings;
    });
  }

  return [...lines.values()];
}
