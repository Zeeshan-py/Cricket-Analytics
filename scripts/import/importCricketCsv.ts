import { datasetManifest } from "@/scripts/import/datasetManifest";
import { normalizePlayerAggregate, normalizeSeriesSummary, readCsvRecords } from "@/scripts/import/parseCricketCsv";
import { resolveTeamAlias } from "@/scripts/import/teamAliases";
import { validatePlayerAggregate, validateSeriesSummary } from "@/scripts/import/validateCricketData";
import { createImportSupabaseClient } from "@/scripts/import/supabaseAdmin";
import type { CricketFormatCode } from "@/types/database";

type SupabaseClient = ReturnType<typeof createImportSupabaseClient>;

async function getFormatId(supabase: SupabaseClient, code: CricketFormatCode) {
  const { data, error } = await supabase.from("formats").select("id").eq("code", code).single();
  if (error) throw error;
  return data.id;
}

async function upsertTeam(supabase: SupabaseClient, teamValue: string) {
  const alias = resolveTeamAlias(teamValue);
  const { data, error } = await supabase
    .from("teams")
    .upsert(
      {
        name: alias.name,
        short_name: alias.shortName ?? null,
        slug: alias.slug,
        country: alias.country ?? null,
        team_type: alias.teamType ?? "international"
      },
      { onConflict: "slug" }
    )
    .select("id,slug")
    .single();

  if (error) throw error;
  return data;
}

async function upsertPlayer(supabase: SupabaseClient, name: string, slug: string, primaryTeamId: string | null, country: string | null) {
  const { data, error } = await supabase
    .from("players")
    .upsert(
      {
        name,
        slug,
        full_name: name,
        primary_team_id: primaryTeamId,
        country
      },
      { onConflict: "slug" }
    )
    .select("id,slug")
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  const supabase = createImportSupabaseClient();

  for (const definition of datasetManifest) {
    const rows = await readCsvRecords(definition.file);
    const formatId = await getFormatId(supabase, definition.format);
    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        source_name: definition.file,
        source_kind: "csv",
        source_path: definition.file,
        status: "running",
        records_seen: rows.length,
        started_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (batchError) throw batchError;

    let recordsInserted = 0;
    let recordsFailed = 0;

    for (const row of rows) {
      try {
        if (definition.kind === "series-summary") {
          const normalized = normalizeSeriesSummary(definition.file, definition.format, row);
          const errors = validateSeriesSummary(normalized);
          if (errors.length > 0) throw new Error(errors.map((error) => `${error.code}: ${error.message}`).join("; "));

          let winnerTeamId: string | null = null;
          if (normalized.winnerName && normalized.resultStatus === "won") {
            const team = await upsertTeam(supabase, normalized.winnerName);
            winnerTeamId = team.id;
          }

          const { error } = await supabase.from("imported_series_summaries").upsert(
            {
              format_id: formatId,
              winner_team_id: winnerTeamId,
              source_file: normalized.sourceFile,
              source_row_number: normalized.sourceRowNumber,
              series_name: normalized.seriesName,
              slug: normalized.slug,
              season_label: normalized.seasonLabel,
              season_start_year: normalized.seasonStartYear,
              season_end_year: normalized.seasonEndYear,
              winner_name: normalized.winnerName,
              result_status: normalized.resultStatus,
              margin: normalized.margin,
              match_count: normalized.matchCount,
              raw_record: normalized.rawRecord
            },
            { onConflict: "source_file,source_row_number" }
          );

          if (error) throw error;
        } else {
          const statisticType = definition.kind === "player-batting-aggregate" ? "batting" : "bowling";
          const normalized = normalizePlayerAggregate(definition.file, definition.format, statisticType, row);
          const errors = validatePlayerAggregate(normalized);
          if (errors.length > 0) throw new Error(errors.map((error) => `${error.code}: ${error.message}`).join("; "));

          let primaryTeamId: string | null = null;
          let country: string | null = null;
          for (const teamCode of normalized.player.teamCodes) {
            const team = await upsertTeam(supabase, teamCode);
            primaryTeamId ??= team.id;
            country ??= resolveTeamAlias(teamCode).country ?? null;
          }

          const player = await upsertPlayer(
            supabase,
            normalized.player.displayName,
            normalized.player.slug,
            primaryTeamId,
            country
          );

          const batting = normalized.batting;
          const bowling = normalized.bowling;
          const { error } = await supabase.from("imported_player_career_aggregates").upsert(
            {
              player_id: player.id,
              format_id: formatId,
              statistic_type: normalized.statisticType,
              source_file: normalized.sourceFile,
              source_row_number: normalized.sourceRowNumber,
              span_start_year: normalized.spanStartYear,
              span_end_year: normalized.spanEndYear,
              matches: batting?.matches ?? bowling?.matches ?? null,
              innings: batting?.innings ?? bowling?.innings ?? null,
              not_outs: batting?.notOuts ?? null,
              runs: batting?.runs ?? null,
              highest_score: batting?.highestScore ?? null,
              highest_score_runs: batting?.highestScoreRuns ?? null,
              highest_score_not_out: batting?.highestScoreNotOut ?? null,
              balls_faced: batting?.ballsFaced ?? null,
              batting_average: batting?.average ?? null,
              batting_strike_rate: batting?.strikeRate ?? null,
              hundreds: batting?.hundreds ?? null,
              fifties: batting?.fifties ?? null,
              ducks: batting?.ducks ?? null,
              fours: batting?.fours ?? null,
              sixes: batting?.sixes ?? null,
              balls_bowled: bowling?.balls ?? null,
              overs_text: bowling?.oversText ?? null,
              maidens: bowling?.maidens ?? null,
              runs_conceded: bowling?.runsConceded ?? null,
              wickets: bowling?.wickets ?? null,
              best_bowling_innings: bowling?.bestBowlingInnings ?? null,
              best_bowling_match: bowling?.bestBowlingMatch ?? null,
              bowling_average: bowling?.average ?? null,
              economy_rate: bowling?.economy ?? null,
              bowling_strike_rate: bowling?.strikeRate ?? null,
              four_wicket_hauls: bowling?.fourWicketHauls ?? null,
              five_wicket_hauls: bowling?.fiveWicketHauls ?? null,
              ten_wicket_hauls: bowling?.tenWicketHauls ?? null,
              raw_record: normalized.rawRecord
            },
            { onConflict: "source_file,source_row_number" }
          );

          if (error) throw error;
        }

        recordsInserted += 1;
      } catch (error) {
        recordsFailed += 1;
        await supabase.from("import_errors").insert({
          import_batch_id: batch.id,
          source_record_id: row.source_row_number,
          entity_type: definition.kind,
          error_code: "import-record-failed",
          error_message: error instanceof Error ? error.message : String(error),
          raw_record: row
        });
      }
    }

    const status = recordsFailed > 0 ? "completed-with-errors" : "completed";
    await supabase
      .from("import_batches")
      .update({
        status,
        records_inserted: recordsInserted,
        records_failed: recordsFailed,
        finished_at: new Date().toISOString()
      })
      .eq("id", batch.id);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
