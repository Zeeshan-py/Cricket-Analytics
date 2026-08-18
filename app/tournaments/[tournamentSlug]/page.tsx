import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { formatMatchTitle, matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { getTournamentDetail, type TournamentDetail } from "@/lib/data/tournaments";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type TournamentDetailPageProps = {
  params: Promise<{ tournamentSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CountRow = TournamentDetail["teams"][number];
type RunLeader = TournamentDetail["topRunScorers"][number];
type WicketLeader = TournamentDetail["topWicketTakers"][number];
type AwardRow = TournamentDetail["awards"][number];

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

function formatDateRange(start: string | null, end: string | null) {
  if (start && end && start !== end) return `${formatDate(start)} to ${formatDate(end)}`;
  if (start) return formatDate(start);
  if (end) return formatDate(end);
  return "Dates not available";
}

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function buildHref(slug: string, page: number) {
  return `/tournaments/${slug}?page=${page}`;
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

export async function generateMetadata({ params }: TournamentDetailPageProps) {
  const { tournamentSlug } = await params;
  const detail = await getTournamentDetail(tournamentSlug);
  if (!detail) {
    notFound();
    throw new Error("Tournament not found");
  }

  return createPageMetadata({
    title: `Cricket Tournament Statistics - ${detail.tournament.name}`,
    description: `${detail.tournament.name} matches, teams, results, player leaders, and player-of-match records from the current Cricket Atlas Supabase dataset.`,
    path: `/tournaments/${detail.tournament.slug}`
  });
}

export default async function TournamentDetailPage({ params, searchParams }: TournamentDetailPageProps) {
  const [{ tournamentSlug }, query] = await Promise.all([params, searchParams]);
  const page = numberParam(query.page);
  const detail = await getTournamentDetail(tournamentSlug, { page });

  if (!detail) {
    notFound();
    return null;
  }

  const teamColumns: DataColumn<CountRow>[] = [
    { key: "name", header: "Team", render: (row) => <Link className="table-primary-link" href={`/teams/${row.slug}`}>{row.name}</Link> },
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

  const resultColumns: DataColumn<TournamentDetail["resultSummary"][number]>[] = [
    { key: "result", header: "Result", render: (row) => row.label },
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches }
  ];

  const awardColumns: DataColumn<AwardRow>[] = [
    { key: "award", header: "Award", render: (row) => row.awardName },
    { key: "player", header: "Player", render: (row) => row.playerSlug ? <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}</Link> : row.playerName ?? "-" },
    { key: "team", header: "Team", render: (row) => row.teamSlug ? <Link className="table-primary-link" href={`/teams/${row.teamSlug}`}>{row.teamName}</Link> : row.teamName ?? "-" },
    { key: "date", header: "Match date", render: (row) => formatDate(row.matchDate) }
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
          { label: "Tournaments", href: "/tournaments" },
          { label: detail.tournament.name, href: `/tournaments/${detail.tournament.slug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Tournament profile"
        title={detail.tournament.name}
        description="Tournament matches, teams, results, and top performers from the current verified Cricsheet import. Coverage reflects only the data currently stored in Supabase."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tournaments", href: "/tournaments" },
          { label: detail.tournament.name }
        ]}
      >
        <section className="detail-hero-panel">
          <dl className="detail-facts-grid">
            <div><dt>Format</dt><dd>{detail.tournament.formats?.slug ? <Link href={`/matches?format=${detail.tournament.formats.slug}`}>{detail.tournament.formats.name}</Link> : detail.tournament.formats?.name ?? "Not available"}</dd></div>
            <div><dt>Season</dt><dd>{detail.tournament.season_year ? <Link href={`/years/${detail.tournament.season_year}`}>{detail.tournament.season_year}</Link> : "Not available"}</dd></div>
            <div><dt>Edition</dt><dd>{detail.tournament.edition ?? "Not available"}</dd></div>
            <div><dt>Dates</dt><dd>{formatDateRange(detail.tournament.start_date, detail.tournament.end_date)}</dd></div>
            <div><dt>Host</dt><dd>{detail.tournament.host_country ?? "Not available"}</dd></div>
          </dl>
        </section>

        <section className="detail-stat-grid" aria-label="Tournament summary">
          <StatCard label="Matches" value={formatNumber(detail.totalMatches)} note="Current dataset only" />
          <StatCard label="Teams" value={formatNumber(detail.teams.length)} />
          <StatCard label="Awards" value={formatNumber(detail.awards.length)} />
          <StatCard label="Results" value={formatNumber(detail.resultSummary.length)} />
        </section>

        <section className="quick-link-row" aria-label="Tournament links">
          <Link className="button button--secondary" href={`/matches?tournament=${detail.tournament.slug}`}>Tournament matches</Link>
          {detail.tournament.season_year ? <Link className="button button--secondary" href={`/years/${detail.tournament.season_year}`}>Year overview</Link> : null}
          <Link className="button button--secondary" href="/players">Players</Link>
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Teams Involved</h2>
            {detail.teams.length ? <DataTable caption="Teams represented in this tournament's imported matches." columns={teamColumns} data={detail.teams} getRowKey={(row) => row.slug} /> : <EmptyState title="No teams" description="No team rows are available for this tournament." />}
          </section>
          <section className="profile-section">
            <h2>Results</h2>
            {detail.resultSummary.length ? <DataTable caption="Tournament result labels from current match rows." columns={resultColumns} data={detail.resultSummary} getRowKey={(row) => row.label} /> : <EmptyState title="No results" description="No result rows are available for this tournament." />}
          </section>
        </section>

        <section className="detail-grid">
          <section className="profile-section">
            <h2>Top Run Scorers</h2>
            {detail.topRunScorers.length ? <DataTable caption="Run leaders from tournament player-match rows." columns={runColumns} data={detail.topRunScorers} getRowKey={(row) => row.slug} /> : <EmptyState title="No batting leaders" description="No batting totals are available for this tournament." />}
          </section>
          <section className="profile-section">
            <h2>Top Wicket Takers</h2>
            {detail.topWicketTakers.length ? <DataTable caption="Wicket leaders from tournament player-match rows." columns={wicketColumns} data={detail.topWicketTakers} getRowKey={(row) => row.slug} /> : <EmptyState title="No bowling leaders" description="No wicket totals are available for this tournament." />}
          </section>
        </section>

        <section className="profile-section">
          <h2>Player of Match Records</h2>
          {detail.awards.length ? <DataTable caption="Awards imported from Cricsheet match metadata." columns={awardColumns} data={detail.awards} getRowKey={(row) => `${row.awardName}-${row.playerSlug ?? row.playerName}-${row.matchDate}`} /> : <EmptyState title="No awards" description="No player-of-match award rows are available for this tournament." />}
        </section>

        <section className="profile-section">
          <h2>Matches</h2>
          {detail.matches.matches.length ? (
            <>
              <DataTable caption="Tournament matches from the current imported dataset." columns={matchColumns} data={detail.matches.matches} getRowKey={(row) => row.id} />
              <nav className="pagination" aria-label="Tournament match pagination">
                <Link
                  className={detail.matches.page <= 1 ? "is-disabled" : undefined}
                  aria-disabled={detail.matches.page <= 1}
                  href={buildHref(detail.tournament.slug, Math.max(1, detail.matches.page - 1))}
                >
                  Previous matches
                </Link>
                <span>Page {detail.matches.page} of {detail.matches.totalPages}</span>
                <Link
                  className={detail.matches.page >= detail.matches.totalPages ? "is-disabled" : undefined}
                  aria-disabled={detail.matches.page >= detail.matches.totalPages}
                  href={buildHref(detail.tournament.slug, Math.min(detail.matches.totalPages, detail.matches.page + 1))}
                >
                  Next matches
                </Link>
              </nav>
            </>
          ) : (
            <EmptyState title="No matches" description="No match rows are available for this tournament." />
          )}
        </section>
      </FoundationPage>
    </>
  );
}
