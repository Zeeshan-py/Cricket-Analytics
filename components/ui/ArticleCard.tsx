import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRightIcon } from "@/components/ui/Icon";
import type { ArticleSummary } from "@/lib/content/articles";

type ArticleCardProps = {
  article: ArticleSummary;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const date = new Date(article.publishedAt);
  const accent = "#136F43";

  return (
    <article className="article-card" style={{ "--card-accent": accent } as CSSProperties}>
      <div className="article-card__image" role="img" aria-label={article.featuredImageAlt ?? `${article.category} article visual`}>
        <span />
        <span />
        <span />
      </div>
      <div className="article-card__body">
        <div className="article-card__meta">
          <Link href={`/articles/category/${article.categorySlug}`}>{article.category}</Link>
          <time dateTime={article.publishedAt}>
            {date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
          </time>
          <span>{article.readingTime}</span>
        </div>
        <h3>
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
        <Link className="text-link" href={`/articles/${article.slug}`}>
          Read Article
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}
