import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const defaultCricsheetSampleDir = "data/sample/cricsheet";

export function getCricsheetDataDir() {
  return process.env.CRICSHEET_DATA_DIR || defaultCricsheetSampleDir;
}

export async function listCricsheetJsonFiles(directory = getCricsheetDataDir()) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(directory, entry.name))
    .sort();
}
