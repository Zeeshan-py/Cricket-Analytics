-- migration: cricket core data foundation
-- purpose: normalized public cricket analytics schema for supabase postgres.
-- notes:
--   - current repository datasets are aggregate csv leaderboards and series summaries.
--   - match-level innings/stat tables are included as the long-term normalized target.
--   - imported aggregate tables preserve current csv facts without pretending they are match scorecards.
--   - rls is enabled on all public tables. anon/authenticated users can select public cricket data.
--   - writes are intentionally not granted to anon/authenticated; use server-side service credentials for imports.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.formats (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formats_code_not_blank check (length(trim(code)) > 0),
  constraint formats_name_not_blank check (length(trim(name)) > 0),
  constraint formats_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  slug text not null unique,
  country text,
  team_type text not null default 'international',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_not_blank check (length(trim(name)) > 0),
  constraint teams_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint teams_type_valid check (team_type in ('international', 'domestic', 'franchise', 'composite', 'other'))
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  full_name text,
  cricsheet_id text unique,
  primary_team_id uuid references public.teams(id) on delete set null,
  country text,
  date_of_birth date,
  batting_style text,
  bowling_style text,
  role text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_name_not_blank check (length(trim(name)) > 0),
  constraint players_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.player_team_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  format_id uuid references public.formats(id) on delete set null,
  started_on date,
  ended_on date,
  source text,
  created_at timestamptz not null default now(),
  constraint player_team_memberships_unique unique (player_id, team_id, format_id, started_on, ended_on),
  constraint player_team_memberships_date_order check (ended_on is null or started_on is null or ended_on >= started_on)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  country text,
  stadium_name text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_name_not_blank check (length(trim(name)) > 0),
  constraint venues_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint venues_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint venues_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  format_id uuid references public.formats(id) on delete set null,
  start_date date,
  end_date date,
  edition text,
  season_year integer,
  host_country text,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_name_not_blank check (length(trim(name)) > 0),
  constraint tournaments_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tournaments_year_range check (season_year is null or season_year between 1800 and 2200),
  constraint tournaments_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  match_date date,
  end_date date,
  format_id uuid not null references public.formats(id) on delete restrict,
  tournament_id uuid references public.tournaments(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  team_1_id uuid not null references public.teams(id) on delete restrict,
  team_2_id uuid not null references public.teams(id) on delete restrict,
  winner_team_id uuid references public.teams(id) on delete set null,
  toss_winner_team_id uuid references public.teams(id) on delete set null,
  toss_decision text,
  balls_per_over integer not null default 6,
  gender text,
  team_type text,
  match_type_number integer,
  outcome_type text,
  outcome_margin_runs integer,
  outcome_margin_wickets integer,
  outcome_margin_innings integer,
  result text,
  status text not null default 'completed',
  season_year integer,
  season_label text,
  match_number text,
  source_provider text,
  source_file text,
  source_record_id text,
  data_version text,
  revision integer,
  raw_info jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_distinct_teams check (team_1_id <> team_2_id),
  constraint matches_winner_is_participant check (winner_team_id is null or winner_team_id in (team_1_id, team_2_id)),
  constraint matches_toss_winner_is_participant check (toss_winner_team_id is null or toss_winner_team_id in (team_1_id, team_2_id)),
  constraint matches_status_valid check (status in ('scheduled', 'live', 'completed', 'drawn', 'tied', 'abandoned', 'no-result', 'cancelled')),
  constraint matches_toss_decision_valid check (toss_decision is null or toss_decision in ('bat', 'field', 'unknown')),
  constraint matches_balls_per_over_positive check (balls_per_over > 0),
  constraint matches_outcome_type_valid check (outcome_type is null or outcome_type in ('winner', 'draw', 'tie', 'no-result', 'abandoned', 'unknown')),
  constraint matches_outcome_non_negative check (
    (outcome_margin_runs is null or outcome_margin_runs >= 0)
    and (outcome_margin_wickets is null or outcome_margin_wickets >= 0)
    and (outcome_margin_innings is null or outcome_margin_innings >= 0)
  ),
  constraint matches_year_range check (season_year is null or season_year between 1800 and 2200),
  constraint matches_date_order check (end_date is null or match_date is null or end_date >= match_date),
  constraint matches_source_unique unique (source_file, source_record_id)
);

create table public.match_innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_number integer not null,
  batting_team_id uuid not null references public.teams(id) on delete restrict,
  bowling_team_id uuid not null references public.teams(id) on delete restrict,
  total_runs integer,
  total_wickets integer,
  balls integer,
  overs_text text,
  declared boolean not null default false,
  follow_on boolean not null default false,
  target_runs integer,
  target_overs numeric(6, 1),
  powerplays jsonb,
  raw_innings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_innings_unique unique (match_id, innings_number),
  constraint match_innings_number_positive check (innings_number > 0),
  constraint match_innings_distinct_teams check (batting_team_id <> bowling_team_id),
  constraint match_innings_non_negative_runs check (total_runs is null or total_runs >= 0),
  constraint match_innings_wickets_range check (total_wickets is null or total_wickets between 0 and 10),
  constraint match_innings_non_negative_balls check (balls is null or balls >= 0),
  constraint match_innings_target_non_negative check (
    (target_runs is null or target_runs >= 0)
    and (target_overs is null or target_overs >= 0)
  )
);

