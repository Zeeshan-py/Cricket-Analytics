import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type YearDetailPageProps = {
  params: Promise<{
    year: string;
  }>;
};

export async function generateMetadata({ params }: YearDetailPageProps) {
  const { year } = await params;

  return createPageMetadata({
    title: `${year} Cricket Statistics`,
    description: `Future ${year} cricket statistics page, prepared for yearly match totals, player leaders, records, tournaments, and historical analysis.`,
    path: `/years/${year}`
  });
}

export default async function YearDetailPage({ params }: YearDetailPageProps) {
  const { year } = await params;

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: year, href: `/years/${year}` }
        ])}
      />
      <FoundationPage
        eyebrow="Yearly cricket statistics"
        title={`${year} Cricket Statistics`}
        description="This yearly route is ready for annual summaries, match lists, tournament context, top players, records, and future SEO articles."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Years", href: "/years" },
          { label: year }
        ]}
      />
    </>
  );
}
