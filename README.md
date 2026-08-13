# Cricket-Analytics

Phase 1 foundation for a public cricket analytics and statistics website.

## What is included

- SEO-first Next.js App Router structure
- Public routes for matches, players, teams, tournaments, years, analytics, records, articles, and search
- Future dynamic route foundations for entity detail pages
- Reusable UI components for navigation, stats, cards, tables, breadcrumbs, empty/loading states, and structured data
- Mock data isolated behind a repository layer so real datasets can replace it later
- Robots and sitemap route handlers ready for search engine discovery
- Supabase PostgreSQL schema, seed files, ETL scaffolding, validation, and server-side data-access layer for Phase 2

## Local development

```bash
pnpm install
pnpm dev
```

Set `NEXT_PUBLIC_SITE_URL` when deploying so canonical URLs and sitemap entries use the production domain.

## Data foundation

Phase 2 data architecture lives in:

- `supabase/migrations/`
- `supabase/seeds/`
- `scripts/import/`
- `lib/data/`
- `docs/data/`

Run local dataset inspection with:

```bash
pnpm data:inspect
```

Dry-run the primary Cricsheet importer against sample files or `CRICSHEET_DATA_DIR`:

```bash
pnpm data:import:cricsheet:dry -- --limit=5
```

Verify Supabase connectivity and public read access:

```bash
pnpm db:health
```
