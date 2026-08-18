import type { MetadataRoute } from "next";
import { getArticleCategories, getArticleSummaries } from "@/lib/content/articles";
import { sitemapStaticRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const MAX_SITEMAP_ROWS_PER_TABLE = 250;

type RouteEntry = {
  path: string;
  lastModified?: Date;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

function entry({ path, lastModified = new Date(), changeFrequency = "weekly", priority = 0.7 }: RouteEntry): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority
  };
}

async function getDatabaseRoutes(): Promise<RouteEntry[]> {
  try {
    const supabase = createServerSupabaseClient();
    const [players, teams, tournaments, matches, years] = await Promise.all([
      supabase.from("players").select("slug,updated_at").order("updated_at", { ascending: false, nullsFirst: false }).limit(MAX_SITEMAP_ROWS_PER_TABLE),
      supabase.from("teams").select("slug,updated_at").order("updated_at", { ascending: false, nullsFirst: false }).limit(MAX_SITEMAP_ROWS_PER_TABLE),
      supabase.from("tournaments").select("slug,updated_at").order("updated_at", { ascending: false, nullsFirst: false }).limit(MAX_SITEMAP_ROWS_PER_TABLE),
      supabase.from("matches").select("id,updated_at").order("match_date", { ascending: false, nullsFirst: false }).limit(MAX_SITEMAP_ROWS_PER_TABLE),
      supabase.from("matches").select("season_year").not("season_year", "is", null).order("season_year", { ascending: false }).limit(1000)
    ]);

    for (const response of [players, teams, tournaments, matches, years]) {
      if (response.error) throw response.error;
    }

    const yearSet = new Set<number>();
    years.data?.forEach((row) => {
      if (typeof row.season_year === "number") yearSet.add(row.season_year);
    });

    return [
      ...((players.data ?? []) as { slug: string; updated_at: string | null }[]).map((row) => ({
        path: `/players/${row.slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.55
      })),
      ...((teams.data ?? []) as { slug: string; updated_at: string | null }[]).map((row) => ({
        path: `/teams/${row.slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.55
      })),
      ...((tournaments.data ?? []) as { slug: string; updated_at: string | null }[]).map((row) => ({
        path: `/tournaments/${row.slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.5
      })),
      ...((matches.data ?? []) as { id: string; updated_at: string | null }[]).map((row) => ({
        path: `/matches/${row.id}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.45
      })),
      ...[...yearSet].slice(0, MAX_SITEMAP_ROWS_PER_TABLE).map((year) => ({
        path: `/years/${year}`,
        changeFrequency: "monthly" as const,
        priority: 0.5
      }))
    ];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, databaseRoutes] = await Promise.all([
    getArticleSummaries(),
    getArticleCategories(),
    getDatabaseRoutes()
  ]);

  const staticEntries = sitemapStaticRoutes.map((route) =>
    entry({
      path: route,
      changeFrequency: route === "/" ? "daily" : "weekly",
      priority: route === "/" ? 1 : 0.75
    })
  );

  const articleEntries = articles.map((article) =>
    entry({
      path: `/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt ?? article.publishedAt),
      changeFrequency: "monthly",
      priority: 0.65
    })
  );

  const categoryEntries = categories.map((category) =>
    entry({
      path: `/articles/category/${category.slug}`,
      changeFrequency: "weekly",
      priority: 0.55
    })
  );

  const seen = new Set<string>();
  return [...staticEntries, ...articleEntries, ...categoryEntries, ...databaseRoutes.map(entry)].filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
