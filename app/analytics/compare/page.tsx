import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getPlayerComparison, type ComparisonPlayer } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Player Comparison",
  description: "Compare two players from the current Cricket Atlas Supabase dataset across batting and bowling metrics.",
  path: "/analytics/compare"
});

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatValue(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString("en") : value.toFixed(2);
  return value ?? "-";
}

function PlayerPanel({ player }: { player: ComparisonPlayer | null }) {
  if (!player) return <EmptyState title="Player not selected" description="Choose a player above to compare available batting and bowling metrics." />;
  return (
    <article className="comparison-panel">
      <p className="eyebrow">{player.teamName ?? "Team unavailable"}</p>
      <h2><Link href={`/players/${player.slug}`}>{player.name}</Link></h2>
      <dl>
        <div><dt>Matches</dt><dd>{formatValue(player.matches)}</dd></div>
        <div><dt>Runs</dt><dd>{formatValue(player.runs)}</dd></div>
        <div><dt>Batting average</dt><dd>{formatValue(player.battingAverage)}</dd></div>
        <div><dt>Strike rate</dt><dd>{formatValue(player.strikeRate)}</dd></div>
        <div><dt>Highest score</dt><dd>{formatValue(player.highestScore)}</dd></div>
        <div><dt>50s</dt><dd>{formatValue(player.fifties)}</dd></div>
        <div><dt>100s</dt><dd>{formatValue(player.hundreds)}</dd></div>
        <div><dt>Wickets</dt><dd>{formatValue(player.wickets)}</dd></div>
        <div><dt>Bowling average</dt><dd>{formatValue(player.bowlingAverage)}</dd></div>
        <div><dt>Economy</dt><dd>{formatValue(player.economy)}</dd></div>
        <div><dt>Best bowling</dt><dd>{formatValue(player.bestBowling)}</dd></div>
      </dl>
    </article>
  );
}

export default async function PlayerComparisonPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const player1 = paramValue(params.player1) || undefined;
  const player2 = paramValue(params.player2) || undefined;
  const comparison = await getPlayerComparison(player1, player2);

  return (
    <FoundationPage
      eyebrow="Player comparison"
      title="Cricket Player Comparison"
      description="Compare two players using the batting and bowling data currently available in Supabase. Missing values mean the metric is unavailable for the selected player in this dataset."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Compare" }]}
    >
      <section className="explorer-panel" aria-label="Comparison selectors">
        <form className="explorer-filter-form comparison-filter-form" action="/analytics/compare">
          <label>
            <span>Player 1</span>
            <select name="player1" defaultValue={player1 ?? ""}>
              <option value="">Choose player</option>
              {comparison.filters.players.map((player) => <option key={player.slug} value={player.slug}>{player.name}</option>)}
            </select>
          </label>
          <label>
            <span>Player 2</span>
            <select name="player2" defaultValue={player2 ?? ""}>
              <option value="">Choose player</option>
              {comparison.filters.players.map((player) => <option key={player.slug} value={player.slug}>{player.name}</option>)}
            </select>
          </label>
          <button type="submit">Compare</button>
        </form>
        <p>Comparison metrics reflect the current imported dataset only.</p>
      </section>

      <section className="comparison-grid" aria-label="Player comparison results">
        <PlayerPanel player={comparison.player1} />
        <PlayerPanel player={comparison.player2} />
      </section>
    </FoundationPage>
  );
}
