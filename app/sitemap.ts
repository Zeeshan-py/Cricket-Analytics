import type { MetadataRoute } from "next";
import { featuredArticles, recentYears, topPlayers } from "@/data/mockCricketData";
import { sitemapStaticRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = sitemapStaticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8
  })) satisfies MetadataRoute.Sitemap;

  const demoDynamicEntries = [
    ...topPlayers.map((player) => `/players/${player.id}`),
    ...featuredArticles.map((article) => `/articles/${article.slug}`),
    ...recentYears.slice(0, 4).map((year) => `/years/${year}`)
  ].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...demoDynamicEntries];
}
