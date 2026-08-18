import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { listCricsheetJsonFiles, getCricsheetDataDir } from "@/scripts/import/cricsheetFiles";
import { aggregateInningsPlayerStats, aggregateMatchPlayerStats } from "@/scripts/import/cricsheetAggregates";
import { readCricsheetMatch } from "@/scripts/import/parseCricsheetJson";
import { validateCricsheetMatch } from "@/scripts/import/validateCricsheetData";
import { resolveTeamAlias } from "@/scripts/import/teamAliases";
import { slugify } from "@/scripts/import/slug";
import { createImportSupabaseClient } from "@/scripts/import/supabaseAdmin";
import type { CricketFormatCode } from "@/types/database";

type SupabaseClient = ReturnType<typeof createImportSupabaseClient>;
type IdMap = Map<string, string>;
const UPSERT_CHUNK_SIZE = 500;

function argValue(name: string) {
  const index = process.argv.findIndex((arg) => arg === name);
  if (index >= 0) {
    const value = process.argv[index + 1];
    return value && value !== "--" ? value : null;
  }

  const match = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function hasPlayerName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function checksumFile(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function getFormatId(supabase: SupabaseClient, code: CricketFormatCode) {
  const { data, error } = await supabase.from("formats").select("id").eq("code", code).single();
  if (error) throw error;
  return data.id;
}

async function upsertTeam(supabase: SupabaseClient, name: string) {
  const alias = resolveTeamAlias(name);
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
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function upsertPlayer(
  supabase: SupabaseClient,
  name: string,
  options: { cricsheetId?: string | null; primaryTeamId?: string | null; country?: string | null } = {}
) {
  if (!hasPlayerName(name)) throw new Error("Cannot upsert player without a name.");
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("players")
    .upsert(
      {
        name,
        slug,
        full_name: name,
        cricsheet_id: options.cricsheetId ?? null,
        primary_team_id: options.primaryTeamId ?? null,
        country: options.country ?? null
      },
      { onConflict: options.cricsheetId ? "cricsheet_id" : "slug" }
    )
    .select("id")
    .single();

  if (error) {
    if (options.cricsheetId && error.code === "23505" && error.message.includes("players_slug_key")) {
      const { data: existingPlayer, error: existingError } = await supabase
        .from("players")
        .select("id,cricsheet_id")
        .eq("slug", slug)
        .single();

      if (existingError) throw existingError;
      if (!existingPlayer.cricsheet_id) {
        const { data: updatedPlayer, error: updateError } = await supabase
          .from("players")
          .update({
            cricsheet_id: options.cricsheetId,
            primary_team_id: options.primaryTeamId ?? null,
            country: options.country ?? null
          })
          .eq("id", existingPlayer.id)
          .select("id")
          .single();

        if (updateError) throw updateError;
        return updatedPlayer.id;
      }

      return existingPlayer.id;
    }

    throw error;
  }
  return data.id;
}

async function resolvePlayerId(
  supabase: SupabaseClient,
  playerIds: IdMap,
  name: string,
  options: { cricsheetId?: string | null; primaryTeamId?: string | null; country?: string | null } = {}
) {
  const existing = playerIds.get(name);
  if (existing) return existing;

  const playerId = await upsertPlayer(supabase, name, options);
  playerIds.set(name, playerId);
  return playerId;
}

async function upsertVenue(supabase: SupabaseClient, venueName: string, city: string | null) {
  const { data, error } = await supabase
    .from("venues")
    .upsert(
      {
        name: venueName,
        slug: slugify(`${venueName}-${city ?? ""}`),
        city,
        stadium_name: venueName
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function upsertTournament(
  supabase: SupabaseClient,
  name: string | null,
  slug: string | null,
  formatId: string,
  seasonYear: number | null,
  edition: string | null
) {
  if (!name || !slug) return null;

  const { data, error } = await supabase
    .from("tournaments")
    .upsert(
      {
        name,
        slug,
        format_id: formatId,
        season_year: seasonYear,
        edition
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function importMatch(filePath: string, supabase: SupabaseClient, dryRun: boolean) {
  const match = await readCricsheetMatch(filePath);
  const errors = validateCricsheetMatch(match);
  const checksum = await checksumFile(filePath);

  if (dryRun || errors.length > 0) {
    return {
      file: basename(filePath),
      dryRun,
      status: errors.length > 0 ? "issues-found" : "ok",
      cricsheetId: match.cricsheetId,
      format: match.format,
      teams: match.teams.map((team) => team.name),
      players: match.players.length,
      officials: match.officials.length,
      innings: match.innings.length,
      deliveries: match.innings.reduce((sum, innings) => sum + innings.deliveries.length, 0),
      checksum,
      errors
    };
  }

  const formatId = await getFormatId(supabase, match.format);
  const teamIds: IdMap = new Map();
  for (const team of match.teams) {
    teamIds.set(team.name, await upsertTeam(supabase, team.name));
  }

  const playerIds: IdMap = new Map();
  for (const player of match.players) {
    const alias = player.teamName ? resolveTeamAlias(player.teamName) : null;
    const primaryTeamId = player.teamName ? teamIds.get(player.teamName) ?? null : null;
    await resolvePlayerId(supabase, playerIds, player.name, {
      cricsheetId: player.cricsheetId,
      primaryTeamId,
      country: alias?.country ?? null
    });
  }

  const venueId = match.venueName ? await upsertVenue(supabase, match.venueName, match.city) : null;
  const tournamentId = await upsertTournament(
    supabase,
    match.eventName,
    match.eventSlug,
    formatId,
    match.seasonYear,
    match.seasonLabel
  );
  const team1Id = teamIds.get(match.teams[0]?.name);
  const team2Id = teamIds.get(match.teams[1]?.name);
  if (!team1Id || !team2Id) throw new Error(`Could not resolve teams for ${match.sourceFile}`);

  const { data: dbMatch, error: matchError } = await supabase
    .from("matches")
    .upsert(
      {
        external_id: match.cricsheetId,
        match_date: match.startDate,
        end_date: match.endDate,
        format_id: formatId,
        tournament_id: tournamentId,
        venue_id: venueId,
        team_1_id: team1Id,
        team_2_id: team2Id,
        winner_team_id: match.winner ? teamIds.get(match.winner) ?? null : null,
        toss_winner_team_id: match.tossWinner ? teamIds.get(match.tossWinner) ?? null : null,
        toss_decision: match.tossDecision,
        balls_per_over: match.ballsPerOver,
        gender: match.gender,
        team_type: match.teamType,
        match_type_number: match.matchTypeNumber,
        outcome_type: match.outcomeType,
        outcome_margin_runs: match.outcomeMarginRuns,
        outcome_margin_wickets: match.outcomeMarginWickets,
        outcome_margin_innings: match.outcomeMarginInnings,
        result: match.result,
        status: match.status,
        season_year: match.seasonYear,
        season_label: match.seasonLabel,
        match_number: match.matchNumber,
        source_provider: "cricsheet",
        source_file: match.sourceFile,
        source_record_id: match.cricsheetId,
        data_version: match.dataVersion,
        revision: match.revision,
        raw_info: match.rawInfo
      },
      { onConflict: "external_id" }
    )
    .select("id")
    .single();

  if (matchError) throw matchError;

  for (const official of match.officials) {
    await supabase.from("match_officials").upsert(
      {
        match_id: dbMatch.id,
        role: official.role,
        name: official.name,
        cricsheet_id: official.cricsheetId
      },
      { onConflict: "match_id,role,name" }
    );
  }

  for (const awardPlayer of match.playerOfMatch) {
    const playerId = await resolvePlayerId(supabase, playerIds, awardPlayer);
    await supabase.from("awards").upsert(
      {
        award_name: "Player of the Match",
        slug: `player-of-the-match-${match.cricsheetId}-${slugify(awardPlayer)}`,
        player_id: playerId,
        match_id: dbMatch.id,
        tournament_id: tournamentId,
        format_id: formatId,
        award_year: match.seasonYear,
        description: `Cricsheet player_of_match for match ${match.cricsheetId}`
      },
      { onConflict: "slug" }
    );
  }

  for (const innings of match.innings) {
    const battingTeamId = teamIds.get(innings.battingTeam);
    const bowlingTeamId = teamIds.get(innings.bowlingTeam);
    if (!battingTeamId || !bowlingTeamId) throw new Error(`Could not resolve innings teams for ${match.sourceFile}`);

    const { data: dbInnings, error: inningsError } = await supabase
      .from("match_innings")
      .upsert(
        {
          match_id: dbMatch.id,
          innings_number: innings.inningsNumber,
          batting_team_id: battingTeamId,
          bowling_team_id: bowlingTeamId,
          total_runs: innings.totalRuns,
          total_wickets: innings.totalWickets,
          balls: innings.legalBalls,
          overs_text: innings.oversText,
          declared: innings.declared,
          target_runs: innings.targetRuns,
          target_overs: innings.targetOvers,
          powerplays: innings.powerplays,
          raw_innings: innings.rawInnings
        },
        { onConflict: "match_id,innings_number" }
      )
      .select("id")
      .single();

    if (inningsError) throw inningsError;

    const deliveryRows = [];
    for (const delivery of innings.deliveries) {
      const batterId = await resolvePlayerId(supabase, playerIds, delivery.batter);
      const bowlerId = await resolvePlayerId(supabase, playerIds, delivery.bowler);
      const nonStrikerId = await resolvePlayerId(supabase, playerIds, delivery.nonStriker);
      deliveryRows.push({
        match_id: dbMatch.id,
        innings_id: dbInnings.id,
        innings_number: delivery.inningsNumber,
        batting_team_id: battingTeamId,
        bowling_team_id: bowlingTeamId,
        over_number: delivery.overNumber,
        delivery_index: delivery.deliveryIndex,
        actual_delivery: delivery.actualDelivery,
        batter_id: batterId,
        bowler_id: bowlerId,
        non_striker_id: nonStrikerId,
        runs_batter: delivery.runsBatter,
        runs_extras: delivery.runsExtras,
        runs_total: delivery.runsTotal,
        extras: delivery.extras,
        wickets: delivery.wickets,
        replacements: delivery.replacements,
        review: delivery.review,
        non_boundary: delivery.nonBoundary,
        raw_delivery: delivery.rawDelivery
      });
    }
    for (const chunk of chunkArray(deliveryRows, UPSERT_CHUNK_SIZE)) {
      const { error: deliveryError } = await supabase
        .from("match_deliveries")
        .upsert(chunk, { onConflict: "match_id,innings_number,over_number,delivery_index" });
      if (deliveryError) throw deliveryError;
    }

    const aggregate = aggregateInningsPlayerStats(match, innings);
    const battingRows = [];
    for (const line of aggregate.batting) {
      const playerId = await resolvePlayerId(supabase, playerIds, line.player);
      const bowlerId = line.bowler ? await resolvePlayerId(supabase, playerIds, line.bowler) : null;
      const fielderId = line.fielder ? await resolvePlayerId(supabase, playerIds, line.fielder) : null;
      battingRows.push({
        match_id: dbMatch.id,
        innings_id: dbInnings.id,
        player_id: playerId,
        team_id: battingTeamId,
        runs: line.runs,
        balls_faced: line.ballsFaced,
        fours: line.fours,
        sixes: line.sixes,
        dismissal_kind: line.dismissalKind,
        dismissed: line.dismissed,
        bowler_id: bowlerId,
        fielder_id: fielderId
      });
    }
    for (const chunk of chunkArray(battingRows, UPSERT_CHUNK_SIZE)) {
      const { error: battingError } = await supabase
        .from("batting_statistics")
        .upsert(chunk, { onConflict: "match_id,innings_id,player_id" });
      if (battingError) throw battingError;
    }

    const bowlingRows = [];
    for (const line of aggregate.bowling) {
      const playerId = await resolvePlayerId(supabase, playerIds, line.player);
      bowlingRows.push({
        match_id: dbMatch.id,
        innings_id: dbInnings.id,
        player_id: playerId,
        team_id: bowlingTeamId,
        balls: line.balls,
        maidens: line.maidens,
        runs_conceded: line.runsConceded,
        wickets: line.wickets,
        dot_balls: line.dotBalls,
        wides: line.wides,
        no_balls: line.noBalls
      });
    }
    for (const chunk of chunkArray(bowlingRows, UPSERT_CHUNK_SIZE)) {
      const { error: bowlingError } = await supabase
        .from("bowling_statistics")
        .upsert(chunk, { onConflict: "match_id,innings_id,player_id" });
      if (bowlingError) throw bowlingError;
    }

    const fieldingRows = [];
    for (const line of aggregate.fielding) {
      if (!hasPlayerName(line.player)) continue;
      const playerId = await resolvePlayerId(supabase, playerIds, line.player);
      fieldingRows.push({
        match_id: dbMatch.id,
        innings_id: dbInnings.id,
        player_id: playerId,
        team_id: bowlingTeamId,
        catches: line.catches,
        stumpings: line.stumpings,
        run_outs: line.runOuts
      });
    }
    for (const chunk of chunkArray(fieldingRows, UPSERT_CHUNK_SIZE)) {
      const { error: fieldingError } = await supabase
        .from("fielding_statistics")
        .upsert(chunk, { onConflict: "match_id,innings_id,player_id" });
      if (fieldingError) throw fieldingError;
    }
  }

  const playerMatchRows = [];
  for (const summary of aggregateMatchPlayerStats(match)) {
    if (!hasPlayerName(summary.player)) continue;
    const playerId = await resolvePlayerId(supabase, playerIds, summary.player);
    const teamId = teamIds.get(summary.team);
    if (!teamId) continue;
    playerMatchRows.push({
      match_id: dbMatch.id,
      player_id: playerId,
      team_id: teamId,
      format_id: formatId,
      runs: summary.runs,
      balls_faced: summary.ballsFaced,
      wickets: summary.wickets,
      balls_bowled: summary.ballsBowled,
      runs_conceded: summary.runsConceded,
      catches: summary.catches,
      stumpings: summary.stumpings,
      player_of_match: summary.playerOfMatch
    });
  }
  for (const chunk of chunkArray(playerMatchRows, UPSERT_CHUNK_SIZE)) {
    const { error: playerMatchError } = await supabase
      .from("player_match_statistics")
      .upsert(chunk, { onConflict: "match_id,player_id" });
    if (playerMatchError) throw playerMatchError;
  }

  return {
    file: basename(filePath),
    dryRun,
    status: "imported",
    cricsheetId: match.cricsheetId,
    format: match.format,
    innings: match.innings.length,
    deliveries: match.innings.reduce((sum, innings) => sum + innings.deliveries.length, 0),
    checksum
  };
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const limit = Number.parseInt(argValue("--limit") ?? "", 10);
  const directory = argValue("--dir") ?? getCricsheetDataDir();
  const files = await listCricsheetJsonFiles(directory);
  const selectedFiles = Number.isFinite(limit) ? files.slice(0, limit) : files;
  const supabase = dryRun ? null : createImportSupabaseClient();
  const report = [];

  for (const file of selectedFiles) {
    report.push(await importMatch(file, supabase as SupabaseClient, dryRun));
  }

  console.log(
    JSON.stringify(
      {
        directory,
        dryRun,
        filesSeen: files.length,
        filesProcessed: selectedFiles.length,
        report
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
