import { existsSync } from "node:fs";
import { datasetManifest } from "@/scripts/import/datasetManifest";
import { inspectCricsheetDirectory } from "@/scripts/import/inspectCricsheet";
import {
  normalizePlayerAggregate,
  normalizeSeriesSummary,
  readCsvRecords
} from "@/scripts/import/parseCricketCsv";
import {
  expectedHeadersForDataset,
  validatePlayerAggregate,
  validateSeriesSummary
} from "@/scripts/import/validateCricketData";

async function main() {
  const supplementaryCsvReport = [];

  for (const definition of datasetManifest) {
    if (!existsSync(definition.file)) {
      supplementaryCsvReport.push({
        source: "supplementary-csv",
        file: definition.file,
        kind: definition.kind,
        format: definition.format,
        status: "skipped",
        reason: "Supplementary CSV file is not present in this checkout."
      });
      continue;
    }

    const rows = await readCsvRecords(definition.file);
    const headers = rows[0] ? Object.keys(rows[0]).filter((key) => key !== "source_row_number") : [];
    const expectedHeaders = expectedHeadersForDataset(definition);
    const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
    const validationErrors = rows.flatMap((row) => {
      if (definition.kind === "series-summary") {
        return validateSeriesSummary(normalizeSeriesSummary(definition.file, definition.format, row));
      }

      return validatePlayerAggregate(
        normalizePlayerAggregate(
          definition.file,
          definition.format,
          definition.kind === "player-batting-aggregate" ? "batting" : "bowling",
          row
        )
      );
    });

    supplementaryCsvReport.push({
      source: "supplementary-csv",
      file: definition.file,
      kind: definition.kind,
      format: definition.format,
      status: validationErrors.length > 0 ? "issues-found" : "ok",
      rows: rows.length,
      headers,
      missingHeaders,
      validationErrorCount: validationErrors.length,
      validationErrorSamples: validationErrors.slice(0, 10)
    });
  }

  console.log(
    JSON.stringify(
      {
        primary: await inspectCricsheetDirectory(),
        supplementary: supplementaryCsvReport
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
