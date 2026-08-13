import type { DatasetFileDefinition } from "@/scripts/import/datasetManifest";
import type { NormalizedPlayerAggregate, NormalizedSeriesSummary } from "@/scripts/import/parseCricketCsv";

export type ImportValidationError = {
  sourceFile: string;
  sourceRowNumber: number;
  entityType: "player-aggregate" | "series-summary";
  code: string;
  message: string;
};

function addError(
  errors: ImportValidationError[],
  sourceFile: string,
  sourceRowNumber: number,
  entityType: ImportValidationError["entityType"],
  code: string,
  message: string
) {
  errors.push({ sourceFile, sourceRowNumber, entityType, code, message });
}

function hasNegative(value: number | null | undefined) {
  return typeof value === "number" && value < 0;
}

export function validatePlayerAggregate(record: NormalizedPlayerAggregate) {
  const errors: ImportValidationError[] = [];

  if (!record.player.displayName) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "player-aggregate", "missing-player-name", "Player name is missing.");
  }

  if (!record.player.slug) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "player-aggregate", "invalid-player-slug", "Player slug could not be generated.");
  }

  if (!record.spanStartYear || !record.spanEndYear || record.spanEndYear < record.spanStartYear) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "player-aggregate", "invalid-span", "Career span is missing or invalid.");
  }

  const numericValues =
    record.statisticType === "batting"
      ? [
          record.batting?.matches,
          record.batting?.innings,
          record.batting?.notOuts,
          record.batting?.runs,
          record.batting?.ballsFaced,
          record.batting?.hundreds,
          record.batting?.fifties,
          record.batting?.ducks,
          record.batting?.fours,
          record.batting?.sixes
        ]
      : [
          record.bowling?.matches,
          record.bowling?.innings,
          record.bowling?.balls,
          record.bowling?.maidens,
          record.bowling?.runsConceded,
          record.bowling?.wickets,
          record.bowling?.fourWicketHauls,
          record.bowling?.fiveWicketHauls,
          record.bowling?.tenWicketHauls
        ];

  if (numericValues.some(hasNegative)) {
    addError(
      errors,
      record.sourceFile,
      record.sourceRowNumber,
      "player-aggregate",
      "negative-statistic",
      "A numeric cricket statistic is negative."
    );
  }

  if (record.batting?.notOuts !== null && record.batting?.innings !== null && record.batting && record.batting.notOuts > record.batting.innings) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "player-aggregate", "not-outs-exceed-innings", "Not-outs exceed innings.");
  }

  return errors;
}

export function validateSeriesSummary(record: NormalizedSeriesSummary) {
  const errors: ImportValidationError[] = [];

  if (!record.seriesName) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "series-summary", "missing-series-name", "Series/tournament name is missing.");
  }

  if (!record.seasonLabel || !record.seasonStartYear) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "series-summary", "invalid-season", "Season is missing or cannot be parsed.");
  }

  if (record.seasonStartYear && record.seasonEndYear && record.seasonEndYear < record.seasonStartYear) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "series-summary", "season-order", "Season end year is earlier than start year.");
  }

  if (hasNegative(record.matchCount)) {
    addError(errors, record.sourceFile, record.sourceRowNumber, "series-summary", "negative-match-count", "Parsed match count is negative.");
  }

  return errors;
}

export function expectedHeadersForDataset(definition: DatasetFileDefinition) {
  if (definition.kind === "series-summary") {
    return ["Series/Tournament", "Season", "Winner", "Margin"];
  }

  if (definition.kind === "player-batting-aggregate") {
    return ["Player", "Span", "Mat", "Inns", "Runs", "HS", "Ave"];
  }

  return ["Player", "Span", "Mat", "Inns", "Runs", "Wkts", "BBI", "Ave", "Econ", "SR"];
}
