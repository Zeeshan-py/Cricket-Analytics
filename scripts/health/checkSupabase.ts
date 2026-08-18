import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAwardsByYear } from "@/lib/data/awards";
import { getMatchesByFormat, getMatchesByYear } from "@/lib/data/matches";
import { getPlayers, getTopRunScorers, getTopWicketTakers } from "@/lib/data/players";
import { getTeams } from "@/lib/data/teams";
import { getSeriesSummaries } from "@/lib/data/tournaments";
import { createServerSupabaseClient, getSupabasePublicConfig } from "@/lib/supabase/client";
import { createImportSupabaseClient } from "@/scripts/import/supabaseAdmin";
import type { CricketFormatCode, Database } from "@/types/database";

type TableName = keyof Database["public"]["Tables"];
type CheckStatus = "ok" | "failed" | "skipped";

type CheckResult = {
  name: string;
  status: CheckStatus;
  details?: unknown;
  error?: string;
};

const expectedProjectRef = "lciqgzfnwrnmwxadiyom";
const requiredFormatCodes: CricketFormatCode[] = ["test", "odi", "t20", "t20i", "first-class", "list-a", "other"];
const protectedImportTables: TableName[] = ["import_batches", "import_errors"];
const publicReadableTables: TableName[] = [
  "formats",
  "teams",
  "players",
  "player_team_memberships",
  "venues",
  "tournaments",
  "matches",
  "match_innings",
  "match_officials",
  "match_deliveries",
  "batting_statistics",
  "bowling_statistics",
  "fielding_statistics",
  "player_match_statistics",
  "awards",
  "imported_player_career_aggregates",
  "imported_series_summaries"
];

function loadEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return false;

  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }

  return true;
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter(Boolean)
      .map((part) => String(part));

    if (parts.length > 0) return parts.join(" | ");
  }

  return String(error);
}

async function runCheck(name: string, check: () => Promise<unknown>): Promise<CheckResult> {
  try {
    return {
      name,
      status: "ok",
      details: await check()
    };
  } catch (error) {
    return {
      name,
      status: "failed",
      error: describeError(error)
    };
  }
}

function skippedCheck(name: string, details: unknown): CheckResult {
  return {
    name,
    status: "skipped",
    details
  };
}

function verifyProjectConfig() {
  const { url, key } = getSupabasePublicConfig();
  const parsedUrl = new URL(url);
  const projectRef = parsedUrl.hostname.split(".")[0];

  if (projectRef !== expectedProjectRef) {
    throw new Error(`Expected Supabase project ref ${expectedProjectRef}, received ${projectRef}.`);
  }

  if (key.startsWith("sb_secret_") || key.startsWith("service_role")) {
    throw new Error("The public Supabase client is configured with a secret/service-role key.");
  }

  return {
    url: parsedUrl.origin,
    projectRef,
    publishableKeyPresent: Boolean(key),
    serviceRoleLoaded: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}

async function verifyPublicTables() {
  const supabase = createServerSupabaseClient();
  const results = [];

  for (const table of publicReadableTables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    results.push({
      table,
      status: error ? "failed" : "ok",
      error: error?.message
    });
  }

  const failed = results.filter((result) => result.status === "failed");
  if (failed.length > 0) {
    const sampleErrors = failed
      .slice(0, 3)
      .map((result) => `${result.table}: ${result.error}`)
      .join("; ");
    throw new Error(`Missing or unreadable tables: ${failed.map((result) => result.table).join(", ")}. ${sampleErrors}`);
  }

  return results;
}

async function verifyProtectedTablesWithAdmin(): Promise<CheckResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return skippedCheck("protected-import-tables-admin", {
      reason: "SUPABASE_SERVICE_ROLE_KEY is not configured locally, so protected import/admin tables were not queried with admin privileges.",
      protectedTables: protectedImportTables,
      verificationSql: "scripts/health/verifySupabaseSchema.sql"
    });
  }

  return runCheck("protected-import-tables-admin", async () => {
    const supabase = createImportSupabaseClient();
    const results = [];

    for (const table of protectedImportTables) {
      const { error } = await supabase.from(table).select("*").limit(0);
      results.push({
        table,
        status: error ? "failed" : "ok",
        error: error?.message
      });
    }

    const failed = results.filter((result) => result.status === "failed");
    if (failed.length > 0) {
      throw new Error(`Protected tables missing or unreadable with admin key: ${failed.map((result) => result.table).join(", ")}`);
    }

    return results;
  });
}

async function verifyProtectedTablesAreNotPublic() {
  const supabase = createServerSupabaseClient();
  const results = [];

  for (const table of protectedImportTables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    const errorDescription = error ? describeError(error) : null;
    const missing = errorDescription?.includes("Could not find the table");
    const protectedByRls = Boolean(error && !missing);

    results.push({
      table,
      status: protectedByRls ? "protected" : "failed",
      error: errorDescription
    });
  }

  const failed = results.filter((result) => result.status === "failed");
  if (failed.length > 0) {
    throw new Error(
      `Protected import/admin tables were publicly readable or missing: ${failed
        .map((result) => `${result.table}${result.error ? ` (${result.error})` : ""}`)
        .join(", ")}`
    );
  }

  return results;
}

async function verifyReferenceFormats() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("formats").select("code,name,slug").order("code", { ascending: true });

  if (error) throw new Error(describeError(error));

  const codes = new Set((data ?? []).map((format) => format.code));
  const missing = requiredFormatCodes.filter((code) => !codes.has(code));

  if (missing.length > 0) {
    throw new Error(`Missing reference formats: ${missing.join(", ")}`);
  }

  return {
    expected: requiredFormatCodes,
    received: data?.map((format) => format.code) ?? []
  };
}

async function verifyDataAccessFunctions() {
  const [
    teams,
    players,
    testMatches,
    currentYearMatches,
    seriesSummaries,
    topRunScorers,
    topWicketTakers,
    awards
  ] = await Promise.all([
    getTeams(),
    getPlayers({ pageSize: 5 }),
    getMatchesByFormat("test", { limit: 5 }),
    getMatchesByYear(new Date().getFullYear(), { limit: 5 }),
    getSeriesSummaries({ limit: 5 }),
    getTopRunScorers({ limit: 5 }),
    getTopWicketTakers({ limit: 5 }),
    getAwardsByYear(new Date().getFullYear())
  ]);

  return {
    getTeams: teams.length,
    getPlayers: players.players.length,
    getMatchesByFormatTest: testMatches.length,
    getMatchesByYearCurrent: currentYearMatches.length,
    getSeriesSummaries: seriesSummaries.length,
    getTopRunScorers: topRunScorers.length,
    getTopWicketTakers: topWicketTakers.length,
    getAwardsByYearCurrent: awards.length
  };
}

async function main() {
  const loadedEnvFiles = [".env.local", ".env"].filter(loadEnvFile);
  const checks = [
    await runCheck("project-config", async () => verifyProjectConfig()),
    await runCheck("public-tables-readable-through-rls", verifyPublicTables),
    await runCheck("protected-import-tables-not-public", verifyProtectedTablesAreNotPublic),
    await verifyProtectedTablesWithAdmin(),
    await runCheck("reference-formats", verifyReferenceFormats),
    await runCheck("data-access-functions", verifyDataAccessFunctions)
  ];
  const failedChecks = checks.filter((check) => check.status === "failed");

  const report = {
    source: "supabase-health",
    loadedEnvFiles,
    migrationLikelyApplied: !failedChecks.some((check) => ["public-tables-readable-through-rls", "reference-formats"].includes(check.name)),
    checks
  };

  console.log(JSON.stringify(report, null, 2));

  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
