import Link from "next/link";
import type { CSSProperties } from "react";
import type { Article } from "@/data/mockCricketData";
import { ArrowRightIcon } from "@/components/ui/Icon";

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const date = new Date(article.date);

  return (
    <article className="article-card" style={{ "--card-accent": article.accent } as CSSProperties}>
      <div className="article-card__image" role="img" aria-label={article.imageAlt}>
        <span />
        <span />
        <span />
      </div>
      <div className="article-card__body">
        <div className="article-card__meta">
          <span>{article.category}</span>
          <time dateTime={article.date}>
            {date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
          </time>
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
