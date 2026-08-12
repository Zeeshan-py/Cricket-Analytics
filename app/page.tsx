import Link from "next/link";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { FormatCard } from "@/components/ui/FormatCard";
import { PlayerTable } from "@/components/ui/PlayerTable";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatisticCard } from "@/components/ui/StatisticCard";
import { TournamentCard } from "@/components/ui/TournamentCard";
import { ArrowRightIcon } from "@/components/ui/Icon";
import { StructuredData } from "@/components/seo/StructuredData";
import { getHomepageData } from "@/data/cricketRepository";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Cricket Analytics and Statistics",
  description:
    "Explore public cricket statistics, player performances, matches, tournaments, yearly analytics, records, and cricket articles.",
  path: "/"
});

export default async function HomePage() {
  const data = await getHomepageData();

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    hasPart: [
      { "@type": "WebPage", name: "Players", url: `${siteConfig.url}/players` },
      { "@type": "WebPage", name: "Matches", url: `${siteConfig.url}/matches` },
      { "@type": "WebPage", name: "Records", url: `${siteConfig.url}/records` },
      { "@type": "Blog", name: "Cricket Articles", url: `${siteConfig.url}/articles` }
    ]
  };

  return (
    <>
      <StructuredData data={homeJsonLd} />
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Public cricket analytics foundation</p>
            <h1>Explore cricket through data</h1>
            <p>
              Study historical cricket statistics, player performances, match context, tournaments,
              yearly trends, records, and editorial analysis from one clean public platform.
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <Link className="button button--primary" href="/analytics">
                Explore Statistics
                <ArrowRightIcon />
              </Link>
              <Link className="button button--secondary" href="/players">
                Explore Players
              </Link>
            </div>
            <SearchBar
              id="homepage-search"
              variant="hero"
              placeholder="Search demo foundation by player, team, tournament, match..."
            />
            <p className="demo-note">Demo values and article examples are placeholders until verified datasets are connected.</p>
          </div>

          <div className="hero-dashboard" aria-label="Demo cricket analytics preview">
            <div className="dashboard-header">
              <div>
                <span>Match intelligence</span>
                <strong>Demo board</strong>
              </div>
              <span className="status-pill">Dataset-ready</span>
            </div>
            <div className="score-strip" aria-hidden="true">
              <span>Powerplay</span>
              <strong>Run rate model</strong>
              <span>Death overs</span>
            </div>
            <div className="chart-panel">
              <div className="chart-bars" aria-hidden="true">
                <span style={{ height: "42%" }} />
                <span style={{ height: "64%" }} />
                <span style={{ height: "50%" }} />
                <span style={{ height: "76%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "84%" }} />
              </div>
              <div>
                <p>Yearly trend placeholder</p>
                <strong>Connect source data</strong>
              </div>
            </div>
            <div className="mini-table" aria-hidden="true">
              <div>
                <span>Player</span>
                <span>Format</span>
                <span>Index</span>
              </div>
              <div>
                <strong>Demo profile</strong>
                <span>ODI</span>
                <span>Ready</span>
              </div>
              <div>
                <strong>Demo profile</strong>
                <span>Test</span>
                <span>Ready</span>
              </div>
              <div>
                <strong>Demo profile</strong>
                <span>T20</span>
                <span>Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader
            eyebrow="Quick statistics"
            title="A dataset-ready overview"
            description="These cards are wired to mock data now and can point to real dataset aggregates later."
          />
          <div className="stats-grid">
            {data.quickStats.map((stat) => (
              <StatisticCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--tinted">
        <div className="container">
          <SectionHeader
            eyebrow="Explore cricket"
            title="Browse by format and tournament"
            description="Reusable cards keep the homepage, analytics pages, and tournament pages consistent as the archive grows."
          />
          <div className="explore-grid">
            {data.formatCards.map((item) => (
              <FormatCard key={item.title} item={item} />
            ))}
            {data.tournamentCards.map((item) => (
              <TournamentCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader
            eyebrow="Cricket through the years"
            title="Explore season-by-season trends"
            description="Year pages are prepared for summaries, match lists, records, and historical analysis."
            actionHref="/years"
            actionLabel="View All Years"
          />
          <div className="year-grid">
            {data.recentYears.map((year) => (
              <Link key={year} href={`/years/${year}`}>
                <span>{year}</span>
                <strong>Yearly analytics</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--tinted">
        <div className="container">
          <SectionHeader
            eyebrow="Top players"
            title="Player performance table"
            description="A reusable data table pattern for future sortable, filterable, dataset-backed rankings."
            actionHref="/players"
            actionLabel="View All Players"
          />
          <PlayerTable players={data.topPlayers} />
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader
            eyebrow="Featured articles"
            title="Editorial foundation for cricket SEO"
            description="Article cards support category labels, dates, excerpts, and featured visual areas for future long-form content."
            actionHref="/articles"
            actionLabel="View Articles"
          />
          <div className="article-grid">
            {data.featuredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block records-section">
        <div className="container">
          <SectionHeader
            eyebrow="Popular records"
            title="Major record pages prepared"
            description="Record cards are ready for verified leaders, values, formats, and internal links."
            actionHref="/records"
            actionLabel="View Records"
          />
          <div className="records-grid">
            {data.popularRecords.map((record) => (
              <Link className="record-card" href={record.href} key={record.title}>
                <span>{record.format}</span>
                <h3>{record.title}</h3>
                <p>{record.value}</p>
                <strong>{record.holder}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
