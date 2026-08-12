import { FoundationPage } from "@/components/ui/FoundationPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Matches",
  description: "Browse the cricket match archive foundation, prepared for scorecards, venues, teams, formats, and match analytics.",
  path: "/matches"
});

export default function MatchesPage() {
  return (
    <FoundationPage
      eyebrow="Match archive"
      title="Cricket Matches"
      description="This page is prepared for historical scorecards, match filters, result summaries, venue context, and innings-level analysis."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Matches" }
      ]}
    >
      <section className="foundation-grid" aria-label="Match archive modules">
        <article className="planning-card">
          <h2>Scorecards</h2>
          <p>Future match pages can include innings totals, player scorecards, partnerships, phases, and result metadata.</p>
        </article>
        <article className="planning-card">
          <h2>Filters</h2>
          <p>Prepared for filtering by team, format, tournament, venue, year, result type, and player involvement.</p>
        </article>
        <article className="planning-card">
          <h2>Internal Links</h2>
          <p>Match rows can link naturally to players, teams, tournaments, yearly pages, records, and related articles.</p>
        </article>
      </section>
    </FoundationPage>
  );
}
