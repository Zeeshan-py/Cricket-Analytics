-- Run this in the Supabase SQL editor or any privileged Postgres session
-- after applying supabase/migrations/202608120001_cricket_core_schema.sql.
-- It verifies catalog-level objects that the publishable-key health check
-- cannot inspect directly.

with expected_tables(table_name) as (
  values
    ('formats'),
    ('teams'),
    ('players'),
    ('player_team_memberships'),
    ('venues'),
    ('tournaments'),
    ('matches'),
    ('match_innings'),
    ('match_officials'),
    ('match_deliveries'),
    ('batting_statistics'),
    ('bowling_statistics'),
    ('fielding_statistics'),
    ('player_match_statistics'),
    ('awards'),
    ('import_batches'),
    ('import_errors'),
    ('imported_player_career_aggregates'),
    ('imported_series_summaries')
)
select
  e.table_name,
  case when t.table_name is null then 'missing' else 'present' end as status
from expected_tables e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;

select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'formats',
    'teams',
    'players',
    'player_team_memberships',
    'venues',
    'tournaments',
    'matches',
    'match_innings',
    'match_officials',
    'match_deliveries',
    'batting_statistics',
    'bowling_statistics',
    'fielding_statistics',
    'player_match_statistics',
    'awards',
    'import_batches',
    'import_errors',
    'imported_player_career_aggregates',
    'imported_series_summaries'
  )
order by tablename;

select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  conrelid::regclass::text as table_name,
  conname,
  contype
from pg_constraint
where connamespace = 'public'::regnamespace
order by table_name, conname;

select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
