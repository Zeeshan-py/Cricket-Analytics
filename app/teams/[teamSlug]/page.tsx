import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type TeamDetailPageProps = {
  params: Promise<{
    teamSlug: string;
  }>;
};

export async function generateMetadata({ params }: TeamDetailPageProps) {
  const { teamSlug } = await params;
  const teamName = labelFromSlug(teamSlug);

  return createPageMetadata({
    title: `${teamName} Cricket Team Statistics`,
    description: `Future team page for ${teamName}, prepared for match history, player rosters, tournament records, format performance, and yearly analytics.`,
    path: `/teams/${teamSlug}`
  });
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamSlug } = await params;
  const teamName = labelFromSlug(teamSlug);

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
        description="This team route is ready for team summaries, matches, squads, tournament histories, records, and internal links."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Teams", href: "/teams" },
          { label: teamName }
        ]}
      />
    </>
  );
}
