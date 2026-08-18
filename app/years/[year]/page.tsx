import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { formatMatchTitle, matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { getYearSummary, type YearSummary } from "@/lib/data/years";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type YearDetailPageProps = {
  params: Promise<{ year: string }>;
};

type CountRow = { name: string; slug: string; matches: number };
type RunLeader = YearSummary["topRunScorers"][number];
type WicketLeader = YearSummary["topWicketTakers"][number];

function parseYear(value: string) {
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) && String(year) === value ? year : null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not available";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
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

export async function generateMetadata({ params }: YearDetailPageProps) {
  const { year: rawYear } = await params;
  const year = parseYear(rawYear);
  if (!year) {
    notFound();
    throw new Error("Year not found");
  }

  const summary = await getYearSummary(year);
  if (!summary) {
    notFound();
    throw new Error("Year not found");
  }

  return createPageMetadata({
    title: `Cricket Statistics ${year} - Matches & Player Performances`,
    description: `Explore ${year} cricket matches, formats, teams, tournaments, top run scorers, and wicket takers from the current Cricket Atlas dataset.`,
    path: `/years/${year}`
  });
}

export default async function YearDetailPage({ params }: YearDetailPageProps) {
  const { year: rawYear } = await params;
  const year = parseYear(rawYear);
  if (!year) {
    notFound();
    return null;
  }

  const summary = await getYearSummary(year);
  if (!summary) {
    notFound();
    return null;
  }

  const countColumns = (baseHref: string): DataColumn<CountRow>[] => [
    { key: "name", header: "Name", render: (row) => <Link className="table-primary-link" href={`${baseHref}${row.slug}`}>{row.name}</Link> },
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches }
  ];

  const runColumns: DataColumn<RunLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.slug}`}>{row.name}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs }
  ];

  const wicketColumns: DataColumn<WicketLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.slug}`}>{row.name}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets }
  ];

  const resultColumns: DataColumn<YearSummary["resultSummary"][number]>[] = [
    { key: "result", header: "Result", render: (row) => row.label },
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches }
  ];

  const matchColumns: DataColumn<MatchSummary>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.match_date) },
    { key: "match", header: "Match", render: (row) => <Link className="table-primary-link" href={`/matches/${row.id}`}>{formatMatchTitle(row)}<span>{row.formats?.name ?? "Format unavailable"}</span></Link> },
    { key: "result", header: "Result", render: (row) => matchResultLabel(row) }
  ];

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: String(year), href: `/years/${year}` }
        ])}
      />
      <FoundationPage
        eyebrow="Year overview"
        title={`Cricket Statistics ${year}`}
        description="A focused overview of the matches, teams, tournaments, and player performances currently stored in Supabase for this year. This is sample-dataset coverage, not a complete historical record."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: String(year) }
        ]}
      >
        <section className="detail-stat-grid" aria-label="Year summary">
          <StatCard label="Matches" value={formatNumber(summary.totalMatches)} note="Current dataset only" />
          <StatCard label="Formats" value={formatNumber(summary.formats.length)} />
          <StatCard label="Teams" value={formatNumber(summary.teams.length)} />
          <StatCard label="Tournaments" value={formatNumber(summary.tournaments.length)} />
        </section>

        <section className="quick-link-row" aria-label="Year links">
          <Link className="button button--secondary" href={`/matches?year=${year}`}>Matches from {year}</Link>
          <Link className="button button--secondary" href="/players">Players</Link>
          <Link className="button button--secondary" href={`/tournaments?year=${year}`}>Tournaments</Link>
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Formats Represented</h2>
            {summary.formats.length ? <DataTable caption="Formats from matches in this year." columns={countColumns("/matches?format=")} data={summary.formats} getRowKey={(row) => row.slug} /> : <EmptyState title="No formats" description="No format rows are available for this year." />}
          </section>
          <section className="profile-section">
            <h2>Most Active Teams</h2>
            {summary.teams.length ? <DataTable caption="Teams involved in this year's imported matches." columns={countColumns("/teams/")} data={summary.teams} getRowKey={(row) => row.slug} /> : <EmptyState title="No teams" description="No team rows are available for this year." />}
          </section>
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Tournaments Represented</h2>
            {summary.tournaments.length ? <DataTable caption="Tournaments represented in this year's imported matches." columns={countColumns("/tournaments/")} data={summary.tournaments} getRowKey={(row) => row.slug} /> : <EmptyState title="No tournaments" description="No tournament rows are available for this year." />}
          </section>
          <section className="profile-section">
            <h2>Match Results Summary</h2>
            {summary.resultSummary.length ? <DataTable caption="Result labels from current match rows." columns={resultColumns} data={summary.resultSummary} getRowKey={(row) => row.label} /> : <EmptyState title="No result data" description="No result summaries are available for this year." />}
          </section>
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Top Run Scorers</h2>
            {summary.topRunScorers.length ? <DataTable caption="Run leaders from current player-match rows." columns={runColumns} data={summary.topRunScorers} getRowKey={(row) => row.slug} /> : <EmptyState title="No batting leaders" description="No batting totals are available for this year." />}
          </section>
          <section className="profile-section">
            <h2>Top Wicket Takers</h2>
            {summary.topWicketTakers.length ? <DataTable caption="Wicket leaders from current player-match rows." columns={wicketColumns} data={summary.topWicketTakers} getRowKey={(row) => row.slug} /> : <EmptyState title="No bowling leaders" description="No wicket totals are available for this year." />}
          </section>
        </section>

        <section className="profile-section">
          <h2>Matches From {year}</h2>
          {summary.matches.length ? <DataTable caption="Recent matches in this year from the current dataset." columns={matchColumns} data={summary.matches} getRowKey={(row) => row.id} /> : <EmptyState title="No matches" description="No match rows are available for this year." />}
        </section>
      </FoundationPage>
    </>
  );
}
