import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";
import { StructuredData } from "@/components/seo/StructuredData";

type PlayerDetailPageProps = {
  params: Promise<{
    playerSlug: string;
  }>;
};

export async function generateMetadata({ params }: PlayerDetailPageProps) {
  const { playerSlug } = await params;
  const playerName = labelFromSlug(playerSlug);

  return createPageMetadata({
    title: `${playerName} Cricket Statistics`,
    description: `Future player profile page for ${playerName}, prepared for batting, bowling, fielding, teams, formats, matches, and yearly statistics.`,
    path: `/players/${playerSlug}`
  });
}

export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const { playerSlug } = await params;
  const playerName = labelFromSlug(playerSlug);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Players", href: "/players" },
    { label: playerName }
  ];

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Players", href: "/players" },
          { label: playerName, href: `/players/${playerSlug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Player profile"
        title={playerName}
        description="This player profile route is prepared for verified biography details, format splits, career totals, match logs, records, and related articles."
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