create table public.match_officials (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  role text not null,
  name text not null,
  cricsheet_id text,
  created_at timestamptz not null default now(),
  constraint match_officials_unique unique (match_id, role, name),
  constraint match_officials_role_not_blank check (length(trim(role)) > 0),
  constraint match_officials_name_not_blank check (length(trim(name)) > 0)
);

create table public.match_deliveries (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_id uuid not null references public.match_innings(id) on delete cascade,
  innings_number integer not null,
  batting_team_id uuid not null references public.teams(id) on delete restrict,
  bowling_team_id uuid not null references public.teams(id) on delete restrict,
  over_number integer not null,
  delivery_index integer not null,
  actual_delivery text,
  batter_id uuid not null references public.players(id) on delete restrict,
  bowler_id uuid not null references public.players(id) on delete restrict,
  non_striker_id uuid not null references public.players(id) on delete restrict,
  runs_batter integer not null default 0,
  runs_extras integer not null default 0,
  runs_total integer not null default 0,
  extras jsonb,
  wickets jsonb,
  replacements jsonb,
  review jsonb,
  non_boundary boolean not null default false,
  raw_delivery jsonb not null,
  created_at timestamptz not null default now(),
  constraint match_deliveries_unique unique (match_id, innings_number, over_number, delivery_index),
  constraint match_deliveries_innings_number_positive check (innings_number > 0),
  constraint match_deliveries_over_number_non_negative check (over_number >= 0),
  constraint match_deliveries_delivery_index_positive check (delivery_index > 0),
  constraint match_deliveries_non_negative_runs check (runs_batter >= 0 and runs_extras >= 0 and runs_total >= 0),
  constraint match_deliveries_distinct_teams check (batting_team_id <> bowling_team_id)
);

create table public.batting_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_id uuid references public.match_innings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  batting_position integer,
  runs integer not null default 0,
  balls_faced integer,
  fours integer not null default 0,
  sixes integer not null default 0,
  dismissal_kind text,
  dismissed boolean not null default false,
  bowler_id uuid references public.players(id) on delete set null,
  fielder_id uuid references public.players(id) on delete set null,
  minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batting_statistics_unique unique (match_id, innings_id, player_id),
  constraint batting_statistics_non_negative_runs check (runs >= 0),
  constraint batting_statistics_non_negative_balls check (balls_faced is null or balls_faced >= 0),
  constraint batting_statistics_non_negative_boundaries check (fours >= 0 and sixes >= 0),
  constraint batting_statistics_position_range check (batting_position is null or batting_position between 1 and 11),
  constraint batting_statistics_minutes_non_negative check (minutes is null or minutes >= 0)
);

create table public.bowling_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_id uuid references public.match_innings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  balls integer not null default 0,
  maidens integer not null default 0,
  runs_conceded integer not null default 0,
  wickets integer not null default 0,
  dot_balls integer,
  wides integer not null default 0,
  no_balls integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bowling_statistics_unique unique (match_id, innings_id, player_id),
  constraint bowling_statistics_non_negative check (
    balls >= 0 and maidens >= 0 and runs_conceded >= 0 and wickets >= 0 and wides >= 0 and no_balls >= 0
  ),
  constraint bowling_statistics_wickets_range check (wickets <= 10),
  constraint bowling_statistics_dot_balls_valid check (dot_balls is null or dot_balls between 0 and balls)
);

create table public.fielding_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_id uuid references public.match_innings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  catches integer not null default 0,
  stumpings integer not null default 0,
  run_outs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fielding_statistics_unique unique (match_id, innings_id, player_id),
  constraint fielding_statistics_non_negative check (catches >= 0 and stumpings >= 0 and run_outs >= 0)
);

