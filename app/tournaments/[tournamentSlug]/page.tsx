import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type TournamentDetailPageProps = {
  params: Promise<{
    tournamentSlug: string;
  }>;
};

export async function generateMetadata({ params }: TournamentDetailPageProps) {
  const { tournamentSlug } = await params;
  const tournamentName = labelFromSlug(tournamentSlug);

  return createPageMetadata({
    title: `${tournamentName} Cricket Statistics`,
    description: `Future tournament page for ${tournamentName}, prepared for matches, standings, teams, player leaders, records, and historical analysis.`,
    path: `/tournaments/${tournamentSlug}`
  });
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { tournamentSlug } = await params;
  const tournamentName = labelFromSlug(tournamentSlug);

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Tournaments", href: "/tournaments" },
          { label: tournamentName, href: `/tournaments/${tournamentSlug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Tournament profile"
        title={tournamentName}
        description="This tournament route is ready for schedules, results, standings, squads, tournament leaders, records, and SEO article links."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tournaments", href: "/tournaments" },
          { label: tournamentName }
        ]}
      />
    </>
  );
}
