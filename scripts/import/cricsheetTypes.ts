import type { CricketFormatCode, Json } from "@/types/database";

export type CricsheetMatchType = "Test" | "ODI" | "T20" | "T20I" | string;

export type CricsheetDelivery = {
  actual_delivery?: string;
  batter: string;
  bowler: string;
  non_striker: string;
  runs: {
    batter: number;
    extras: number;
    total: number;
    non_boundary?: boolean;
  };
  extras?: Record<string, number>;
  wickets?: Array<{
    player_out: string;
    kind: string;
    fielders?: Array<{
      name: string;
    }>;
  }>;
  replacements?: Json;
  review?: Json;
};

export type CricsheetOver = {
  over: number;
  deliveries: CricsheetDelivery[];
};

export type CricsheetInnings = {
  team: string;
  overs: CricsheetOver[];
  declared?: boolean;
  target?: {
    overs?: number;
    runs?: number;
  };
  powerplays?: Array<{
    from: number;
    to: number;
    type: string;
  }>;
};

export type CricsheetMatch = {
  meta?: {
    data_version?: string;
    created?: string;
    revision?: number;
  };
  info: {
    balls_per_over?: number;
    city?: string;
    dates: string[];
    event?: {
      name?: string;
      match_number?: number | string;
    };
    gender?: string;
    match_type: CricsheetMatchType;
    match_type_number?: number;
    officials?: Record<string, string[]>;
    outcome?: {
      winner?: string;
      result?: string;
      by?: {
        runs?: number;
        wickets?: number;
        innings?: number;
      };
    };
    overs?: number;
    player_of_match?: string[];
    players: Record<string, string[]>;
    registry?: {
      people?: Record<string, string>;
    };
    season?: string;
    team_type?: string;
    teams: string[];
    toss?: {
      winner?: string;
      decision?: "bat" | "field" | string;
    };
    venue?: string;
  };
  innings?: CricsheetInnings[];
};

export type NormalizedCricsheetPlayer = {
  name: string;
  slug: string;
  cricsheetId: string | null;
  teamName: string | null;
};

export type NormalizedCricsheetTeam = {
  name: string;
  slug: string;
  shortName?: string;
  country?: string | null;
  teamType?: string;
};

export type NormalizedCricsheetDelivery = {
  inningsNumber: number;
  overNumber: number;
  deliveryIndex: number;
  actualDelivery: string | null;
  battingTeam: string;
  bowlingTeam: string;
  batter: string;
  bowler: string;
  nonStriker: string;
  runsBatter: number;
  runsExtras: number;
  runsTotal: number;
  extras: Record<string, number> | null;
  wickets: CricsheetDelivery["wickets"] | null;
  replacements: Json | null;
  review: Json | null;
  nonBoundary: boolean;
  rawDelivery: CricsheetDelivery;
};

export type NormalizedCricsheetInnings = {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  oversText: string;
  declared: boolean;
  targetRuns: number | null;
  targetOvers: number | null;
  powerplays: CricsheetInnings["powerplays"] | null;
  deliveries: NormalizedCricsheetDelivery[];
  rawInnings: CricsheetInnings;
};

export type NormalizedCricsheetMatch = {
  cricsheetId: string;
  sourceFile: string;
  format: CricketFormatCode;
  startDate: string;
  endDate: string | null;
  seasonLabel: string | null;
  seasonYear: number | null;
  eventName: string | null;
  eventSlug: string | null;
  matchNumber: string | null;
  city: string | null;
  venueName: string | null;
  venueSlug: string | null;
  teams: NormalizedCricsheetTeam[];
  players: NormalizedCricsheetPlayer[];
  officials: Array<{
    role: string;
    name: string;
    cricsheetId: string | null;
  }>;
  tossWinner: string | null;
  tossDecision: string | null;
  winner: string | null;
  status: "completed" | "drawn" | "tied" | "abandoned" | "no-result";
  outcomeType: "winner" | "draw" | "tie" | "abandoned" | "no-result" | "unknown";
  outcomeMarginRuns: number | null;
  outcomeMarginWickets: number | null;
  outcomeMarginInnings: number | null;
  result: string | null;
  ballsPerOver: number;
  gender: string | null;
  teamType: string | null;
  matchTypeNumber: number | null;
  playerOfMatch: string[];
  innings: NormalizedCricsheetInnings[];
  dataVersion: string | null;
  revision: number | null;
  rawInfo: CricsheetMatch["info"];
};
