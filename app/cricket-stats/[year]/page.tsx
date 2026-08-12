import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type CricketStatsYearPageProps = {
  params: Promise<{
    year: string;
  }>;
};

export async function generateMetadata({ params }: CricketStatsYearPageProps) {
  const { year } = await params;

  return createPageMetadata({
    title: `${year} Cricket Stats`,
    description: `Future SEO page for ${year} cricket stats, prepared for yearly summaries, player leaders, match trends, tournaments, and records.`,
    path: `/cricket-stats/${year}`
  });
}

export default async function CricketStatsYearPage({ params }: CricketStatsYearPageProps) {
  const { year } = await params;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: `${year} Cricket Stats`, href: `/cricket-stats/${year}` }
        ])}
      />
      <FoundationPage
        eyebrow="SEO cricket stats"
        title={`${year} Cricket Stats`}
        description="This future SEO route is prepared for a yearly cricket stats landing page with crawlable summaries, tables, internal links, and structured data."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: `${year} Cricket Stats` }
        ]}
      />
    </>
  );
}
