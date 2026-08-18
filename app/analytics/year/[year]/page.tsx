import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { AnalyticsBarChart } from "@/components/ui/AnalyticsCharts";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getYearAnalytics, type BattingInningsRecord, type BattingLeader, type BowlingInningsRecord, type BowlingLeader } from "@/lib/data/analytics";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type YearAnalyticsPageProps = {
  params: Promise<{ year: string }>;
};

function parseYear(value: string) {
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) && String(year) === value ? year : null;
}

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <article className="detail-stat-card"><p>{label}</p><strong>{value}</strong></article>;
}

export async function generateMetadata({ params }: YearAnalyticsPageProps) {
  const { year: rawYear } = await params;
  const year = parseYear(rawYear);
  if (!year) {
    notFound();
    throw new Error("Year not found");
  }
  const data = await getYearAnalytics(year);
  if (!data || data.counts.matches === 0) {
    notFound();
    throw new Error("Year not found");
  }

  return createPageMetadata({
    title: `${year} Cricket Statistics - Batting, Bowling & Match Analytics`,
    description: `Cricket analytics for ${year}, including matches, teams, runs, wickets, top run scorers, top wicket takers, and result distribution from the current dataset.`,
    path: `/analytics/year/${year}`
  });
}

export default async function YearAnalyticsPage({ params }: YearAnalyticsPageProps) {
  const { year: rawYear } = await params;
  const year = parseYear(rawYear);
  if (!year) {
    notFound();
    return null;
  }
  const data = await getYearAnalytics(year);
  if (!data || data.counts.matches === 0) {
    notFound();
    return null;
  }

  const battingColumns: DataColumn<BattingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs },
    { key: "avg", header: "Avg", align: "right", render: (row) => decimal(row.average) },
    { key: "sr", header: "SR", align: "right", render: (row) => decimal(row.strikeRate) }
  ];
  const bowlingColumns: DataColumn<BowlingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
    { key: "avg", header: "Avg", align: "right", render: (row) => decimal(row.average) },
    { key: "econ", header: "Econ", align: "right", render: (row) => decimal(row.economy) }
  ];
  const scoreColumns: DataColumn<BattingInningsRecord>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.formatName ?? "Format unavailable"}</span></Link> },
    { key: "score", header: "Score", align: "right", render: (row) => row.runs },
    { key: "balls", header: "Balls", align: "right", render: (row) => formatNumber(row.balls) },
    { key: "match", header: "Match", render: (row) => <Link className="text-link" href={`/matches/${row.matchId}`}>View</Link> }
  ];
  const figuresColumns: DataColumn<BowlingInningsRecord>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.formatName ?? "Format unavailable"}</span></Link> },
    { key: "figures", header: "Figures", align: "right", render: (row) => `${row.wickets}/${row.runsConceded}` },
    { key: "overs", header: "Overs", align: "right", render: (row) => row.overs ?? "-" },
    { key: "match", header: "Match", render: (row) => <Link className="text-link" href={`/matches/${row.matchId}`}>View</Link> }
  ];

  return (
    <>
      <StructuredData data={breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: String(year), href: `/analytics/year/${year}` }])} />
      <FoundationPage
        eyebrow="Year analytics"
        title={`${year} Cricket Analytics`}
        description="Batting, bowling, team, and result analytics for this year based only on the currently available Supabase dataset."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: String(year) }]}
      >
        <section className="detail-stat-grid">
          <StatCard label="Matches" value={formatNumber(data.counts.matches)} />
          <StatCard label="Teams" value={formatNumber(data.counts.teams)} />
          <StatCard label="Runs" value={formatNumber(data.counts.runs)} />
          <StatCard label="Wickets" value={formatNumber(data.counts.wickets)} />
        </section>
        <section className="quick-link-row">
          <Link className="button button--secondary" href={`/matches?year=${year}`}>Matches from {year}</Link>
          <Link className="button button--secondary" href={`/years/${year}`}>Year page</Link>
          <Link className="button button--secondary" href="/analytics/batting">Batting analytics</Link>
          <Link className="button button--secondary" href="/analytics/bowling">Bowling analytics</Link>
        </section>
        <section className="analytics-chart-grid">
          <AnalyticsBarChart title="Runs by Player" description="Run leaders in this year." data={data.charts.runsByPlayer} valueLabel="Runs" />
          <AnalyticsBarChart title="Wickets by Player" description="Wicket leaders in this year." data={data.charts.wicketsByPlayer} valueLabel="Wickets" color="#1f6f8b" />
          <AnalyticsBarChart title="Matches by Team" description="Teams represented in this year." data={data.charts.matchesByTeam} valueLabel="Matches" color="#d79a1e" />
          <AnalyticsBarChart title="Results Distribution" description="Match outcomes in this year." data={data.charts.resultDistribution} valueLabel="Matches" color="#8b3a2f" />
        </section>
        <section className="detail-grid">
          <section className="profile-section"><h2>Top Run Scorers</h2>{data.leaders.topRunScorers.length ? <DataTable caption="Run leaders for this year." columns={battingColumns} data={data.leaders.topRunScorers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No batting data" description="No batting rows exist for this year." />}</section>
          <section className="profile-section"><h2>Top Wicket Takers</h2>{data.leaders.topWicketTakers.length ? <DataTable caption="Wicket leaders for this year." columns={bowlingColumns} data={data.leaders.topWicketTakers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No bowling data" description="No bowling rows exist for this year." />}</section>
        </section>
        <section className="detail-grid">
          <section className="profile-section"><h2>Highest Individual Scores</h2>{data.leaders.highestScores.length ? <DataTable caption="Highest batting innings for this year." columns={scoreColumns} data={data.leaders.highestScores} getRowKey={(row) => row.id} /> : <EmptyState title="No scores" description="No individual scores are available for this year." />}</section>
          <section className="profile-section"><h2>Best Bowling Performances</h2>{data.leaders.bestBowling.length ? <DataTable caption="Best bowling figures for this year." columns={figuresColumns} data={data.leaders.bestBowling} getRowKey={(row) => row.id} /> : <EmptyState title="No figures" description="No bowling figures are available for this year." />}</section>
        </section>
      </FoundationPage>
    </>
  );
}
