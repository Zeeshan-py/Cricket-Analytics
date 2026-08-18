import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getTeamExplorer } from "@/lib/data/teams";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Teams - Team Statistics & Profiles",
  description: "Browse cricket teams, match counts, results, players, runs, and wickets from the current Cricket Atlas Supabase dataset.",
  path: "/teams"
});

type TeamsPageProps = {
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

function buildHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/teams?${qs}` : "/teams";
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const search = paramValue(params.q)?.trim() ?? "";
  const page = numberParam(params.page);

  try {
    const result = await getTeamExplorer({ search: search || undefined, page });
    const baseParams = { q: search || undefined };

    return (
      <FoundationPage
        eyebrow="Team explorer"
        title="Cricket Teams"
        description="Browse team profiles and current-dataset summaries calculated from imported matches, innings, bowling, players, and memberships."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Teams" }
        ]}
      >
        <section className="explorer-panel" aria-label="Team filters">
          <form className="explorer-filter-form" action="/teams">
            <label>
              <span>Search</span>
              <input name="q" type="search" defaultValue={search} placeholder="Search team, country, or type" />
            </label>
            <button type="submit">Apply</button>
          </form>
          <p>{result.total} teams found in the current verified dataset.</p>
        </section>

        {result.teams.length ? (
          <>
            <section className="team-results-grid" aria-label="Team results">
              {result.teams.map((team) => (
                <article className="team-result-card" key={team.id}>
                  <div>
                    <p className="eyebrow">{[team.country, team.team_type].filter(Boolean).join(" | ") || "Current dataset"}</p>
                    <h2><Link href={`/teams/${team.slug}`}>{team.name}</Link></h2>
                    <p>{team.short_name ?? "Team profile"}</p>
                  </div>
                  <dl>
                    <div><dt>Matches</dt><dd>{formatNumber(team.matches)}</dd></div>
                    <div><dt>Wins</dt><dd>{formatNumber(team.wins)}</dd></div>
                    <div><dt>Players</dt><dd>{formatNumber(team.players)}</dd></div>
                    <div><dt>Runs</dt><dd>{formatNumber(team.runs)}</dd></div>
                    <div><dt>Wickets</dt><dd>{formatNumber(team.wickets)}</dd></div>
                  </dl>
                  <Link className="text-link" href={`/teams/${team.slug}`}>View team profile</Link>
                </article>
              ))}
            </section>

            <nav className="pagination" aria-label="Team pagination">
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
            title="No teams match those filters"
            description="Try a broader team name, country, or team type. The current dataset is intentionally limited to the verified Cricsheet import."
            actionHref="/teams"
            actionLabel="Reset filters"
          />
        )}
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Team explorer"
          title="Cricket Teams"
          description="Supabase configuration is required before team statistics can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Teams" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load team data." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
