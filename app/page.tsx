import Link from "next/link";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArrowRightIcon } from "@/components/ui/Icon";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getHomepageDiscoveryData } from "@/lib/data/homepage";
import { formatMatchTitle, matchResultLabel, type MatchSummary } from "@/lib/data/matches";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata = createPageMetadata({
  title: "Cricket Analytics, Records, Players & Match Statistics",
  description:
    "Explore real cricket statistics from the current verified Supabase dataset: matches, players, teams, tournaments, yearly trends, analytics, and records.",
  path: "/"
});

function formatNumber(value: number | null | undefined, fallback = "-") {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en") : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function MiniMatch({ match }: { match: MatchSummary }) {
  return (
    <article className="discovery-card discovery-card--compact">
      <p className="eyebrow">{formatDate(match.match_date)}</p>
      <h3>
        <Link href={`/matches/${match.id}`}>{formatMatchTitle(match)}</Link>
      </h3>
      <p>{matchResultLabel(match)}</p>
      <small>{[match.formats?.name, match.tournaments?.name].filter(Boolean).join(" | ") || "Current dataset"}</small>
    </article>
  );
}

export default async function HomePage() {
  try {
    const data = await getHomepageDiscoveryData();
    const summary = data.summary;

    const quickStats = [
      { label: "Matches", value: summary?.counts.matches },
      { label: "Players", value: summary?.counts.players },
      { label: "Teams", value: summary?.counts.teams },
      { label: "Deliveries", value: summary?.counts.deliveries },
      { label: "Runs", value: summary?.counts.runs },
      { label: "Wickets", value: summary?.counts.wickets }
    ];

    const homeJsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      hasPart: [
        { "@type": "WebPage", name: "Players", url: `${siteConfig.url}/players` },
        { "@type": "WebPage", name: "Matches", url: `${siteConfig.url}/matches` },
        { "@type": "WebPage", name: "Teams", url: `${siteConfig.url}/teams` },
        { "@type": "WebPage", name: "Analytics", url: `${siteConfig.url}/analytics` },
        { "@type": "WebPage", name: "Records", url: `${siteConfig.url}/records` }
      ]
    };

    return (
      <>
        <StructuredData data={homeJsonLd} />
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Verified cricket data explorer</p>
              <h1>Explore cricket statistics with context</h1>
              <p>
                Search players, teams, matches, tournaments, years, analytics, and records from the current verified Supabase import.
                The archive is intentionally limited until the full Cricsheet dataset is imported.
              </p>
              <div className="hero-actions" aria-label="Primary actions">
                <Link className="button button--primary" href="/analytics">
                  Explore Analytics
                  <ArrowRightIcon />
                </Link>
                <Link className="button button--secondary" href="/players">
                  Explore Players
                </Link>
              </div>
              <SearchBar
                id="homepage-search"
                variant="hero"
                placeholder="Search players, teams, matches, tournaments, years..."
              />
            </div>

            <div className="hero-dashboard" aria-label="Current dataset summary">
              <div className="dashboard-header">
                <div>
                  <span>Current Supabase dataset</span>
                  <strong>{formatNumber(summary?.counts.matches)} matches</strong>
                </div>
                <span className="status-pill">Verified sample</span>
              </div>
              <div className="score-strip">
                <span>{formatNumber(summary?.counts.players)} players</span>
                <strong>{formatNumber(summary?.counts.deliveries)} balls</strong>
                <span>{formatNumber(summary?.counts.teams)} teams</span>
              </div>
              <div className="mini-table">
                <div>
                  <span>Metric</span>
                  <span>Count</span>
                  <span>Source</span>
                </div>
                <div>
                  <strong>Runs</strong>
                  <span>{formatNumber(summary?.counts.runs)}</span>
                  <span>Scorecards</span>
                </div>
                <div>
                  <strong>Wickets</strong>
                  <span>{formatNumber(summary?.counts.wickets)}</span>
                  <span>Bowling</span>
                </div>
                <div>
                  <strong>Years</strong>
                  <span>{formatNumber(summary?.counts.years)}</span>
                  <span>Matches</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container">
            <SectionHeader
              eyebrow="Quick statistics"
              title="Current dataset at a glance"
              description="These counts come from the live Supabase tables populated by the verified Cricsheet import."
            />
            <div className="stats-grid">
              {quickStats.map((stat, index) => (
                <article className={`stat-card stat-card--${["green", "gold", "blue", "ink"][index % 4]}`} key={stat.label}>
                  <p>{stat.label}</p>
                  <strong>{formatNumber(stat.value)}</strong>
                  <span>Real data</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block section-block--tinted">
          <div className="container">
            <SectionHeader
              eyebrow="Featured players"
              title="Notable performers from the import"
              description="Players are selected from current batting and bowling leaderboards, not from manually curated placeholders."
              actionHref="/players"
              actionLabel="View Players"
            />
            <div className="discovery-grid">
              {data.battingLeaders.slice(0, 3).map((player) => (
                <Link className="discovery-card" href={`/players/${player.playerSlug}`} key={`bat-${player.playerId}`}>
                  <span>Batting</span>
                  <h3>{player.playerName}</h3>
                  <p>{formatNumber(player.runs)} runs across {formatNumber(player.matches)} matches.</p>
                  <strong>{player.teamName ?? "Team unavailable"}</strong>
                </Link>
              ))}
              {data.bowlingLeaders.slice(0, 3).map((player) => (
                <Link className="discovery-card" href={`/players/${player.playerSlug}`} key={`bowl-${player.playerId}`}>
                  <span>Bowling</span>
                  <h3>{player.playerName}</h3>
                  <p>{formatNumber(player.wickets)} wickets, economy {player.economy ?? "-"}.</p>
                  <strong>{player.teamName ?? "Team unavailable"}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container">
            <SectionHeader
              eyebrow="Recent matches"
              title="Latest matches in Supabase"
              description="Match cards link into the real scorecard pages created in earlier phases."
              actionHref="/matches"
              actionLabel="View Matches"
            />
            <div className="discovery-grid discovery-grid--two">
              {data.recentMatches.map((match) => <MiniMatch key={match.id} match={match} />)}
            </div>
          </div>
        </section>

        <section className="section-block section-block--tinted">
          <div className="container">
            <SectionHeader
              eyebrow="Explore"
              title="Browse by tournament and year"
              description="Discovery routes are connected to the current dataset and remain ready for a larger Cricsheet import later."
            />
            <div className="discovery-grid discovery-grid--two">
              <section className="profile-section">
                <h2>Tournaments</h2>
                <div className="compact-list">
                  {data.tournaments.map((tournament) => (
                    <Link href={`/tournaments/${tournament.slug}`} key={tournament.id}>
                      <span>{tournament.name}</span>
                      <strong>{formatNumber(tournament.matchCount)} matches</strong>
                    </Link>
                  ))}
                </div>
              </section>
              <section className="profile-section">
                <h2>Years</h2>
                <div className="year-grid">
                  {data.years.map((year) => (
                    <Link key={year} href={`/years/${year}`}>
                      <span>{year}</span>
                      <strong>Year analytics</strong>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="section-block records-section">
          <div className="container">
            <SectionHeader
              eyebrow="Records"
              title="Records calculated from imported rows"
              description="These are current-dataset records only, not claims about all cricket history."
              actionHref="/records"
              actionLabel="View Records"
            />
            <div className="records-grid">
              {data.records.map((record) => (
                <Link className="record-card" href={record.href} key={`${record.title}-${record.holder}`}>
                  <span>Current dataset</span>
                  <h3>{record.title}</h3>
                  <p>{record.value}</p>
                  <strong>{record.holder}</strong>
                  <small>{record.context}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block section-block--tinted">
          <div className="container">
            <SectionHeader
              eyebrow="Cricket insights"
              title="Latest articles"
              description="Educational guides explain the formulas and context behind the statistics shown across the site."
              actionHref="/articles"
              actionLabel="View Articles"
            />
            <div className="article-grid">
              {data.articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
            </div>
          </div>
        </section>
      </>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <section className="section-block">
          <div className="container">
            <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load the homepage discovery data." />
          </div>
        </section>
      );
    }
    throw error;
  }
}
