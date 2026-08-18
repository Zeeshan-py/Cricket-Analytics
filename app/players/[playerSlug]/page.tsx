import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { getPlayerProfile, type PlayerFormatStats, type PlayerRecentMatch } from "@/lib/data/players";

type PlayerDetailPageProps = {
  params: Promise<{ playerSlug: string }>;
};

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not available";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="profile-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </article>
  );
}
function BarChart({ title, points, metric }: { title: string; points: { label: string; runs: number; wickets: number }[]; metric: "runs" | "wickets" }) {
  const max = Math.max(...points.map((point) => point[metric]), 0);
  if (!points.length || max <= 0) {
    return <EmptyState title={`${title} unavailable`} description="There is not enough current imported data to draw this chart reliably." />;
  }

  return (
    <section className="profile-chart" aria-label={title}>
      <h2>{title}</h2>
      <div className="profile-chart__bars">
        {points.map((point) => {
          const value = point[metric];
          return (
            <div key={`${point.label}-${value}`}>
              <span style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
              <strong>{value}</strong>
              <small>{point.label}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: PlayerDetailPageProps) {
  const { playerSlug } = await params;
  const profile = await getPlayerProfile(playerSlug);
  if (!profile) {
    notFound();
  }

  const title = `${profile.player.name} Cricket Statistics & Career Records`;
  const description = `Verified cricket statistics for ${profile.player.name} from the current Cricket Atlas Supabase dataset, including runs, wickets, formats, and recent match performances.`;

  return createPageMetadata({ title, description, path: `/players/${profile.player.slug}` });
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { playerSlug } = await params;
  const profile = await getPlayerProfile(playerSlug);
  if (!profile) {
    notFound();
    return null;
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Players", href: "/players" },
    { label: profile.player.name }
  ];

  const battingRows = profile.batting ? [profile.batting] : [];
  const bowlingRows = profile.bowling ? [profile.bowling] : [];

  const battingColumns: DataColumn<NonNullable<typeof profile.batting>>[] = [
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches },
    { key: "innings", header: "Innings", align: "right", render: (row) => row.innings },
    { key: "runs", header: "Runs", align: "right", render: (row) => formatNumber(row.runs) },
    { key: "balls", header: "Balls", align: "right", render: (row) => formatNumber(row.balls) },
    { key: "average", header: "Average", align: "right", render: (row) => decimal(row.average) },
    { key: "strikeRate", header: "SR", align: "right", render: (row) => decimal(row.strikeRate) },
    { key: "fifties", header: "50s", align: "right", render: (row) => row.fifties },
    { key: "hundreds", header: "100s", align: "right", render: (row) => row.hundreds },
    { key: "highest", header: "HS", align: "right", render: (row) => formatNumber(row.highestScore) }
  ];

  const bowlingColumns: DataColumn<NonNullable<typeof profile.bowling>>[] = [
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches },
    { key: "innings", header: "Innings", align: "right", render: (row) => row.innings },
    { key: "overs", header: "Overs", align: "right", render: (row) => row.overs ?? "-" },
    { key: "runs", header: "Runs", align: "right", render: (row) => formatNumber(row.runsConceded) },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
    { key: "economy", header: "Econ", align: "right", render: (row) => decimal(row.economy) },
    { key: "average", header: "Average", align: "right", render: (row) => decimal(row.average) },
    { key: "strikeRate", header: "SR", align: "right", render: (row) => decimal(row.strikeRate) },
    { key: "maidens", header: "Maidens", align: "right", render: (row) => row.maidens }
  ];

  const formatColumns: DataColumn<PlayerFormatStats>[] = [
    { key: "format", header: "Format", render: (row) => row.formatName },
    { key: "matches", header: "Matches", align: "right", render: (row) => row.matches },
    { key: "runs", header: "Runs", align: "right", render: (row) => formatNumber(row.runs) },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
    { key: "average", header: "Average", align: "right", render: (row) => decimal(row.battingAverage) },
    { key: "strikeRate", header: "Strike rate", align: "right", render: (row) => decimal(row.strikeRate) }
  ];

  const recentColumns: DataColumn<PlayerRecentMatch>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    {
      key: "opponent",
      header: "Opponent",
      render: (row) => row.opponentSlug ? <Link className="table-primary-link" href={`/teams/${row.opponentSlug}`}>{row.opponentName}</Link> : row.opponentName ?? "-"
    },
    { key: "format", header: "Format", render: (row) => row.formatName ?? "-" },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wickets },
    { key: "result", header: "Result", render: (row) => row.result ?? "-" },
    { key: "match", header: "Match", render: (row) => <Link className="text-link" href={`/matches/${row.matchId}`}>View</Link> }
  ];

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Players", href: "/players" },
          { label: profile.player.name, href: `/players/${profile.player.slug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Player profile"
        title={profile.player.name}
        description="Verified player statistics from the current 50-match Cricsheet import. The page will expand as the full dataset is imported later."
        breadcrumbs={breadcrumbs}
      >
        <section className="player-profile-header">
          {profile.player.image_url ? <img src={profile.player.image_url} alt={profile.player.name} /> : null}
          <div>
            <p className="eyebrow">{profile.player.country ?? profile.player.teams?.name ?? "Current dataset"}</p>
            <h2>{profile.player.name}</h2>
            <dl>
              <div><dt>Team</dt><dd>{profile.player.teams?.slug ? <Link href={`/teams/${profile.player.teams.slug}`}>{profile.player.teams.name}</Link> : profile.player.teams?.name ?? "Not available"}</dd></div>
              <div><dt>Role</dt><dd>{profile.player.role ?? "Not available"}</dd></div>
              <div><dt>Batting</dt><dd>{profile.player.batting_style ?? "Not available"}</dd></div>
              <div><dt>Bowling</dt><dd>{profile.player.bowling_style ?? "Not available"}</dd></div>
              <div><dt>Date of birth</dt><dd>{profile.player.date_of_birth ? formatDate(profile.player.date_of_birth) : "Not available"}</dd></div>
            </dl>
          </div>
        </section>

        <section className="quick-link-row" aria-label="Player analytics links">
          <Link className="button button--secondary" href={`/analytics?player=${profile.player.slug}`}>Analytics</Link>
          <Link className="button button--secondary" href={`/analytics/compare?player1=${profile.player.slug}`}>Compare</Link>
          <Link className="button button--secondary" href="/analytics/batting">Batting leaders</Link>
          <Link className="button button--secondary" href="/analytics/bowling">Bowling leaders</Link>
        </section>

        <section className="profile-stat-grid" aria-label="Career overview">
          <StatCard label="Matches" value={formatNumber(profile.overview.matches)} />
          <StatCard label="Runs" value={formatNumber(profile.overview.runs)} />
          <StatCard label="Wickets" value={formatNumber(profile.overview.wickets)} />
          {profile.overview.battingAverage !== null ? <StatCard label="Batting average" value={decimal(profile.overview.battingAverage)} /> : null}
          {profile.overview.strikeRate !== null ? <StatCard label="Strike rate" value={decimal(profile.overview.strikeRate)} /> : null}
          {profile.overview.highestScore !== null ? <StatCard label="Highest score" value={formatNumber(profile.overview.highestScore)} /> : null}
          {profile.overview.fifties > 0 ? <StatCard label="50s" value={formatNumber(profile.overview.fifties)} /> : null}
          {profile.overview.hundreds > 0 ? <StatCard label="100s" value={formatNumber(profile.overview.hundreds)} /> : null}
        </section>

        <section className="profile-section">
          <h2>Batting Statistics</h2>
          {profile.batting ? <DataTable caption="Batting statistics calculated from imported innings scorecards." columns={battingColumns} data={battingRows} getRowKey={() => "batting"} /> : <EmptyState title="No batting data" description="No batting scorecard rows are available for this player in the current import." />}
        </section>

        <section className="profile-section">
          <h2>Bowling Statistics</h2>
          {profile.bowling ? <DataTable caption="Bowling statistics calculated from imported innings scorecards." columns={bowlingColumns} data={bowlingRows} getRowKey={() => "bowling"} /> : <EmptyState title="No bowling data" description="No bowling scorecard rows are available for this player in the current import." />}
        </section>

        <section className="profile-section">
          <h2>Format Breakdown</h2>
          {profile.formats.length ? <DataTable caption="Format split from current imported player-match rows." columns={formatColumns} data={profile.formats} getRowKey={(row) => row.formatSlug} /> : <EmptyState title="No format split" description="This player has no format-level rows in the current import." />}
        </section>

        <section className="profile-chart-grid">
          <BarChart title="Runs by Match" points={profile.charts.runsByMatch} metric="runs" />
          <BarChart title="Wickets by Match" points={profile.charts.wicketsByMatch} metric="wickets" />
        </section>

        <section className="profile-section">
          <h2>Recent Performances</h2>
          {profile.recentMatches.length ? <DataTable caption="Recent performances from the current imported Cricsheet sample." columns={recentColumns} data={profile.recentMatches} getRowKey={(row) => row.matchId} /> : <EmptyState title="No recent performances" description="No match performance rows are available for this player yet." />}
        </section>
      </FoundationPage>
    </>
  );
}
