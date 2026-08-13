export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CricketFormatCode = "test" | "odi" | "t20" | "t20i" | "first-class" | "list-a" | "other";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type FormatRow = Timestamps & {
  id: string;
  code: CricketFormatCode;
  name: string;
  slug: string;
  description: string | null;
};

export type TeamRow = Timestamps & {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  team_type: string;
  logo_url: string | null;
};

export type PlayerRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  full_name: string | null;
  cricsheet_id: string | null;
  primary_team_id: string | null;
  country: string | null;
  date_of_birth: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  role: string | null;
  image_url: string | null;
};

export type TournamentRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  format_id: string | null;
  start_date: string | null;
  end_date: string | null;
  edition: string | null;
  season_year: number | null;
  host_country: string | null;
  description: string | null;
  image_url: string | null;
};

export type VenueRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  stadium_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type MatchRow = Timestamps & {
  id: string;
  external_id: string | null;
  match_date: string | null;
  end_date: string | null;
  format_id: string;
  tournament_id: string | null;
  venue_id: string | null;
  team_1_id: string;
  team_2_id: string;
  winner_team_id: string | null;
  toss_winner_team_id: string | null;
  toss_decision: string | null;
  balls_per_over: number;
  gender: string | null;
  team_type: string | null;
  match_type_number: number | null;
  outcome_type: string | null;
  outcome_margin_runs: number | null;
  outcome_margin_wickets: number | null;
  outcome_margin_innings: number | null;
  result: string | null;
  status: string;
  season_year: number | null;
  season_label: string | null;
  match_number: string | null;
  source_provider: string | null;
  source_file: string | null;
  source_record_id: string | null;
  data_version: string | null;
  revision: number | null;
  raw_info: Json | null;
};

export type MatchInningsRow = Timestamps & {
  id: string;
  match_id: string;
  innings_number: number;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number | null;
  total_wickets: number | null;
  balls: number | null;
  overs_text: string | null;
  declared: boolean;
  follow_on: boolean;
  target_runs: number | null;
  target_overs: number | null;
  powerplays: Json | null;
  raw_innings: Json | null;
};

export type MatchOfficialRow = {
  id: string;
  match_id: string;
  role: string;
  name: string;
  cricsheet_id: string | null;
  created_at: string;
};

export type MatchDeliveryRow = {
  id: string;
  match_id: string;
  innings_id: string;
  innings_number: number;
  batting_team_id: string;
  bowling_team_id: string;
  over_number: number;
  delivery_index: number;
  actual_delivery: string | null;
  batter_id: string;
  bowler_id: string;
  non_striker_id: string;
  runs_batter: number;
  runs_extras: number;
  runs_total: number;
  extras: Json | null;
  wickets: Json | null;
  replacements: Json | null;
  review: Json | null;
  non_boundary: boolean;
  raw_delivery: Json;
  created_at: string;
};

export type BattingStatisticRow = Timestamps & {
  id: string;
  match_id: string;
  innings_id: string | null;
  player_id: string;
  team_id: string;
  batting_position: number | null;
  runs: number;
  balls_faced: number | null;
  fours: number;
  sixes: number;
  dismissal_kind: string | null;
  dismissed: boolean;
  bowler_id: string | null;
  fielder_id: string | null;
  minutes: number | null;
};

export type BowlingStatisticRow = Timestamps & {
  id: string;
  match_id: string;
  innings_id: string | null;
  player_id: string;
  team_id: string;
  balls: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  dot_balls: number | null;
  wides: number;
  no_balls: number;
};

export type FieldingStatisticRow = Timestamps & {
  id: string;
  match_id: string;
  innings_id: string | null;
  player_id: string;
  team_id: string;
  catches: number;
  stumpings: number;
  run_outs: number;
};

export type PlayerMatchStatisticRow = Timestamps & {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  format_id: string;
  runs: number;
  balls_faced: number | null;
  wickets: number;
  balls_bowled: number | null;
  runs_conceded: number | null;
  catches: number;
  stumpings: number;
  player_of_match: boolean;
};

export type AwardRow = Timestamps & {
  id: string;
  award_name: string;
  slug: string | null;
  player_id: string | null;
  team_id: string | null;
  match_id: string | null;
  tournament_id: string | null;
  format_id: string | null;
  award_year: number | null;
  description: string | null;
};

export type ImportBatchRow = Timestamps & {
  id: string;
  source_name: string;
  source_kind: "csv" | "json" | "excel";
  source_path: string | null;
  source_checksum: string | null;
  status: "pending" | "running" | "completed" | "completed-with-errors" | "failed";
  records_seen: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  started_at: string | null;
  finished_at: string | null;
  error_summary: string | null;
};

export type ImportErrorRow = {
  id: string;
  import_batch_id: string;
  source_record_id: string | null;
  entity_type: string | null;
  error_code: string;
  error_message: string;
  raw_record: Json | null;
  created_at: string;
};

export type PlayerCareerAggregateRow = Timestamps & {
  id: string;
  player_id: string;
  format_id: string;
  statistic_type: "batting" | "bowling";
  source_file: string;
  source_row_number: number;
  span_start_year: number | null;
  span_end_year: number | null;
  matches: number | null;
  innings: number | null;
  not_outs: number | null;
  runs: number | null;
  highest_score: string | null;
  highest_score_runs: number | null;
  highest_score_not_out: boolean | null;
  balls_faced: number | null;
  batting_average: number | null;
  batting_strike_rate: number | null;
  hundreds: number | null;
  fifties: number | null;
  ducks: number | null;
  fours: number | null;
  sixes: number | null;
  balls_bowled: number | null;
  overs_text: string | null;
  maidens: number | null;
  runs_conceded: number | null;
  wickets: number | null;
  best_bowling_innings: string | null;
  best_bowling_match: string | null;
  bowling_average: number | null;
  economy_rate: number | null;
  bowling_strike_rate: number | null;
  four_wicket_hauls: number | null;
  five_wicket_hauls: number | null;
  ten_wicket_hauls: number | null;
  raw_record: Json;
};

