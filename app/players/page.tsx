import { PlayerCard } from "@/components/ui/PlayerCard";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getTopPlayers } from "@/data/cricketRepository";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Players",
  description: "Explore the player directory foundation for batting, bowling, fielding, roles, teams, formats, and historical performance pages.",
  path: "/players"
});

export default async function PlayersPage() {
  const players = await getTopPlayers();

  return (
    <FoundationPage
      eyebrow="Player directory"
      title="Cricket Players"
      description="A public player index ready for search, filters, profile pages, format splits, team histories, and comparison tools."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Players" }
      ]}
    >
      <div className="page-section-heading">
        <h2>Demo player cards</h2>
        <p>These examples use mock values and prove the reusable player-card component before real dataset integration.</p>
      </div>
      <div className="player-grid">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </FoundationPage>
  );
}
