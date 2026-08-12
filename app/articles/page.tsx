import { ArticleCard } from "@/components/ui/ArticleCard";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getFeaturedArticles } from "@/data/cricketRepository";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Articles",
  description: "Read the cricket articles foundation for SEO-friendly analysis, explainers, records, player stories, and tournament context.",
  path: "/articles"
});

export default async function ArticlesPage() {
  const articles = await getFeaturedArticles();

  return (
    <FoundationPage
      eyebrow="Articles"
      title="Cricket Articles"
      description="The editorial foundation is prepared for article categories, clean slugs, metadata, internal links, and future featured images."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Articles" }
      ]}
    >
      <div className="article-grid">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </FoundationPage>
  );
}
