import "server-only";
import { cache } from "react";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ARTICLES_DIR = join(process.cwd(), "content", "articles");
const PAGE_SIZE = 9;

export type ArticleFrontmatter = {
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  author: string;
  readingTime: string;
  featuredImage?: string;
  featuredImageAlt?: string;
};

export type Article = ArticleFrontmatter & {
  content: string;
  categorySlug: string;
};

export type ArticleSummary = Omit<Article, "content"> & {
  excerpt: string;
};

export type ArticleCategory = {
  name: string;
  slug: string;
  count: number;
  description: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArray(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  return trimmed
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseFrontmatter(text: string) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Article is missing frontmatter.");

  const raw: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    raw[key] = value.startsWith("[") ? parseArray(value) : value.replace(/^["']|["']$/g, "");
  }

  const required = ["title", "slug", "description", "category", "publishedAt", "author", "readingTime"];
  for (const key of required) {
    if (!raw[key]) throw new Error(`Article is missing ${key}.`);
  }

  const frontmatter: ArticleFrontmatter = {
    title: String(raw.title),
    slug: String(raw.slug),
    description: String(raw.description),
    category: String(raw.category),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    publishedAt: String(raw.publishedAt),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    author: String(raw.author),
    readingTime: String(raw.readingTime),
    featuredImage: raw.featuredImage ? String(raw.featuredImage) : undefined,
    featuredImageAlt: raw.featuredImageAlt ? String(raw.featuredImageAlt) : undefined
  };

  return { frontmatter, content: match[2].trim() };
}

async function getArticleFiles() {
  const entries = await readdir(ARTICLES_DIR);
  return entries.filter((entry) => entry.endsWith(".md")).map((entry) => join(ARTICLES_DIR, entry)).sort();
}

export const getAllArticles = cache(async (): Promise<Article[]> => {
  const files = await getArticleFiles();
  const articles = await Promise.all(
    files.map(async (file) => {
      const text = await readFile(file, "utf8");
      const { frontmatter, content } = parseFrontmatter(text);
      return {
        ...frontmatter,
        content,
        categorySlug: slugify(frontmatter.category)
      };
    })
  );

  return articles.sort((a, b) => {
    const dateCompare = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return dateCompare || a.title.localeCompare(b.title);
  });
});

export async function getArticleSummaries(): Promise<ArticleSummary[]> {
  const articles = await getAllArticles();
  return articles.map(({ content: _content, description, ...article }) => ({
    ...article,
    description,
    excerpt: description
  }));
}

export async function getArticleBySlug(slug: string) {
  const articles = await getAllArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}

export async function getArticlesPage(options: { page?: number; categorySlug?: string; pageSize?: number } = {}) {
  const pageSize = Math.max(1, Math.min(options.pageSize ?? PAGE_SIZE, 24));
  const page = Number.isFinite(options.page) && options.page && options.page > 0 ? Math.floor(options.page) : 1;
  const summaries = await getArticleSummaries();
  const filtered = options.categorySlug ? summaries.filter((article) => article.categorySlug === options.categorySlug) : summaries;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    articles: filtered.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages
  };
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const summaries = await getArticleSummaries();
  const counts = new Map<string, ArticleCategory>();
  summaries.forEach((article) => {
    const current = counts.get(article.categorySlug) ?? {
      name: article.category,
      slug: article.categorySlug,
      count: 0,
      description: `Articles about ${article.category.toLowerCase()} and how cricket data can be interpreted responsibly.`
    };
    current.count += 1;
    counts.set(article.categorySlug, current);
  });
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getArticleCategory(slug: string) {
  const categories = await getArticleCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function searchArticles(query: string, limit = 6): Promise<ArticleSummary[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const summaries = await getArticleSummaries();
  return summaries
    .filter((article) => {
      const haystack = [article.title, article.description, article.category, ...article.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, Math.max(1, Math.min(limit, 10)));
}

export function categorySlug(value: string) {
  return slugify(value);
}
