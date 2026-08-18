import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getTournaments } from "@/lib/data/tournaments";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Tournament Statistics",
  description: "Browse tournaments represented in the current Cricket Atlas Supabase dataset, with real match counts, teams, seasons, and formats.",
  path: "/tournaments"
});

type TournamentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback = 1) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not available";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function buildHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/tournaments?${qs}` : "/tournaments";
}

export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const params = await searchParams;
  const search = paramValue(params.q)?.trim() ?? "";
  const format = paramValue(params.format) ?? "";
  const year = numberParam(params.year, 0);
  const page = numberParam(params.page);

  try {
    const result = await getTournaments({
      search: search || undefined,
      formatSlug: format || undefined,
      year: year || undefined,
      page
    });

    const baseParams = {
      q: search || undefined,
      format: format || undefined,
      year: year ? String(year) : undefined
    };

    return (
      <FoundationPage
        eyebrow="Tournament explorer"
        title="Cricket Tournament Statistics"
        description="Explore tournaments and series represented in the current verified Supabase dataset. Counts reflect the imported 50-match Cricsheet sample only."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tournaments" }
        ]}
      >
        <section className="explorer-panel" aria-label="Tournament filters">
          <form className="explorer-filter-form" action="/tournaments">
            <label>
              <span>Search</span>
              <input name="q" type="search" defaultValue={search} placeholder="Tournament, edition, country" />
            </label>
            <label>
              <span>Format</span>
              <select name="format" defaultValue={format}>
                <option value="">All formats</option>
                {result.filters.formats.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Year</span>
              <select name="year" defaultValue={year ? String(year) : ""}>
                <option value="">All years</option>
                {result.filters.years.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>
          <p>{result.total} tournaments found from the currently available dataset.</p>
        </section>

        {result.tournaments.length ? (
          <>
            <section className="entity-grid" aria-label="Tournament results">
              {result.tournaments.map((tournament) => (
                <article className="entity-card" key={tournament.id}>
                  <p className="eyebrow">{tournament.formats?.name ?? "Format unavailable"}</p>
                  <h2><Link href={`/tournaments/${tournament.slug}`}>{tournament.name}</Link></h2>
                  <p>{[tournament.edition, tournament.season_year, tournament.host_country].filter(Boolean).join(" | ") || "Tournament metadata is limited in the current import."}</p>
                  <dl>
                    <div><dt>Matches</dt><dd>{tournament.matchCount}</dd></div>
                    <div><dt>Teams</dt><dd>{tournament.teamsCount}</dd></div>
                    <div><dt>Latest match</dt><dd>{formatDate(tournament.latestMatchDate)}</dd></div>
                  </dl>
                  <Link className="text-link" href={`/tournaments/${tournament.slug}`}>Open tournament</Link>
                </article>
              ))}
            </section>
            <nav className="pagination" aria-label="Tournament pagination">
              <Link
                className={result.page <= 1 ? "is-disabled" : undefined}
                aria-disabled={result.page <= 1}
                href={buildHref({ ...baseParams, page: String(Math.max(1, result.page - 1)) })}
              >
                Previous
              </Link>
              <span>Page {result.page} of {result.totalPages}</span>
              <Link
                className={result.page >= result.totalPages ? "is-disabled" : undefined}
                aria-disabled={result.page >= result.totalPages}
                href={buildHref({ ...baseParams, page: String(Math.min(result.totalPages, result.page + 1)) })}
              >
                Next
              </Link>
            </nav>
          </>
        ) : (
          <EmptyState
            title="No tournaments found"
            description="Try changing the search term, format, or year. Current tournament coverage comes only from the verified 50-match Cricsheet import."
            actionHref="/tournaments"
            actionLabel="Reset filters"
          />
        )}
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Tournament explorer"
          title="Cricket Tournament Statistics"
          description="Supabase configuration is required before tournament data can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tournaments" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load tournament data." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
