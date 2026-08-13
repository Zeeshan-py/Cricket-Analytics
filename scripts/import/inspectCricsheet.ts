import { existsSync } from "node:fs";
import { getCricsheetDataDir, listCricsheetJsonFiles } from "@/scripts/import/cricsheetFiles";
import { readCricsheetMatch } from "@/scripts/import/parseCricsheetJson";
import { validateCricsheetMatch } from "@/scripts/import/validateCricsheetData";

export async function inspectCricsheetDirectory(directory = getCricsheetDataDir()) {
  if (!existsSync(directory)) {
    return {
      source: "cricsheet-json",
      directory,
      status: "skipped",
      reason: "Directory does not exist.",
      files: 0
    };
  }

  const files = await listCricsheetJsonFiles(directory);
  const matchTypes: Record<string, number> = {};
  const infoKeys = new Set<string>();
  const inningsKeys = new Set<string>();
  const deliveryKeys = new Set<string>();
  const extraKeys = new Set<string>();
  const wicketKinds: Record<string, number> = {};
  let inningsCount = 0;
  let deliveryCount = 0;
  let wicketCount = 0;
  let playerCount = 0;
  let officialCount = 0;
  const validationErrors = [];

  for (const file of files) {
    const match = await readCricsheetMatch(file);
    const errors = validateCricsheetMatch(match);
    validationErrors.push(...errors);
    matchTypes[match.format] = (matchTypes[match.format] ?? 0) + 1;
    Object.keys(match.rawInfo).forEach((key) => infoKeys.add(key));
    playerCount += match.players.length;
    officialCount += match.officials.length;

    match.innings.forEach((innings) => {
      inningsCount += 1;
      Object.keys(innings.rawInnings).forEach((key) => inningsKeys.add(key));
      deliveryCount += innings.deliveries.length;

      innings.deliveries.forEach((delivery) => {
        Object.keys(delivery.rawDelivery).forEach((key) => deliveryKeys.add(key));
        Object.keys(delivery.extras ?? {}).forEach((key) => extraKeys.add(key));
        delivery.wickets?.forEach((wicket) => {
          wicketCount += 1;
          wicketKinds[wicket.kind] = (wicketKinds[wicket.kind] ?? 0) + 1;
        });
      });
    });
  }

  return {
    source: "cricsheet-json",
    directory,
    status: validationErrors.length > 0 ? "issues-found" : "ok",
    files: files.length,
    matchTypes,
    infoKeys: [...infoKeys].sort(),
    inningsKeys: [...inningsKeys].sort(),
    deliveryKeys: [...deliveryKeys].sort(),
    extraKeys: [...extraKeys].sort(),
    wicketKinds,
    inningsCount,
    deliveryCount,
    wicketCount,
    playerAppearances: playerCount,
    officials: officialCount,
    validationErrorCount: validationErrors.length,
    validationErrorSamples: validationErrors.slice(0, 10)
  };
}

async function main() {
  console.log(JSON.stringify(await inspectCricsheetDirectory(), null, 2));
}

if (process.argv[1]?.endsWith("inspectCricsheet.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
