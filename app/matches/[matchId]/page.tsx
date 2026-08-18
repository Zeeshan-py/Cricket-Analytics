import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import {
  ballsToOvers,
  economyRate,
  formatMatchTitle,
  getMatchById,
  matchResultLabel,
  strikeRate,
  type MatchDetail
} from "@/lib/data/matches";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type MatchDetailPageProps = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BattingRow = MatchDetail["innings"][number]["batting"][number];
type BowlingRow = MatchDetail["innings"][number]["bowling"][number];
type DeliveryRow = MatchDetail["deliveries"][number];

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

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function formatVenue(detail: MatchDetail) {
  const venue = detail.match.venues;
  return [venue?.name, venue?.city, venue?.country].filter(Boolean).join(", ") || "Venue not available";
}

function dismissalText(row: BattingRow) {
  if (!row.dismissed) return "not out";
  const kind = row.dismissal_kind?.replace(/_/g, " ") ?? "out";
  if (row.bowler?.name && row.fielder?.name) return `${kind} b ${row.bowler.name}, c ${row.fielder.name}`;
  if (row.bowler?.name) return `${kind} b ${row.bowler.name}`;
  if (row.fielder?.name) return `${kind} ${row.fielder.name}`;
  return kind;
}

function deliveryWicketText(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "-";
  return `${value.length} wicket${value.length === 1 ? "" : "s"}`;
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

function PlayerLink({ player }: { player: { name: string | null; slug: string | null } | null }) {
  if (!player?.name) return <>-</>;
  return player.slug ? <Link className="table-primary-link" href={`/players/${player.slug}`}>{player.name}</Link> : <>{player.name}</>;
}

export async function generateMetadata({ params }: MatchDetailPageProps) {
  const { matchId } = await params;
  const detail = await getMatchById(matchId);
  if (!detail) {
    notFound();
    throw new Error("Match not found");
  }

  const title = `${formatMatchTitle(detail.match)} - Cricket Match Scorecard`;
  const description = `${formatDate(detail.match.match_date)} scorecard, result, innings, top performers, and ball-by-ball sample from the current Cricket Atlas Supabase dataset.`;

  return createPageMetadata({ title, description, path: `/matches/${matchId}` });
}

export default async function MatchDetailPage({ params, searchParams }: MatchDetailPageProps) {
  const [{ matchId }, query] = await Promise.all([params, searchParams]);
  const deliveryPage = numberParam(query.deliveriesPage);
  const detail = await getMatchById(matchId, { deliveryPage });

  if (!detail) {
    notFound();
    return null;
  }

  const title = formatMatchTitle(detail.match);
  const playerOfMatch = detail.summary.playerOfMatch
    .map((award) => award.players?.name)
    .filter(Boolean)
    .join(", ");
  const topBatting = detail.summary.topBatting;
  const topBowling = detail.summary.topBowling;

  const battingColumns: DataColumn<BattingRow>[] = [
    { key: "batter", header: "Batter", render: (row) => <PlayerLink player={row.player} /> },
    { key: "dismissal", header: "Dismissal", render: (row) => dismissalText(row) },
    { key: "runs", header: "R", align: "right", render: (row) => row.runs },
    { key: "balls", header: "B", align: "right", render: (row) => formatNumber(row.balls_faced) },
    { key: "fours", header: "4s", align: "right", render: (row) => row.fours },
    { key: "sixes", header: "6s", align: "right", render: (row) => row.sixes },
    { key: "strikeRate", header: "SR", align: "right", render: (row) => decimal(strikeRate(row.runs, row.balls_faced)) }
  ];

  const bowlingColumns: DataColumn<BowlingRow>[] = [
    { key: "bowler", header: "Bowler", render: (row) => <PlayerLink player={row.player} /> },
    { key: "overs", header: "Overs", align: "right", render: (row) => ballsToOvers(row.balls) },
    { key: "maidens", header: "M", align: "right", render: (row) => row.maidens },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs_conceded },
    { key: "wickets", header: "Wkts", align: "right", render: (row) => row.wickets },
    { key: "economy", header: "Econ", align: "right", render: (row) => decimal(economyRate(row.runs_conceded, row.balls)) }
  ];

  const deliveryColumns: DataColumn<DeliveryRow>[] = [
    { key: "ball", header: "Ball", render: (row) => row.actual_delivery ?? `${row.over_number}.${row.delivery_index}` },
    { key: "batter", header: "Batter", render: (row) => <PlayerLink player={row.batter} /> },
    { key: "bowler", header: "Bowler", render: (row) => <PlayerLink player={row.bowler} /> },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs_total },
    { key: "extras", header: "Extras", align: "right", render: (row) => row.runs_extras },
    { key: "wickets", header: "Wickets", render: (row) => deliveryWicketText(row.wickets) }
  ];

  const deliveryBase = `/matches/${detail.match.id}`;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Matches", href: "/matches" },
          { label: title, href: `/matches/${detail.match.id}` }
        ])}
      />
      <FoundationPage
        eyebrow="Match scorecard"
        title={title}
        description="Scorecard, result, innings totals, player performances, and a paged ball-by-ball view from the current verified 50-match Cricsheet import."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Matches", href: "/matches" },
          { label: title }
        ]}
      >
        <section className="detail-hero-panel">
          <dl className="detail-facts-grid">
            <div><dt>Date</dt><dd>{formatDate(detail.match.match_date)}</dd></div>
            <div><dt>Format</dt><dd>{detail.match.formats?.slug ? <Link href={`/matches?format=${detail.match.formats.slug}`}>{detail.match.formats.name}</Link> : detail.match.formats?.name ?? "Not available"}</dd></div>
            <div><dt>Tournament</dt><dd>{detail.match.tournaments?.slug ? <Link href={`/tournaments/${detail.match.tournaments.slug}`}>{detail.match.tournaments.name}</Link> : detail.match.tournaments?.name ?? "Not available"}</dd></div>
            <div><dt>Venue</dt><dd>{formatVenue(detail)}</dd></div>
            <div><dt>Result</dt><dd>{matchResultLabel(detail.match)}</dd></div>
            <div><dt>Toss</dt><dd>{detail.match.toss_winner?.name ? `${detail.match.toss_winner.name} chose ${detail.match.toss_decision ?? "unknown"}` : "Not available"}</dd></div>
            <div><dt>Player of Match</dt><dd>{playerOfMatch || "Not available"}</dd></div>
            <div><dt>Season</dt><dd>{detail.match.season_year ? <Link href={`/years/${detail.match.season_year}`}>{detail.match.season_label ?? detail.match.season_year}</Link> : detail.match.season_label ?? "Not available"}</dd></div>
          </dl>
        </section>

        <section className="detail-stat-grid" aria-label="Match summary">
          <StatCard label="Result" value={detail.summary.result ?? "Not available"} />
          <StatCard
            label="Top batting"
            value={topBatting?.player?.name ?? "Not available"}
            note={topBatting ? `${topBatting.runs} (${formatNumber(topBatting.balls_faced)})` : undefined}
          />
          <StatCard
            label="Top bowling"
            value={topBowling?.player?.name ?? "Not available"}
            note={topBowling ? `${topBowling.wickets}/${topBowling.runs_conceded} in ${ballsToOvers(topBowling.balls)}` : undefined}
          />
          <StatCard label="Deliveries stored" value={formatNumber(detail.deliveryPagination.total)} note="Paged below" />
        </section>

        {detail.innings.length ? (
          detail.innings.map((innings) => (
            <section className="scorecard-section" key={innings.id}>
              <div className="scorecard-header">
                <div>
                  <p className="eyebrow">Innings {innings.innings_number}</p>
                  <h2>{innings.batting_team?.name ?? "Batting team"} innings</h2>
                </div>
                <strong>{formatNumber(innings.total_runs)}/{formatNumber(innings.total_wickets)} {innings.overs_text ? `(${innings.overs_text} overs)` : null}</strong>
              </div>
              <div className="scorecard-grid">
                <section>
                  <h3>Batting</h3>
                  {innings.batting.length ? (
                    <DataTable caption={`${innings.batting_team?.name ?? "Team"} batting scorecard.`} columns={battingColumns} data={innings.batting} getRowKey={(row) => row.id} />
                  ) : (
                    <EmptyState title="No batting rows" description="No batting scorecard rows are available for this innings." />
                  )}
                </section>
                <section>
                  <h3>Bowling</h3>
                  {innings.bowling.length ? (
                    <DataTable caption={`${innings.bowling_team?.name ?? "Team"} bowling scorecard.`} columns={bowlingColumns} data={innings.bowling} getRowKey={(row) => row.id} />
                  ) : (
                    <EmptyState title="No bowling rows" description="No bowling scorecard rows are available for this innings." />
                  )}
                </section>
              </div>
            </section>
          ))
        ) : (
          <EmptyState title="No innings data" description="This match has no imported innings rows in the current database." />
        )}

        <section className="profile-section">
          <h2>Ball-by-Ball Sample</h2>
          <details className="delivery-details">
            <summary>Show deliveries page {detail.deliveryPagination.page}</summary>
            {detail.deliveries.length ? (
              <>
                <DataTable caption="Paged deliveries from the imported Cricsheet JSON data." columns={deliveryColumns} data={detail.deliveries} getRowKey={(row) => row.id} />
                <nav className="pagination" aria-label="Delivery pagination">
                  <Link
                    className={detail.deliveryPagination.page <= 1 ? "is-disabled" : undefined}
                    aria-disabled={detail.deliveryPagination.page <= 1}
                    href={`${deliveryBase}?deliveriesPage=${Math.max(1, detail.deliveryPagination.page - 1)}`}
                  >
                    Previous deliveries
                  </Link>
                  <span>Page {detail.deliveryPagination.page} of {detail.deliveryPagination.totalPages}</span>
                  <Link
                    className={detail.deliveryPagination.page >= detail.deliveryPagination.totalPages ? "is-disabled" : undefined}
                    aria-disabled={detail.deliveryPagination.page >= detail.deliveryPagination.totalPages}
                    href={`${deliveryBase}?deliveriesPage=${Math.min(detail.deliveryPagination.totalPages, detail.deliveryPagination.page + 1)}`}
                  >
                    Next deliveries
                  </Link>
                </nav>
              </>
            ) : (
              <EmptyState title="No deliveries on this page" description="Try another deliveries page for this match." />
            )}
          </details>
        </section>
      </FoundationPage>
    </>
  );
}
