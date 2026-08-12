import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type RecordDetailPageProps = {
  params: Promise<{
    recordSlug: string;
  }>;
};

export async function generateMetadata({ params }: RecordDetailPageProps) {
  const { recordSlug } = await params;
  const recordTitle = labelFromSlug(recordSlug);

  return createPageMetadata({
    title: `${recordTitle} Cricket Record`,
    description: `Future cricket record page for ${recordTitle}, prepared for verified record values, holders, dates, formats, matches, and historical context.`,
    path: `/records/${recordSlug}`
  });
}

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { recordSlug } = await params;
  const recordTitle = labelFromSlug(recordSlug);

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Records", href: "/records" },
          { label: recordTitle, href: `/records/${recordSlug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Record detail"
        title={recordTitle}
        description="This record page is ready for verified values, holders, match links, tournament context, rankings, and supporting editorial content."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Records", href: "/records" },
          { label: recordTitle }
        ]}
      />
    </>
  );
}
