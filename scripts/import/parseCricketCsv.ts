import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { slugify } from "@/scripts/import/slug";
import { resolveTeamAlias } from "@/scripts/import/teamAliases";
import type { CricketFormatCode } from "@/types/database";

export type CsvRecord = Record<string, string>;

export type ParsedPlayerName = {
  displayName: string;
  slug: string;
  teamCodes: string[];
};

export type NormalizedPlayerAggregate = {
  player: ParsedPlayerName;
  format: CricketFormatCode;
  statisticType: "batting" | "bowling";
  sourceFile: string;
  sourceRowNumber: number;
  spanStartYear: number | null;
  spanEndYear: number | null;
  rawRecord: CsvRecord;
  batting?: {
    matches: number | null;
    innings: number | null;
    notOuts: number | null;
    runs: number | null;
    highestScore: string | null;
    highestScoreRuns: number | null;
    highestScoreNotOut: boolean | null;
    ballsFaced: number | null;
    average: number | null;
    strikeRate: number | null;
    hundreds: number | null;
    fifties: number | null;
    ducks: number | null;
    fours: number | null;
    sixes: number | null;
  };
  bowling?: {
    matches: number | null;
    innings: number | null;
    balls: number | null;
    oversText: string | null;
    maidens: number | null;
    runsConceded: number | null;
    wickets: number | null;
    bestBowlingInnings: string | null;
    bestBowlingMatch: string | null;
    average: number | null;
    economy: number | null;
    strikeRate: number | null;
    fourWicketHauls: number | null;
    fiveWicketHauls: number | null;
    tenWicketHauls: number | null;
  };
};

export type NormalizedSeriesSummary = {
  format: CricketFormatCode;
  sourceFile: string;
  sourceRowNumber: number;
  seriesName: string;
  slug: string;
  seasonLabel: string;
  seasonStartYear: number | null;
  seasonEndYear: number | null;
  winnerName: string | null;
  winnerTeamSlug: string | null;
  resultStatus: "won" | "drawn" | "tied" | "shared" | "abandoned" | "no-result" | "unknown";
  margin: string | null;
  matchCount: number | null;
  rawRecord: CsvRecord;
};

function splitCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value);
  return values.map((entry) => entry.trim());
}

export async function readCsvRecords(filePath: string) {
  const text = await readFile(filePath, "utf8");
  const [headerLine, ...lines] = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const rawHeaders = splitCsvLine(headerLine);
  const headers = rawHeaders.map((header, index) => header || `source_index_${index}`);

  return lines.map((line, lineIndex) => {
    const values = splitCsvLine(line);
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, { source_row_number: String(lineIndex + 1) });
  });
}

export function parsePlayerName(value: string): ParsedPlayerName {
  const match = value.match(/^(.*?)\s*\((.*?)\)\s*$/);
  const displayName = (match?.[1] ?? value).trim();
  const teamCodes = (match?.[2] ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== "-");

  return {
    displayName,
    slug: slugify(displayName),
    teamCodes
  };
}

export function parseSpan(value: string) {
  const years = value
    .split("-")
    .map((part) => Number.parseInt(part.replace(/\D/g, ""), 10))
    .filter(Number.isFinite);

  return {
    spanStartYear: years[0] ?? null,
    spanEndYear: years[1] ?? years[0] ?? null
  };
}

