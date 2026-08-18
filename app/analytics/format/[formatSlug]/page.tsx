import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { AnalyticsBarChart } from "@/components/ui/AnalyticsCharts";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getFormatAnalytics, type BattingLeader, type BowlingLeader } from "@/lib/data/analytics";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type FormatAnalyticsPageProps = {
  params: Promise<{ formatSlug: string }>;
};

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <article className="detail-stat-card"><p>{label}</p><strong>{value}</strong></article>;
}

export async function generateMetadata({ params }: FormatAnalyticsPageProps) {
  const { formatSlug } = await params;
  const data = await getFormatAnalytics(formatSlug);
  if (!data || data.counts.matches === 0) {
    notFound();
    throw new Error("Format not found");
  }
  const formatName = data.filters.formats.find((format) => format.slug === formatSlug)?.name ?? labelFromSlug(formatSlug);

  return createPageMetadata({
    title: `${formatName} Cricket Statistics & Analytics`,
    description: `${formatName} cricket analytics including matches, players, teams, runs, wickets, leaders, and year distribution from the current dataset.`,
    path: `/analytics/format/${formatSlug}`
  });
}

export default async function FormatAnalyticsPage({ params }: FormatAnalyticsPageProps) {
  const { formatSlug } = await params;
  const data = await getFormatAnalytics(formatSlug);
  if (!data || data.counts.matches === 0) {
    notFound();
    return null;
  }
  const formatName = data.filters.formats.find((format) => format.slug === formatSlug)?.name ?? labelFromSlug(formatSlug);

  const battingColumns: DataColumn<BattingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs },
    { key: "highest", header: "HS", align: "right", render: (row) => formatNumber(row.highestScore) },
    { key: "sr", header: "SR", align: "right", render: (row) => decimal(row.strikeRate) }
  ];
  const bowlingColumns: DataColumn<BowlingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
    { key: "best", header: "Best", align: "right", render: (row) => row.bestRunsConceded !== null ? `${row.bestWickets}/${row.bestRunsConceded}` : "-" },
    { key: "econ", header: "Econ", align: "right", render: (row) => decimal(row.economy) }
  ];

  return (
    <>
      <StructuredData data={breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: formatName, href: `/analytics/format/${formatSlug}` }])} />
      <FoundationPage
        eyebrow="Format analytics"
        title={`${formatName} Cricket Analytics`}
        description="Format-specific analytics based on matches currently stored in Supabase. This is not a complete historical format record."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: formatName }]}
      >
        <section className="detail-stat-grid">
          <StatCard label="Matches" value={formatNumber(data.counts.matches)} />
          <StatCard label="Teams" value={formatNumber(data.counts.teams)} />
          <StatCard label="Players" value={formatNumber(data.counts.players)} />
          <StatCard label="Runs" value={formatNumber(data.counts.runs)} />
          <StatCard label="Wickets" value={formatNumber(data.counts.wickets)} />
          <StatCard label="Years" value={formatNumber(data.counts.years)} />
          <StatCard label="Tournaments" value={formatNumber(data.counts.tournaments)} />
          <StatCard label="Deliveries" value={formatNumber(data.counts.deliveries)} />
        </section>
        <section className="quick-link-row">
          <Link className="button button--secondary" href={`/matches?format=${formatSlug}`}>Matches</Link>
          <Link className="button button--secondary" href={`/analytics/batting?format=${formatSlug}`}>Batting</Link>
          <Link className="button button--secondary" href={`/analytics/bowling?format=${formatSlug}`}>Bowling</Link>
          <Link className="button button--secondary" href={`/analytics?format=${formatSlug}`}>Filtered dashboard</Link>
        </section>
        <section className="analytics-chart-grid">
          <AnalyticsBarChart title="Runs by Player" description={`Top run scorers in ${formatName}.`} data={data.charts.runsByPlayer} valueLabel="Runs" />
          <AnalyticsBarChart title="Wickets by Player" description={`Top wicket takers in ${formatName}.`} data={data.charts.wicketsByPlayer} valueLabel="Wickets" color="#1f6f8b" />
          <AnalyticsBarChart title="Year Distribution" description={`Matches by year for ${formatName}.`} data={data.charts.yearDistribution} valueLabel="Matches" color="#d79a1e" />
          <AnalyticsBarChart title="Result Distribution" description="Result labels for this format." data={data.charts.resultDistribution} valueLabel="Matches" color="#8b3a2f" />
        </section>
        <section className="detail-grid">
          <section className="profile-section"><h2>Top Run Scorers</h2>{data.leaders.topRunScorers.length ? <DataTable caption="Format run leaders." columns={battingColumns} data={data.leaders.topRunScorers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No batting data" description="No batting rows exist for this format." />}</section>
          <section className="profile-section"><h2>Top Wicket Takers</h2>{data.leaders.topWicketTakers.length ? <DataTable caption="Format wicket leaders." columns={bowlingColumns} data={data.leaders.topWicketTakers} getRowKey={(row) => row.playerId} /> : <EmptyState title="No bowling data" description="No bowling rows exist for this format." />}</section>
        </section>
      </FoundationPage>
    </>
  );
}