create table public.player_match_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  format_id uuid not null references public.formats(id) on delete restrict,
  runs integer not null default 0,
  balls_faced integer,
  wickets integer not null default 0,
  balls_bowled integer,
  runs_conceded integer,
  catches integer not null default 0,
  stumpings integer not null default 0,
  player_of_match boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_match_statistics_unique unique (match_id, player_id),
  constraint player_match_statistics_non_negative check (
    runs >= 0 and wickets >= 0 and catches >= 0 and stumpings >= 0
  ),
  constraint player_match_statistics_optional_non_negative check (
    (balls_faced is null or balls_faced >= 0)
    and (balls_bowled is null or balls_bowled >= 0)
    and (runs_conceded is null or runs_conceded >= 0)
  )
);

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  award_name text not null,
  slug text,
  player_id uuid references public.players(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  match_id uuid references public.matches(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  format_id uuid references public.formats(id) on delete set null,
  award_year integer,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint awards_slug_unique unique (slug),
  constraint awards_name_not_blank check (length(trim(award_name)) > 0),
  constraint awards_year_range check (award_year is null or award_year between 1800 and 2200),
  constraint awards_slug_format check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_kind text not null,
  source_path text,
  source_checksum text,
  status text not null default 'pending',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_failed integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_batches_source_kind_valid check (source_kind in ('csv', 'json', 'excel')),
  constraint import_batches_status_valid check (status in ('pending', 'running', 'completed', 'completed-with-errors', 'failed')),
  constraint import_batches_non_negative_counts check (
    records_seen >= 0 and records_inserted >= 0 and records_updated >= 0 and records_failed >= 0
  )
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_record_id text,
  entity_type text,
  error_code text not null,
  error_message text not null,
  raw_record jsonb,
  created_at timestamptz not null default now()
);

create table public.imported_player_career_aggregates (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  format_id uuid not null references public.formats(id) on delete restrict,
  statistic_type text not null,
  source_file text not null,
  source_row_number integer not null,
  span_start_year integer,
  span_end_year integer,
  matches integer,
  innings integer,
  not_outs integer,
  runs integer,
  highest_score text,
  highest_score_runs integer,
  highest_score_not_out boolean,
  balls_faced integer,
  batting_average numeric(8, 2),
  batting_strike_rate numeric(8, 2),
  hundreds integer,
  fifties integer,
  ducks integer,
  fours integer,
  sixes integer,
  balls_bowled integer,
  overs_text text,
  maidens integer,
  runs_conceded integer,
  wickets integer,
  best_bowling_innings text,
  best_bowling_match text,
  bowling_average numeric(8, 2),
  economy_rate numeric(8, 2),
  bowling_strike_rate numeric(8, 2),
  four_wicket_hauls integer,
  five_wicket_hauls integer,
  ten_wicket_hauls integer,
  raw_record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint imported_player_career_unique unique (source_file, source_row_number),
  constraint imported_player_career_dedupe unique (player_id, format_id, statistic_type, source_file),
  constraint imported_player_career_stat_type_valid check (statistic_type in ('batting', 'bowling')),
  constraint imported_player_career_span_order check (
    span_start_year is null or span_end_year is null or span_end_year >= span_start_year
  ),
  constraint imported_player_career_non_negative check (
    (matches is null or matches >= 0)
    and (innings is null or innings >= 0)
    and (not_outs is null or not_outs >= 0)
    and (runs is null or runs >= 0)
    and (highest_score_runs is null or highest_score_runs >= 0)
    and (balls_faced is null or balls_faced >= 0)
    and (hundreds is null or hundreds >= 0)
    and (fifties is null or fifties >= 0)
    and (ducks is null or ducks >= 0)
    and (fours is null or fours >= 0)
    and (sixes is null or sixes >= 0)
    and (balls_bowled is null or balls_bowled >= 0)
    and (maidens is null or maidens >= 0)
    and (runs_conceded is null or runs_conceded >= 0)
    and (wickets is null or wickets >= 0)
    and (four_wicket_hauls is null or four_wicket_hauls >= 0)
    and (five_wicket_hauls is null or five_wicket_hauls >= 0)
    and (ten_wicket_hauls is null or ten_wicket_hauls >= 0)
  )
);

create table public.imported_series_summaries (
  id uuid primary key default gen_random_uuid(),
  format_id uuid not null references public.formats(id) on delete restrict,
  tournament_id uuid references public.tournaments(id) on delete set null,
  winner_team_id uuid references public.teams(id) on delete set null,
  source_file text not null,
  source_row_number integer not null,
  series_name text not null,
  slug text not null,
  season_label text not null,
  season_start_year integer,
  season_end_year integer,
  winner_name text,
  result_status text,
  margin text,
  match_count integer,
  raw_record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint imported_series_unique unique (source_file, source_row_number),
  constraint imported_series_slug_unique unique (format_id, slug, season_label),
  constraint imported_series_name_not_blank check (length(trim(series_name)) > 0),
  constraint imported_series_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint imported_series_year_order check (
    season_start_year is null or season_end_year is null or season_end_year >= season_start_year
  ),
  constraint imported_series_match_count_non_negative check (match_count is null or match_count >= 0),
  constraint imported_series_status_valid check (result_status in ('won', 'drawn', 'tied', 'shared', 'abandoned', 'no-result', 'unknown'))
);

create index players_name_idx on public.players using gin (to_tsvector('simple', name));
create index teams_name_idx on public.teams using gin (to_tsvector('simple', name));
create index tournaments_year_idx on public.tournaments (season_year);
create index tournaments_format_idx on public.tournaments (format_id);
create index venues_country_city_idx on public.venues (country, city);
create index matches_match_date_idx on public.matches (match_date);
create index matches_season_year_idx on public.matches (season_year);
create index matches_format_idx on public.matches (format_id);
create index matches_tournament_idx on public.matches (tournament_id);
create index matches_team_1_idx on public.matches (team_1_id);
create index matches_team_2_idx on public.matches (team_2_id);
create index matches_external_id_idx on public.matches (external_id);
create index matches_source_provider_idx on public.matches (source_provider);
create index matches_toss_winner_idx on public.matches (toss_winner_team_id);
create index match_innings_match_idx on public.match_innings (match_id);
create index match_officials_match_idx on public.match_officials (match_id);
create index match_deliveries_match_idx on public.match_deliveries (match_id);
create index match_deliveries_innings_idx on public.match_deliveries (innings_id);
create index match_deliveries_batter_idx on public.match_deliveries (batter_id);
create index match_deliveries_bowler_idx on public.match_deliveries (bowler_id);
create index batting_statistics_player_idx on public.batting_statistics (player_id);
create index batting_statistics_match_idx on public.batting_statistics (match_id);
create index batting_statistics_team_idx on public.batting_statistics (team_id);
create index bowling_statistics_player_idx on public.bowling_statistics (player_id);
create index bowling_statistics_match_idx on public.bowling_statistics (match_id);
create index bowling_statistics_team_idx on public.bowling_statistics (team_id);
create index fielding_statistics_player_idx on public.fielding_statistics (player_id);
create index player_match_statistics_player_idx on public.player_match_statistics (player_id);
create index player_match_statistics_match_idx on public.player_match_statistics (match_id);
create index player_match_statistics_format_idx on public.player_match_statistics (format_id);
create index awards_player_idx on public.awards (player_id);
create index awards_year_idx on public.awards (award_year);
create index imported_player_career_player_idx on public.imported_player_career_aggregates (player_id);
create index imported_player_career_format_type_idx on public.imported_player_career_aggregates (format_id, statistic_type);
create index imported_player_career_runs_idx on public.imported_player_career_aggregates (format_id, statistic_type, runs desc);
create index imported_player_career_wickets_idx on public.imported_player_career_aggregates (format_id, statistic_type, wickets desc);
create index imported_series_format_year_idx on public.imported_series_summaries (format_id, season_start_year);
create index imported_series_winner_idx on public.imported_series_summaries (winner_team_id);

create trigger formats_set_updated_at before update on public.formats
for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams
for each row execute function public.set_updated_at();
create trigger players_set_updated_at before update on public.players
for each row execute function public.set_updated_at();
create trigger venues_set_updated_at before update on public.venues
for each row execute function public.set_updated_at();
create trigger tournaments_set_updated_at before update on public.tournaments
for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();
create trigger match_innings_set_updated_at before update on public.match_innings
for each row execute function public.set_updated_at();
create trigger batting_statistics_set_updated_at before update on public.batting_statistics
for each row execute function public.set_updated_at();
create trigger bowling_statistics_set_updated_at before update on public.bowling_statistics
for each row execute function public.set_updated_at();
create trigger fielding_statistics_set_updated_at before update on public.fielding_statistics
for each row execute function public.set_updated_at();
create trigger player_match_statistics_set_updated_at before update on public.player_match_statistics
for each row execute function public.set_updated_at();
create trigger awards_set_updated_at before update on public.awards
for each row execute function public.set_updated_at();
create trigger import_batches_set_updated_at before update on public.import_batches
for each row execute function public.set_updated_at();
create trigger imported_player_career_set_updated_at before update on public.imported_player_career_aggregates
for each row execute function public.set_updated_at();
create trigger imported_series_set_updated_at before update on public.imported_series_summaries
for each row execute function public.set_updated_at();

alter table public.formats enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.player_team_memberships enable row level security;
alter table public.venues enable row level security;
alter table public.tournaments enable row level security;
alter table public.matches enable row level security;
alter table public.match_innings enable row level security;
alter table public.match_officials enable row level security;
alter table public.match_deliveries enable row level security;
alter table public.batting_statistics enable row level security;
alter table public.bowling_statistics enable row level security;
alter table public.fielding_statistics enable row level security;
alter table public.player_match_statistics enable row level security;
alter table public.awards enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_errors enable row level security;
alter table public.imported_player_career_aggregates enable row level security;
alter table public.imported_series_summaries enable row level security;

grant usage on schema public to anon, authenticated;
grant select on
  public.formats,
  public.teams,
  public.players,
  public.player_team_memberships,
  public.venues,
  public.tournaments,
  public.matches,
  public.match_innings,
  public.match_officials,
  public.match_deliveries,
  public.batting_statistics,
  public.bowling_statistics,
  public.fielding_statistics,
  public.player_match_statistics,
  public.awards,
  public.imported_player_career_aggregates,
  public.imported_series_summaries
to anon, authenticated;

create policy "anon can read formats" on public.formats for select to anon using (true);
create policy "authenticated can read formats" on public.formats for select to authenticated using (true);
create policy "anon can read teams" on public.teams for select to anon using (true);
create policy "authenticated can read teams" on public.teams for select to authenticated using (true);
create policy "anon can read players" on public.players for select to anon using (true);
create policy "authenticated can read players" on public.players for select to authenticated using (true);
create policy "anon can read player team memberships" on public.player_team_memberships for select to anon using (true);
create policy "authenticated can read player team memberships" on public.player_team_memberships for select to authenticated using (true);
create policy "anon can read venues" on public.venues for select to anon using (true);
create policy "authenticated can read venues" on public.venues for select to authenticated using (true);
create policy "anon can read tournaments" on public.tournaments for select to anon using (true);
create policy "authenticated can read tournaments" on public.tournaments for select to authenticated using (true);
create policy "anon can read matches" on public.matches for select to anon using (true);
create policy "authenticated can read matches" on public.matches for select to authenticated using (true);
create policy "anon can read match innings" on public.match_innings for select to anon using (true);
create policy "authenticated can read match innings" on public.match_innings for select to authenticated using (true);
create policy "anon can read match officials" on public.match_officials for select to anon using (true);
create policy "authenticated can read match officials" on public.match_officials for select to authenticated using (true);
create policy "anon can read match deliveries" on public.match_deliveries for select to anon using (true);
create policy "authenticated can read match deliveries" on public.match_deliveries for select to authenticated using (true);
create policy "anon can read batting statistics" on public.batting_statistics for select to anon using (true);
create policy "authenticated can read batting statistics" on public.batting_statistics for select to authenticated using (true);
create policy "anon can read bowling statistics" on public.bowling_statistics for select to anon using (true);
create policy "authenticated can read bowling statistics" on public.bowling_statistics for select to authenticated using (true);
create policy "anon can read fielding statistics" on public.fielding_statistics for select to anon using (true);
create policy "authenticated can read fielding statistics" on public.fielding_statistics for select to authenticated using (true);
create policy "anon can read player match statistics" on public.player_match_statistics for select to anon using (true);
create policy "authenticated can read player match statistics" on public.player_match_statistics for select to authenticated using (true);
create policy "anon can read awards" on public.awards for select to anon using (true);
create policy "authenticated can read awards" on public.awards for select to authenticated using (true);
create policy "anon can read player career aggregates" on public.imported_player_career_aggregates for select to anon using (true);
create policy "authenticated can read player career aggregates" on public.imported_player_career_aggregates for select to authenticated using (true);
create policy "anon can read series summaries" on public.imported_series_summaries for select to anon using (true);
create policy "authenticated can read series summaries" on public.imported_series_summaries for select to authenticated using (true);

-- import_batches and import_errors intentionally have no anon/authenticated read policies.
-- they may contain operational details and raw invalid records. use service credentials server-side only.
