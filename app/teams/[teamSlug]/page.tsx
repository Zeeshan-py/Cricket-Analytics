import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { formatMatchTitle, matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { getTeamBySlug, getTeamProfile } from "@/lib/data/teams";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type TeamDetailPageProps = {
  params: Promise<{
    teamSlug: string;
  }>;
};

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}%` : "-";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function MatchList({ matches }: { matches: MatchSummary[] }) {
  if (!matches.length) return <EmptyState title="No recent matches" description="No matches are available for this team in the current import." />;

  return (
    <div className="compact-list">
      {matches.map((match) => (
        <Link href={`/matches/${match.id}`} key={match.id}>
          <span>{formatMatchTitle(match)}</span>
          <strong>{formatDate(match.match_date)} | {matchResultLabel(match)}</strong>
        </Link>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: TeamDetailPageProps) {
  const { teamSlug } = await params;
  const team = await getTeamBySlug(teamSlug);
  const teamName = team?.name ?? labelFromSlug(teamSlug);

  return createPageMetadata({
    title: `${teamName} Cricket Team Statistics`,
    description: `Explore ${teamName} team statistics, matches, results, players, runs, wickets, and recent scorecards from the current verified dataset.`,
    path: `/teams/${teamSlug}`
  });
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamSlug } = await params;

  try {
    const profile = await getTeamProfile(teamSlug);
    if (!profile) notFound();

    const teamName = profile.team.name;
    const stats = [
      { label: "Matches", value: formatNumber(profile.summary.matches) },
      { label: "Wins", value: formatNumber(profile.summary.wins) },
      { label: "Losses", value: formatNumber(profile.summary.losses) },
      { label: "Other results", value: formatNumber(profile.summary.drawsNoResults) },
      { label: "Win rate", value: formatPercent(profile.summary.winPercentage) },
      { label: "Players", value: formatNumber(profile.summary.players) },
      { label: "Runs", value: formatNumber(profile.summary.runs) },
      { label: "Wickets", value: formatNumber(profile.summary.wickets) }
    ];

    return (
      <>
        <StructuredData
          data={breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: "Teams", href: "/teams" },
            { label: teamName, href: `/teams/${teamSlug}` }
          ])}
        />
        <FoundationPage
          eyebrow="Team profile"
          title={teamName}
          description="Team summaries are calculated from real matches, innings, player memberships, batting, and bowling rows in the current Supabase dataset."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Teams", href: "/teams" },
            { label: teamName }
          ]}
        >
          <section className="team-profile-header">
            <div>
              <p className="eyebrow">{[profile.team.country, profile.team.team_type].filter(Boolean).join(" | ") || "Current dataset"}</p>
              <h2>{profile.team.short_name ?? profile.team.name}</h2>
              <p>The figures below reflect only the imported and verified Cricsheet sample currently available in Supabase.</p>
            </div>
            <Link className="button button--secondary" href={`/analytics?team=${profile.team.slug}`}>View analytics</Link>
          </section>

          <section className="detail-stat-grid" aria-label={`${teamName} summary`}>
            {stats.map((stat) => (
              <article className="detail-stat-card" key={stat.label}>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section className="detail-grid">
            <section className="profile-section">
              <h2>Top Run Scorers</h2>
              {profile.topRunScorers.length ? (
                <div className="compact-list">
                  {profile.topRunScorers.map((player) => (
                    <Link href={`/players/${player.playerSlug}`} key={player.playerId}>
                      <span>{player.playerName}</span>
                      <strong>{formatNumber(player.runs)} runs</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No batting leaders" description="No batting rows are available for this team yet." />
              )}
            </section>

            <section className="profile-section">
              <h2>Top Wicket Takers</h2>
              {profile.topWicketTakers.length ? (
                <div className="compact-list">
                  {profile.topWicketTakers.map((player) => (
                    <Link href={`/players/${player.playerSlug}`} key={player.playerId}>
                      <span>{player.playerName}</span>
                      <strong>{formatNumber(player.wickets)} wickets</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No bowling leaders" description="No bowling rows are available for this team yet." />
              )}
            </section>
          </section>

          <section className="profile-section">
            <h2>Recent Matches</h2>
            <MatchList matches={profile.recentMatches} />
          </section>

          <section className="profile-section">
            <h2>Players</h2>
            {profile.players.length ? (
              <div className="player-chip-grid">
                {profile.players.map((player) => (
                  <Link href={`/players/${player.slug}`} key={player.id}>
                    <span>{player.name}</span>
                    <strong>{[player.role, player.country].filter(Boolean).join(" | ") || "Player profile"}</strong>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No linked players" description="No player memberships are available for this team in the current dataset." />
            )}
          </section>
        </FoundationPage>
      </>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Team profile"
          title={labelFromSlug(teamSlug)}
          description="Supabase configuration is required before team statistics can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Teams", href: "/teams" }, { label: labelFromSlug(teamSlug) }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load team data." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
