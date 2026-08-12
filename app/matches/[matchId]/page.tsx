import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type MatchDetailPageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function generateMetadata({ params }: MatchDetailPageProps) {
  const { matchId } = await params;

  return createPageMetadata({
    title: `Cricket Match ${matchId}`,
    description: `Future scorecard and analytics page for cricket match ${matchId}, prepared for innings, players, teams, venue, result, and related records.`,
    path: `/matches/${matchId}`
  });
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Matches", href: "/matches" },
          { label: `Match ${matchId}`, href: `/matches/${matchId}` }
        ])}
      />
      <FoundationPage
        eyebrow="Match scorecard"
        title={`Cricket Match ${matchId}`}
        description="This match route is ready for scorecards, innings summaries, player performances, venue context, result metadata, and related records."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Matches", href: "/matches" },
          { label: `Match ${matchId}` }
        ]}
      />
    </>
  );
}
