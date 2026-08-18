import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { StructuredData } from "@/components/seo/StructuredData";
import { getArticleCategories, getArticleCategory, getArticlesPage } from "@/lib/content/articles";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { labelFromSlug } from "@/lib/routes";

type CategoryPageProps = {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamicParams = false;

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback = 1) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildHref(categorySlug: string, page: number) {
  return page > 1 ? `/articles/category/${categorySlug}?page=${page}` : `/articles/category/${categorySlug}`;
}

export async function generateStaticParams() {
  const categories = await getArticleCategories();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const category = await getArticleCategory(categorySlug);
  const title = category ? `${category.name} Articles` : `${labelFromSlug(categorySlug)} Articles`;

  return createPageMetadata({
    title,
    description: category?.description ?? "Cricket article category page.",
    path: `/articles/category/${categorySlug}`,
    noIndex: !category
  });
}

export default async function ArticleCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const category = await getArticleCategory(categorySlug);
  if (!category) notFound();

  const page = numberParam((await searchParams).page);
  const result = await getArticlesPage({ categorySlug, page });

  return (
    <>
      <StructuredData
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: category.name, href: `/articles/category/${category.slug}` }
        ])}
      />
      <FoundationPage
        eyebrow="Article category"
        title={`${category.name} Articles`}
        description={category.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: category.name }
        ]}
      >
        {result.articles.length ? (
          <>
            <div className="article-grid article-grid--listing">
              {result.articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
            </div>
            <nav className="pagination" aria-label="Article category pagination">
              <Link
                className={result.page <= 1 ? "is-disabled" : undefined}
                aria-disabled={result.page <= 1}
                href={buildHref(category.slug, Math.max(1, result.page - 1))}
              >
                Previous
              </Link>
              <span>Page {result.page} of {result.totalPages}</span>
              <Link
                className={result.page >= result.totalPages ? "is-disabled" : undefined}
                aria-disabled={result.page >= result.totalPages}
                href={buildHref(category.slug, Math.min(result.totalPages, result.page + 1))}
              >
                Next
              </Link>
            </nav>
          </>
        ) : (
          <EmptyState title="No articles in this category" description="This category exists, but no published articles are currently assigned to it." actionHref="/articles" actionLabel="View all articles" />
        )}
      </FoundationPage>
    </>
  );
}
