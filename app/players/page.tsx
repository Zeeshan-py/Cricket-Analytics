import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { createPageMetadata } from "@/lib/seo";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getPlayers } from "@/lib/data/players";

export const metadata = createPageMetadata({
  title: "Cricket Player Statistics",
  description: "Search and browse verified cricket player statistics from the current Cricket Atlas Supabase dataset.",
  path: "/players"
});

type PlayersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback = 1) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function buildHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/players?${qs}` : "/players";
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams;
  const search = paramValue(params.q)?.trim() ?? "";
  const country = paramValue(params.country) ?? "";
  const team = paramValue(params.team) ?? "";
  const format = paramValue(params.format) ?? "";
  const sort = paramValue(params.sort) ?? "runs";
  const page = numberParam(params.page);

  try {
    const result = await getPlayers({
      search: search || undefined,
      country: country || undefined,
      teamSlug: team || undefined,
      formatSlug: format || undefined,
      sort,
      page
    });

    const baseParams = {
      q: search || undefined,
      country: country || undefined,
      team: team || undefined,
      format: format || undefined,
      sort: sort || undefined
    };

    return (
      <FoundationPage
        eyebrow="Player explorer"
        title="Cricket Player Statistics"
        description="Browse players from the currently verified Supabase dataset. These numbers reflect the imported Cricsheet sample only, not complete cricket history."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Players" }
        ]}
      >
        <section className="player-explorer-panel" aria-label="Player filters">
          <form className="player-filter-form" action="/players">
            <label>
              <span>Search</span>
              <input name="q" type="search" defaultValue={search} placeholder="Search player name" />
            </label>
            <label>
              <span>Country</span>
              <select name="country" defaultValue={country}>
                <option value="">All countries</option>
                {result.filters.countries.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Team</span>
              <select name="team" defaultValue={team}>
                <option value="">All teams</option>
                {result.filters.teams.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
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
              <span>Sort</span>
              <select name="sort" defaultValue={sort}>
                <option value="runs">Runs</option>
                <option value="wickets">Wickets</option>
                <option value="matches">Matches</option>
                <option value="strike-rate">Strike rate</option>
                <option value="name">Name</option>
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>
          <p>{result.total} players found from the current verified sample.</p>
        </section>

        {result.players.length > 0 ? (
          <>
            <section className="player-results-grid" aria-label="Player results">
              {result.players.map((player) => (
                <article className="player-result-card" key={player.id}>
                  <div>
                    <p className="eyebrow">{player.country ?? player.teamName ?? "Current dataset"}</p>
                    <h2><Link href={`/players/${player.slug}`}>{player.name}</Link></h2>
                    <p>{[player.role, player.teamName].filter(Boolean).join(" | ") || "Role not available"}</p>
                  </div>
                  <dl>
                    <div><dt>Matches</dt><dd>{formatNumber(player.matches)}</dd></div>
                    <div><dt>Runs</dt><dd>{formatNumber(player.runs)}</dd></div>
                    <div><dt>Wickets</dt><dd>{formatNumber(player.wickets)}</dd></div>
                    <div><dt>Average</dt><dd>{decimal(player.battingAverage)}</dd></div>
                    <div><dt>Strike rate</dt><dd>{decimal(player.strikeRate)}</dd></div>
                  </dl>
                </article>
              ))}
            </section>

            <nav className="pagination" aria-label="Player pagination">
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
            title="No players match those filters"
            description="Try a different search term, country, team, format, or sort option. The current dataset is intentionally limited to the verified 50-match Cricsheet import."
            actionHref="/players"
            actionLabel="Reset filters"
          />
        )}
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Player explorer"
          title="Cricket Player Statistics"
          description="Supabase configuration is required before player statistics can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Players" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load player data." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
