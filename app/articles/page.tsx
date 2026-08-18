import Link from "next/link";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { StructuredData } from "@/components/seo/StructuredData";
import { getArticleCategories, getArticlesPage } from "@/lib/content/articles";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Articles & Analytics Guides",
  description: "Read practical cricket analytics guides about batting, bowling, player statistics, cricket records, formats, and ball-by-ball data.",
  path: "/articles"
});

type ArticlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback = 1) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildHref(page: number) {
  return page > 1 ? `/articles?page=${page}` : "/articles";
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = numberParam(params.page);
  const [result, categories] = await Promise.all([getArticlesPage({ page }), getArticleCategories()]);

  return (
    <>
      <StructuredData data={breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Articles", href: "/articles" }])} />
      <FoundationPage
        eyebrow="Articles"
        title="Cricket Articles & Analytics Guides"
        description="Human-readable cricket explainers designed to complement the statistics pages with clear formulas, context, and internal links."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Articles" }
        ]}
      >
        <section className="article-taxonomy-bar" aria-label="Article categories">
          {categories.map((category) => (
            <Link href={`/articles/category/${category.slug}`} key={category.slug}>
              {category.name}
              <span>{category.count}</span>
            </Link>
          ))}
        </section>

        {result.articles.length ? (
          <>
            <div className="article-grid article-grid--listing">
              {result.articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
            <nav className="pagination" aria-label="Article pagination">
              <Link
                className={result.page <= 1 ? "is-disabled" : undefined}
                aria-disabled={result.page <= 1}
                href={buildHref(Math.max(1, result.page - 1))}
              >
                Previous
              </Link>
              <span>Page {result.page} of {result.totalPages}</span>
              <Link
                className={result.page >= result.totalPages ? "is-disabled" : undefined}
                aria-disabled={result.page >= result.totalPages}
                href={buildHref(Math.min(result.totalPages, result.page + 1))}
              >
                Next
              </Link>
            </nav>
          </>
        ) : (
          <EmptyState title="No articles yet" description="Article content will appear here when Markdown files are added to the content directory." />
        )}
      </FoundationPage>
    </>
  );
}
