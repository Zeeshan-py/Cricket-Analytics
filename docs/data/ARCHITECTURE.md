# Cricket Data Architecture

The long-term data flow is:

```text
Cricsheet JSON / supplementary CSV / future Excel
  -> parse
  -> normalize
  -> validate
  -> insert/upsert
  -> Supabase PostgreSQL
  -> server-side data access layer
  -> future FastAPI layer
  -> Next.js frontend
```

## Database Layers

### Core Entities

- `players`: one stable player record per player, with SEO slug and optional profile metadata.
- `teams`: stable international, domestic, franchise, composite, or other teams.
- `formats`: stable format records such as Test, ODI, T20I, First Class, List A, Other.
- `tournaments`: reusable tournament/series entities.
- `venues`: normalized venue metadata.
- `matches`: central match table linked to format, tournament, venue, teams, and winner.
- `match_innings`: supports any number of innings per match, including Test cricket.

### Match-Level Statistics

- `batting_statistics`: raw innings-level batting lines.
- `bowling_statistics`: raw innings-level bowling lines.
- `fielding_statistics`: catches, stumpings, run-outs.
- `player_match_statistics`: per-player match summary for fast player/match pages.
- `awards`: player/team/tournament/match awards.

These tables are intentionally raw-fact oriented. Career averages, strike rates, economy, yearly leaders, and tournament totals should usually be calculated from match-level rows or materialized later if performance requires it.

### Primary Cricsheet Source

Cricsheet JSON is the primary raw match source. The importer reads JSON files from an external directory, normalizes match metadata, innings, deliveries, wickets, and player lines, then upserts normalized rows.

Cricsheet-specific schema support includes:

- `matches.external_id`, `source_provider`, `source_record_id`, `data_version`, `revision`, `raw_info`
- match metadata columns for toss, outcome, gender, team type, balls per over, and match type number
- `match_officials`
- `match_deliveries`
- `match_innings.target_*`, `powerplays`, `raw_innings`
- `players.cricsheet_id`

The full 3.5 GB Cricsheet dataset must stay outside Git and outside Supabase Storage. Supabase stores normalized relational rows plus selected JSONB source fragments (`raw_info`, `raw_innings`, `raw_delivery`) for traceability, not the raw file directory.

### Supplementary Aggregate Source Tables

The CSVs are not match-level data. They import into dedicated source-aware aggregate tables:

- `imported_player_career_aggregates`
- `imported_series_summaries`

This preserves useful current facts without pretending aggregate rows are match scorecards.

## Keys, Slugs, and SEO

Every public entity table has:

- stable UUID primary key
- human-readable name
- SEO-friendly slug where the entity can have a public page

Examples:

- `players.slug` -> `/players/babar-azam`
- `teams.slug` -> `/teams/pakistan`
- `tournaments.slug` -> `/tournaments/icc-cricket-world-cup-2023`
- year routes use explicit date/year columns, not parsed arbitrary strings.

## Security

Supabase RLS is enabled for all public tables.

- Anonymous/authenticated roles can read public cricket facts.
- Anonymous/authenticated roles are not granted insert/update/delete privileges.
- Import batches and import errors are server-only operational tables and have no public read policy.
- Imports should run with service credentials or a trusted server/database connection.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or any `NEXT_PUBLIC_*` variable.

## Indexing

Indexes are added for high-value query paths:

- slugs and names on players/teams/tournaments/venues
- match date, season year, format, tournament, teams
- player and match IDs on stat tables
- aggregate leaderboards for runs and wickets
- imported series by format/year/winner

The schema avoids indexing every column by default.