export function toNumber(value: string | undefined) {
  if (!value || value === "-") return null;
  const parsed = Number(value.replace(/[*+,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function toInteger(value: string | undefined) {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

export function parseHighestScore(value: string | undefined) {
  if (!value) {
    return {
      highestScore: null,
      highestScoreRuns: null,
      highestScoreNotOut: null
    };
  }

  return {
    highestScore: value,
    highestScoreRuns: toInteger(value),
    highestScoreNotOut: value.includes("*")
  };
}

export function oversToBalls(value: string | undefined) {
  if (!value) return null;
  const [wholeOvers, balls = "0"] = value.split(".");
  const overs = Number.parseInt(wholeOvers, 10);
  const extraBalls = Number.parseInt(balls, 10);

  if (!Number.isFinite(overs) || !Number.isFinite(extraBalls) || extraBalls > 5) {
    return null;
  }

  return overs * 6 + extraBalls;
}

export function parseSeason(value: string) {
  const parts = value.split(/[-/]/).map((part) => part.trim()).filter(Boolean);
  const firstFullYear = Number.parseInt(parts[0]?.replace(/\D/g, "") ?? "", 10);
  const years = parts
    .map((part, index) => {
      const numeric = Number.parseInt(part.replace(/\D/g, ""), 10);
      if (!Number.isFinite(numeric)) return null;
      if (index > 0 && numeric < 100 && Number.isFinite(firstFullYear)) {
        const century = Math.floor(firstFullYear / 100) * 100;
        const candidate = century + numeric;
        return candidate < firstFullYear ? candidate + 100 : candidate;
      }
      return numeric;
    })
    .filter((year): year is number => year !== null);

  return {
    seasonStartYear: years[0] ?? null,
    seasonEndYear: years[1] ?? years[0] ?? null
  };
}

export function parseMatchCount(margin: string | undefined) {
  if (!margin) return null;
  const match = margin.match(/\((\d+)\)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function parseWinner(value: string | undefined) {
  const winner = value?.trim();
  if (!winner) {
    return {
      winnerName: null,
      winnerTeamSlug: null,
      resultStatus: "unknown" as const
    };
  }

  const lower = winner.toLowerCase();
  if (winner === "-") {
    return { winnerName: null, winnerTeamSlug: null, resultStatus: "unknown" as const };
  }
  if (lower === "drawn") {
    return { winnerName: winner, winnerTeamSlug: null, resultStatus: "drawn" as const };
  }
  if (lower === "tied") {
    return { winnerName: winner, winnerTeamSlug: null, resultStatus: "tied" as const };
  }
  if (lower.includes("abandoned")) {
    return { winnerName: winner, winnerTeamSlug: null, resultStatus: "abandoned" as const };
  }
  if (lower.includes("no result")) {
    return { winnerName: winner, winnerTeamSlug: null, resultStatus: "no-result" as const };
  }

  return {
    winnerName: winner,
    winnerTeamSlug: resolveTeamAlias(winner).slug,
    resultStatus: "won" as const
  };
}

export function normalizePlayerAggregate(
  filePath: string,
  format: CricketFormatCode,
  statisticType: "batting" | "bowling",
  row: CsvRecord
): NormalizedPlayerAggregate {
  const sourceFile = basename(filePath);
  const { spanStartYear, spanEndYear } = parseSpan(row.Span);
  const player = parsePlayerName(row.Player);
  const sourceRowNumber = Number.parseInt(row.source_row_number, 10);

  const base = {
    player,
    format,
    statisticType,
    sourceFile,
    sourceRowNumber,
    spanStartYear,
    spanEndYear,
    rawRecord: row
  };

  if (statisticType === "batting") {
    const highestScore = parseHighestScore(row.HS);
    return {
      ...base,
      batting: {
        matches: toInteger(row.Mat),
        innings: toInteger(row.Inns),
        notOuts: toInteger(row.NO),
        runs: toInteger(row.Runs),
        ...highestScore,
        ballsFaced: toInteger(row.BF),
        average: toNumber(row.Ave),
        strikeRate: toNumber(row.SR),
        hundreds: toInteger(row["100"]),
        fifties: toInteger(row["50"]),
        ducks: toInteger(row["0"]),
        fours: toInteger(row["4s"]),
        sixes: toInteger(row["6s"])
      }
    };
  }

  return {
    ...base,
    bowling: {
      matches: toInteger(row.Mat),
      innings: toInteger(row.Inns),
      balls: toInteger(row.Balls) ?? oversToBalls(row.Overs),
      oversText: row.Overs || null,
      maidens: toInteger(row.Mdns),
      runsConceded: toInteger(row.Runs),
      wickets: toInteger(row.Wkts),
      bestBowlingInnings: row.BBI || null,
      bestBowlingMatch: row.BBM || null,
      average: toNumber(row.Ave),
      economy: toNumber(row.Econ),
      strikeRate: toNumber(row.SR),
      fourWicketHauls: toInteger(row["4"]),
      fiveWicketHauls: toInteger(row["5"]),
      tenWicketHauls: toInteger(row["10"])
    }
  };
}

export function normalizeSeriesSummary(
  filePath: string,
  format: CricketFormatCode,
  row: CsvRecord
): NormalizedSeriesSummary {
  const sourceFile = basename(filePath);
  const seriesName = row["Series/Tournament"]?.trim();
  const seasonLabel = row.Season?.trim();
  const sourceRowNumber = Number.parseInt(row.source_row_number, 10);
  const { seasonStartYear, seasonEndYear } = parseSeason(seasonLabel);
  const winner = parseWinner(row.Winner);

  return {
    format,
    sourceFile,
    sourceRowNumber,
    seriesName,
    slug: slugify(`${seriesName}-${seasonLabel}`),
    seasonLabel,
    seasonStartYear,
    seasonEndYear,
    winnerName: winner.winnerName,
    winnerTeamSlug: winner.winnerTeamSlug,
    resultStatus: winner.resultStatus,
    margin: row.Margin || null,
    matchCount: parseMatchCount(row.Margin),
    rawRecord: row
  };
}
