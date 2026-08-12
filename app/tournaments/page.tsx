import { FormatCard } from "@/components/ui/FormatCard";
import { TournamentCard } from "@/components/ui/TournamentCard";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { formatCards, tournamentCards } from "@/data/mockCricketData";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Tournaments",
  description: "Explore the tournament foundation for World Cups, series, leagues, qualifiers, standings, matches, and tournament records.",
  path: "/tournaments"
});

export default function TournamentsPage() {
  return (
    <FoundationPage
      eyebrow="Tournament hub"
      title="Cricket Tournaments"
      description="Prepared for tournament profiles, standings, match lists, squads, records, winners, and SEO-rich historical pages."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tournaments" }
      ]}
    >
      <div className="explore-grid">
        {formatCards.map((item) => (
          <FormatCard key={item.title} item={item} />
        ))}
        {tournamentCards.map((item) => (
          <TournamentCard key={item.title} item={item} />
        ))}
      </div>
    </FoundationPage>
  );
}
