import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type ArticleDetailPageProps = {
  params: Promise<{
    articleSlug: string;
  }>;
};

export async function generateMetadata({ params }: ArticleDetailPageProps) {
  const { articleSlug } = await params;
  const title = labelFromSlug(articleSlug);

  return createPageMetadata({
    title,
    description: `Future cricket article page for ${title}, prepared for long-form SEO content, internal links, featured media, and structured data.`,
    path: `/articles/${articleSlug}`
  });
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { articleSlug } = await params;
  const title = labelFromSlug(articleSlug);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    mainEntityOfPage: `/articles/${articleSlug}`,
    author: {
      "@type": "Organization",
      name: "Cricket Atlas"
    }
  };

  return (
    <>
      <StructuredData data={articleJsonLd} />
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: title, href: `/articles/${articleSlug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Article"
        title={title}
        description="This article route is ready for long-form cricket analysis, featured media, publication metadata, internal links, and future author information."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: title }
        ]}
      />
    </>
  );
}
