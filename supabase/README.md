# Supabase PostgreSQL Data Foundation

This folder contains the Phase 2 database foundation for Cricket Analytics.

## Files

- `migrations/202608120001_cricket_core_schema.sql`
  Creates normalized cricket tables, Cricsheet delivery tables, supplementary aggregate tables, indexes, triggers, and RLS policies.
- `seeds/001_reference_formats.sql`
  Inserts stable cricket formats.
- `seeds/002_team_aliases.sql`
  Inserts common international and composite teams observed in the current CSVs.

## Apply Order

1. Create a Supabase project.
2. Run the migration SQL.
3. Run the seed SQL files in order.
4. Set server environment variables for imports and server-side queries:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or any `NEXT_PUBLIC_*` variable.

For the full Cricsheet dataset, set `CRICSHEET_DATA_DIR` to the external extracted directory, for example:

```text
CRICSHEET_DATA_DIR=C:\Users\zeesh\Downloads\all_json
```

Do not copy the full raw dataset into this repository or Supabase Storage. The importer writes normalized rows and selected JSONB source fragments to PostgreSQL only.

## Security Model

All public cricket data tables have RLS enabled. Anonymous and authenticated users can read public cricket facts. Inserts, updates, and deletes are not granted to anonymous or authenticated users.

Imports should run only from trusted server-side tooling using a service role key or direct database connection.
