import { FoundationPage } from "@/components/ui/FoundationPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Teams",
  description: "Browse the cricket teams foundation, prepared for team profiles, match history, tournament performance, and player rosters.",
  path: "/teams"
});

export default function TeamsPage() {
  return (
    <FoundationPage
      eyebrow="Team directory"
      title="Cricket Teams"
      description="This route is ready for country and team profiles, yearly performance, format-specific records, squads, and match history."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Teams" }
      ]}
    />
  );
}
