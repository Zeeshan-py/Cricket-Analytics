import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { formatMatchTitle, getMatches, matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Matches - Match Statistics & Results",
  description: "Browse real cricket matches, results, scorecards, teams, tournaments, years, formats, and venues from the current Cricket Atlas Supabase dataset.",
  path: "/matches"
});

type MatchesPageProps = {
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

function formatVenue(match: MatchSummary) {
  return [match.venues?.name, match.venues?.city, match.venues?.country].filter(Boolean).join(", ") || "Venue not available";
}

function buildHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/matches?${qs}` : "/matches";
}

function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <article className="match-card">
      <div className="match-card__main">
        <div className="match-card__meta">
          <span>{formatDate(match.match_date)}</span>
          {match.formats?.slug ? <Link href={`/matches?format=${match.formats.slug}`}>{match.formats.name}</Link> : <span>{match.formats?.name ?? "Format unavailable"}</span>}
          {match.season_year ? <Link href={`/years/${match.season_year}`}>{match.season_year}</Link> : null}
        </div>
        <h2>
          <Link href={`/matches/${match.id}`}>{formatMatchTitle(match)}</Link>
        </h2>
        <p>{matchResultLabel(match)}</p>
      </div>
      <dl className="match-card__facts">
        <div>
          <dt>Teams</dt>
          <dd>
            {match.team_1?.slug ? <Link href={`/teams/${match.team_1.slug}`}>{match.team_1.name}</Link> : match.team_1?.name ?? "Team 1"}
            {" vs "}
            {match.team_2?.slug ? <Link href={`/teams/${match.team_2.slug}`}>{match.team_2.name}</Link> : match.team_2?.name ?? "Team 2"}
          </dd>
        </div>
        <div>
          <dt>Tournament</dt>
          <dd>{match.tournaments?.slug ? <Link href={`/tournaments/${match.tournaments.slug}`}>{match.tournaments.name}</Link> : match.tournaments?.name ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Venue</dt>
          <dd>{formatVenue(match)}</dd>
        </div>
      </dl>
      <Link className="text-link" href={`/matches/${match.id}`}>View scorecard</Link>
    </article>
  );
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const params = await searchParams;
  const search = paramValue(params.q)?.trim() ?? "";
  const format = paramValue(params.format) ?? "";
  const year = numberParam(params.year, 0);
  const team = paramValue(params.team) ?? "";
  const tournament = paramValue(params.tournament) ?? "";
  const winner = paramValue(params.winner) ?? "";
  const sort = paramValue(params.sort) === "date-asc" ? "date-asc" : "date-desc";
  const page = numberParam(params.page);

  try {
    const result = await getMatches({
      search: search || undefined,
      formatSlug: format || undefined,
      year: year || undefined,
      teamSlug: team || undefined,
      tournamentSlug: tournament || undefined,
      winnerSlug: winner || undefined,
      sort,
      page
    });

    const baseParams = {
      q: search || undefined,
      format: format || undefined,
      year: year ? String(year) : undefined,
      team: team || undefined,
      tournament: tournament || undefined,
      winner: winner || undefined,
      sort
    };

    return (
      <FoundationPage
        eyebrow="Match explorer"
        title="Cricket Matches"
        description="Explore match results and scorecards from the current verified Cricsheet sample in Supabase. The archive is intentionally limited until the full dataset is imported."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Matches" }
        ]}
      >
        <section className="explorer-panel" aria-label="Match filters">
          <form className="explorer-filter-form explorer-filter-form--matches" action="/matches">
            <label>
              <span>Search</span>
              <input name="q" type="search" defaultValue={search} placeholder="Team, venue, result, ID" />
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
              <span>Tournament</span>
              <select name="tournament" defaultValue={tournament}>
                <option value="">All tournaments</option>
                {result.filters.tournaments.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Winner</span>
              <select name="winner" defaultValue={winner}>
                <option value="">Any result</option>
                {result.filters.teams.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select name="sort" defaultValue={sort}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
              </select>
            </label>
            <button type="submit">Apply</button>
          </form>
          <p>{result.total} matches found from the currently available dataset.</p>
        </section>

        {result.matches.length > 0 ? (
          <>
            <section className="match-results-list" aria-label="Match results">
              {result.matches.map((match) => <MatchCard key={match.id} match={match} />)}
            </section>
            <nav className="pagination" aria-label="Match pagination">
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
            title="No matches found"
            description="Try changing the search term, format, year, team, tournament, winner, or sort filters. Current data comes only from the verified 50-match Cricsheet import."
            actionHref="/matches"
            actionLabel="Reset filters"
          />
        )}
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Match explorer"
          title="Cricket Matches"
          description="Supabase configuration is required before matches can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Matches" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load match data." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
