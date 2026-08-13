import type { NormalizedCricsheetMatch } from "@/scripts/import/cricsheetTypes";

export type CricsheetValidationError = {
  sourceFile: string;
  code: string;
  message: string;
  path?: string;
};

function addError(
  errors: CricsheetValidationError[],
  sourceFile: string,
  code: string,
  message: string,
  path?: string
) {
  errors.push({ sourceFile, code, message, path });
}

export function validateCricsheetMatch(match: NormalizedCricsheetMatch) {
  const errors: CricsheetValidationError[] = [];

  if (!match.cricsheetId) {
    addError(errors, match.sourceFile, "missing-cricsheet-id", "Cricsheet ID could not be inferred from the file name.");
  }

  if (!match.startDate || Number.isNaN(Date.parse(match.startDate))) {
    addError(errors, match.sourceFile, "invalid-start-date", "Match start date is missing or invalid.", "info.dates");
  }

  if (match.teams.length < 2) {
    addError(errors, match.sourceFile, "missing-teams", "Cricsheet match must include at least two teams.", "info.teams");
  }

  if (!match.format) {
    addError(errors, match.sourceFile, "missing-format", "Match type could not be mapped to a format.", "info.match_type");
  }

  if (!match.venueName) {
    addError(errors, match.sourceFile, "missing-venue", "Venue is missing.", "info.venue");
  }

  if (match.innings.length === 0) {
    addError(errors, match.sourceFile, "missing-innings", "Match has no innings.", "innings");
  }

  match.innings.forEach((innings) => {
    if (!innings.battingTeam) {
      addError(errors, match.sourceFile, "missing-innings-team", "Innings batting team is missing.", `innings.${innings.inningsNumber}.team`);
    }

    if (innings.totalRuns < 0 || innings.totalWickets < 0 || innings.legalBalls < 0) {
      addError(errors, match.sourceFile, "negative-innings-total", "Innings totals cannot be negative.", `innings.${innings.inningsNumber}`);
    }

    innings.deliveries.forEach((delivery) => {
      const path = `innings.${innings.inningsNumber}.overs.${delivery.overNumber}.deliveries.${delivery.deliveryIndex}`;
      if (!delivery.batter || !delivery.bowler || !delivery.nonStriker) {
        addError(errors, match.sourceFile, "missing-delivery-player", "Delivery is missing batter, bowler, or non-striker.", path);
      }

      if (delivery.runsBatter < 0 || delivery.runsExtras < 0 || delivery.runsTotal < 0) {
        addError(errors, match.sourceFile, "negative-delivery-runs", "Delivery runs cannot be negative.", path);
      }
    });
  });

  return errors;
}
