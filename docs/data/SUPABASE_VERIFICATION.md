# Supabase Phase 3 Verification

Phase 3 connects the local project to the hosted Supabase project and verifies the schema/read layer. It does not deploy the website, import the full Cricsheet dataset, or upload raw JSON files to Supabase Storage.

## Local Environment

The app reads public Supabase configuration from:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The local `.env.local` file contains the hosted project URL and publishable key. `SUPABASE_SERVICE_ROLE_KEY` is intentionally blank for this phase. Service-role keys must stay server-only and must never use a `NEXT_PUBLIC_*` name.

## Health Check

Run:

```bash
pnpm db:health
```

The health check:

- loads `.env.local`
- verifies the Supabase project ref from the URL
- checks that the configured key is not a secret/service-role key
- verifies expected public tables are readable through RLS
- verifies reference formats exist
- calls the existing data-access functions in `lib/data`

The publishable key can verify public read surfaces, but it cannot inspect PostgreSQL catalog details such as every constraint, index, and policy definition.

## Migration Deployment

The Supabase CLI is the normal path for migration deployment from this repository. It is not currently installed in this workspace.

Required credentials/configuration:

- Supabase project ref: `lciqgzfnwrnmwxadiyom`
- Supabase CLI installed and authenticated with `supabase login`, or a remote Postgres connection string
- Remote database password or a credentialed `--db-url`

CLI migration path:

```bash
supabase login
supabase link --project-ref lciqgzfnwrnmwxadiyom
supabase db push --dry-run
supabase db push
```

If you prefer not to link the project, use a percent-encoded Postgres connection string:

```bash
supabase db push --db-url "postgresql://postgres:<password>@db.lciqgzfnwrnmwxadiyom.supabase.co:5432/postgres" --dry-run
supabase db push --db-url "postgresql://postgres:<password>@db.lciqgzfnwrnmwxadiyom.supabase.co:5432/postgres"
```

The migration file is:

```text
supabase/migrations/202608120001_cricket_core_schema.sql
```

Seed/reference files are:

```text
supabase/seeds/001_reference_formats.sql
supabase/seeds/002_team_aliases.sql
```

For the current repo layout, apply those seed files after the migration through the Supabase SQL editor or a privileged Postgres client:

```bash
psql "postgresql://postgres:<password>@db.lciqgzfnwrnmwxadiyom.supabase.co:5432/postgres" -f supabase/seeds/001_reference_formats.sql -f supabase/seeds/002_team_aliases.sql
```

`supabase db push --include-seed` only applies seed files when `supabase/config.toml` has `[db.seed].sql_paths` configured for these files.

## Catalog Verification

After applying the migration, run the read-only SQL in:

```text
scripts/health/verifySupabaseSchema.sql
```

Use the Supabase SQL editor or any privileged Postgres session. It reports expected tables, RLS enablement, policies, constraints, and indexes.
