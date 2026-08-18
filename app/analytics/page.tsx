import Link from "next/link";
import { AnalyticsBarChart } from "@/components/ui/AnalyticsCharts";
import { AnalyticsFilters } from "@/components/ui/AnalyticsFilters";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getAnalyticsOverview, type BattingLeader, type BowlingLeader } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Analytics Dashboard",
  description: "Explore match, batting, bowling, team, format, year, and tournament analytics from the current Cricket Atlas Supabase dataset.",
  path: "/analytics"
});

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="detail-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </article>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const filters = {
    year: numberParam(params.year),
    formatSlug: paramValue(params.format) || undefined,
    teamSlug: paramValue(params.team) || undefined,
    tournamentSlug: paramValue(params.tournament) || undefined,
    playerSlug: paramValue(params.player) || undefined
  };

  try {
    const summary = await getAnalyticsOverview(filters);

    if (!summary) {
      return (
        <FoundationPage eyebrow="Analytics" title="Cricket Analytics" description="No analytics are available for those filters." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics" }]}>
          <EmptyState title="No analytics found" description="Try changing the year, format, team, tournament, or player filter." actionHref="/analytics" actionLabel="Reset analytics filters" />
        </FoundationPage>
      );
    }

    const battingColumns: DataColumn<BattingLeader>[] = [
      { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
      { key: "runs", header: "Runs", align: "right", render: (row) => row.runs },
      { key: "matches", header: "Matches", align: "right", render: (row) => row.matches },
      { key: "highest", header: "HS", align: "right", render: (row) => formatNumber(row.highestScore) }
    ];

    const bowlingColumns: DataColumn<BowlingLeader>[] = [
      { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
      { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
      { key: "overs", header: "Overs", align: "right", render: (row) => row.overs ?? "-" },
      { key: "best", header: "Best", align: "right", render: (row) => row.bestRunsConceded !== null ? `${row.bestWickets}/${row.bestRunsConceded}` : "-" }
    ];

    return (
      <FoundationPage
        eyebrow="Analytics"
        title="Cricket Analytics Dashboard"
        description="A real-data overview of the matches, players, teams, deliveries, scoring, wickets, formats, years, and tournaments currently available in Supabase."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Analytics" }
        ]}
      >
        <AnalyticsFilters action="/analytics" options={summary.filters} values={filters} includePlayer />

        <section className="detail-stat-grid" aria-label="Dataset overview">
          <StatCard label="Matches" value={formatNumber(summary.counts.matches)} />
          <StatCard label="Players" value={formatNumber(summary.counts.players)} />
          <StatCard label="Teams" value={formatNumber(summary.counts.teams)} />
          <StatCard label="Deliveries" value={formatNumber(summary.counts.deliveries)} />
          <StatCard label="Runs" value={formatNumber(summary.counts.runs)} />
          <StatCard label="Wickets" value={formatNumber(summary.counts.wickets)} />
          <StatCard label="Formats" value={formatNumber(summary.counts.formats)} />
          <StatCard label="Years" value={formatNumber(summary.counts.years)} note={`${summary.counts.tournaments} tournaments`} />
        </section>

        <section className="quick-link-row" aria-label="Analytics sections">
          <Link className="button button--secondary" href="/analytics/batting">Batting</Link>
          <Link className="button button--secondary" href="/analytics/bowling">Bowling</Link>
          <Link className="button button--secondary" href="/analytics/teams">Teams</Link>
          <Link className="button button--secondary" href="/analytics/compare">Compare Players</Link>
          <Link className="button button--secondary" href="/records">Records</Link>
        </section>

        <section className="analytics-chart-grid" aria-label="Analytics charts">
          <AnalyticsBarChart title="Runs by Player" description="Top run scorers for the current filter." data={summary.charts.runsByPlayer} valueLabel="Runs" />
          <AnalyticsBarChart title="Wickets by Player" description="Top wicket takers for the current filter." data={summary.charts.wicketsByPlayer} valueLabel="Wickets" color="#1f6f8b" />
          <AnalyticsBarChart title="Matches by Team" description="Most active teams in the current match set." data={summary.charts.matchesByTeam} valueLabel="Matches" color="#d79a1e" />
          <AnalyticsBarChart title="Result Distribution" description="Result labels from imported match rows." data={summary.charts.resultDistribution} valueLabel="Matches" color="#8b3a2f" />
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Top Run Scorers</h2>
            {summary.leaders.topRunScorers.length ? <DataTable caption="Run leaders calculated from batting scorecards." columns={battingColumns} data={summary.leaders.topRunScorers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No batting data" description="No batting rows are available for this filter." />}
          </section>
          <section className="profile-section">
            <h2>Top Wicket Takers</h2>
            {summary.leaders.topWicketTakers.length ? <DataTable caption="Wicket leaders calculated from bowling scorecards." columns={bowlingColumns} data={summary.leaders.topWicketTakers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No bowling data" description="No bowling rows are available for this filter." />}
          </section>
        </section>
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage eyebrow="Analytics" title="Cricket Analytics Dashboard" description="Supabase configuration is required before analytics can be loaded." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics" }]}>
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load analytics." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