export type SeriesSummaryRow = Timestamps & {
  id: string;
  format_id: string;
  tournament_id: string | null;
  winner_team_id: string | null;
  source_file: string;
  source_row_number: number;
  series_name: string;
  slug: string;
  season_label: string;
  season_start_year: number | null;
  season_end_year: number | null;
  winner_name: string | null;
  result_status: "won" | "drawn" | "tied" | "shared" | "abandoned" | "no-result" | "unknown";
  margin: string | null;
  match_count: number | null;
  raw_record: Json;
};

export type Database = {
  public: {
    Tables: {
      formats: Table<FormatRow, Omit<Partial<FormatRow>, "id" | "created_at" | "updated_at"> & Pick<FormatRow, "code" | "name" | "slug">>;
      teams: Table<TeamRow, Omit<Partial<TeamRow>, "id" | "created_at" | "updated_at"> & Pick<TeamRow, "name" | "slug">>;
      players: Table<PlayerRow, Omit<Partial<PlayerRow>, "id" | "created_at" | "updated_at"> & Pick<PlayerRow, "name" | "slug">>;
      player_team_memberships: Table<Record<string, unknown>>;
      venues: Table<VenueRow, Omit<Partial<VenueRow>, "id" | "created_at" | "updated_at"> & Pick<VenueRow, "name" | "slug">>;
      tournaments: Table<TournamentRow, Omit<Partial<TournamentRow>, "id" | "created_at" | "updated_at"> & Pick<TournamentRow, "name" | "slug">>;
      matches: Table<MatchRow, Omit<Partial<MatchRow>, "id" | "created_at" | "updated_at"> & Pick<MatchRow, "format_id" | "team_1_id" | "team_2_id">>;
      match_innings: Table<
        MatchInningsRow,
        Omit<Partial<MatchInningsRow>, "id" | "created_at" | "updated_at"> &
          Pick<MatchInningsRow, "match_id" | "innings_number" | "batting_team_id" | "bowling_team_id">
      >;
      match_officials: Table<
        MatchOfficialRow,
        Omit<Partial<MatchOfficialRow>, "id" | "created_at"> & Pick<MatchOfficialRow, "match_id" | "role" | "name">
      >;
      match_deliveries: Table<
        MatchDeliveryRow,
        Omit<Partial<MatchDeliveryRow>, "id" | "created_at"> &
          Pick<
            MatchDeliveryRow,
            | "match_id"
            | "innings_id"
            | "innings_number"
            | "batting_team_id"
            | "bowling_team_id"
            | "over_number"
            | "delivery_index"
            | "batter_id"
            | "bowler_id"
            | "non_striker_id"
            | "raw_delivery"
          >
      >;
      batting_statistics: Table<
        BattingStatisticRow,
        Omit<Partial<BattingStatisticRow>, "id" | "created_at" | "updated_at"> &
          Pick<BattingStatisticRow, "match_id" | "player_id" | "team_id">
      >;
      bowling_statistics: Table<
        BowlingStatisticRow,
        Omit<Partial<BowlingStatisticRow>, "id" | "created_at" | "updated_at"> &
          Pick<BowlingStatisticRow, "match_id" | "player_id" | "team_id">
      >;
      fielding_statistics: Table<
        FieldingStatisticRow,
        Omit<Partial<FieldingStatisticRow>, "id" | "created_at" | "updated_at"> &
          Pick<FieldingStatisticRow, "match_id" | "player_id" | "team_id">
      >;
      player_match_statistics: Table<
        PlayerMatchStatisticRow,
        Omit<Partial<PlayerMatchStatisticRow>, "id" | "created_at" | "updated_at"> &
          Pick<PlayerMatchStatisticRow, "match_id" | "player_id" | "team_id" | "format_id">
      >;
      awards: Table<AwardRow, Omit<Partial<AwardRow>, "id" | "created_at" | "updated_at"> & Pick<AwardRow, "award_name">>;
      import_batches: Table<
        ImportBatchRow,
        Omit<Partial<ImportBatchRow>, "id" | "created_at" | "updated_at"> & Pick<ImportBatchRow, "source_name" | "source_kind">
      >;
      import_errors: Table<
        ImportErrorRow,
        Omit<Partial<ImportErrorRow>, "id" | "created_at"> & Pick<ImportErrorRow, "import_batch_id" | "error_code" | "error_message">
      >;
      imported_player_career_aggregates: Table<
        PlayerCareerAggregateRow,
        Omit<Partial<PlayerCareerAggregateRow>, "id" | "created_at" | "updated_at"> &
          Pick<PlayerCareerAggregateRow, "player_id" | "format_id" | "statistic_type" | "source_file" | "source_row_number" | "raw_record">
      >;
      imported_series_summaries: Table<
        SeriesSummaryRow,
        Omit<Partial<SeriesSummaryRow>, "id" | "created_at" | "updated_at"> &
          Pick<SeriesSummaryRow, "format_id" | "source_file" | "source_row_number" | "series_name" | "slug" | "season_label" | "result_status" | "raw_record">
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
