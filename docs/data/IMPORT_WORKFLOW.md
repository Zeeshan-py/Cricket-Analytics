# Import Workflow

## Commands

Inspect local Cricsheet samples/external directory and supplementary CSVs without touching Supabase:

```bash
pnpm data:inspect
```

Inspect only Cricsheet JSON:

```bash
pnpm data:inspect:cricsheet
```

Dry-run Cricsheet import without touching Supabase:

```bash
pnpm data:import:cricsheet:dry -- --limit=5
```

Import Cricsheet JSON into Supabase:

```bash
pnpm data:import:cricsheet -- --limit=5
```

Import supplementary CSVs into Supabase:

```bash
pnpm data:import
```

Supabase import commands require:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Cricsheet imports read files from:

```text
CRICSHEET_DATA_DIR
```

When `CRICSHEET_DATA_DIR` is not set, the importer uses `data/sample/cricsheet`.

## Current ETL Structure

```text
scripts/import/
  datasetManifest.ts       file-to-format mappings
  parseCricketCsv.ts       CSV parser and normalizers
  parseCricsheetJson.ts    Cricsheet JSON parser and normalizer
  validateCricketData.ts   validation rules
  validateCricsheetData.ts Cricsheet match validation rules
  teamAliases.ts           current team/code alias map
  importCricketCsv.ts      Supabase upsert importer
  importCricsheetJson.ts   Cricsheet JSON dry-run/import command
  inspectDataset.ts        local validation/report command
  inspectCricsheet.ts      Cricsheet-only inspection command
```

## Import Stages

1. Read the raw Cricsheet JSON or supplementary CSV file.
2. Parse rows and preserve source row metadata.
3. Normalize player names, team codes, spans, seasons, numbers, and scores.
4. Validate required fields and impossible values.
5. Upsert stable reference rows:
   - formats
   - teams
   - players
6. Upsert source-aware facts:
   - career aggregates
   - series summaries
7. Record batch status and per-record errors.

## Cricsheet Duplicate Avoidance

- Matches are upserted by `matches.external_id`, which is the Cricsheet file ID.
- Players are upserted by `players.cricsheet_id` when available, otherwise `players.slug`.
- Teams are upserted by `teams.slug`.
- Venues are upserted by `venues.slug`.
- Tournaments are upserted by `tournaments.slug`.
- Innings are upserted by `(match_id, innings_number)`.
- Deliveries are upserted by `(match_id, innings_number, over_number, delivery_index)`.
- Innings-level stat rows are upserted by `(match_id, innings_id, player_id)`.
- Match-level player summaries are upserted by `(match_id, player_id)`.

## Supplementary CSV Duplicate Avoidance

- Players are upserted by `players.slug`.
- Teams are upserted by `teams.slug`.
- Formats are upserted by `formats.code`.
- Career aggregate rows are unique by `(source_file, source_row_number)` and by `(player_id, format_id, statistic_type, source_file)`.
- Series summaries are unique by `(source_file, source_row_number)` and by `(format_id, slug, season_label)`.

## Validation Rules

Current validators check:

- missing player names
- invalid slugs
- invalid/missing spans
- negative numeric statistics
- not-outs exceeding innings
- missing series names
- invalid seasons
- season end earlier than start
- negative match counts

Failed records should be written to `import_errors` with the raw record and a useful message. The importer does not silently insert corrupted rows.

## Future JSON/Excel Imports

Do not replace the current normalized model when richer data arrives. Add source adapters that emit normalized records for:

- teams
- venues
- tournaments
- matches
- match innings
- batting lines
- bowling lines
- fielding lines
- awards

Those adapters should reuse the same validation and upsert principles.
