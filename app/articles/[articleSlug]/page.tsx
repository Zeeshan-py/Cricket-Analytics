import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { getAllArticles, getArticleBySlug } from "@/lib/content/articles";
import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type ArticleDetailPageProps = {
  params: Promise<{
    articleSlug: string;
  }>;
};

export const dynamicParams = false;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ articleSlug: article.slug }));
}

export async function generateMetadata({ params }: ArticleDetailPageProps) {
  const { articleSlug } = await params;
  const article = await getArticleBySlug(articleSlug);
  if (!article) {
    return createPageMetadata({
      title: "Article Not Found",
      description: "The requested cricket article could not be found.",
      path: `/articles/${articleSlug}`,
      noIndex: true
    });
  }

  return createPageMetadata({
    title: article.title,
    description: article.description,
    path: `/articles/${article.slug}`
  });
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { articleSlug } = await params;
  const article = await getArticleBySlug(articleSlug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    },
    mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`)
  };

  return (
    <>
      <StructuredData data={articleJsonLd} />
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: article.title, href: `/articles/${article.slug}` }
        ])}
      />
      <FoundationPage
        eyebrow={article.category}
        title={article.title}
        description={article.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: article.title }
        ]}
      >
        <article className="article-detail">
          <header className="article-detail__meta">
            <Link href={`/articles/category/${article.categorySlug}`}>{article.category}</Link>
            <time dateTime={article.publishedAt}>Published {formatDate(article.publishedAt)}</time>
            <time dateTime={article.updatedAt ?? article.publishedAt}>Updated {formatDate(article.updatedAt ?? article.publishedAt)}</time>
            <span>{article.readingTime}</span>
            <span>By {article.author}</span>
          </header>
          <MarkdownContent content={article.content} />
          <footer className="article-tags" aria-label="Article tags">
            {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </footer>
        </article>
      </FoundationPage>
    </>
  );
}
