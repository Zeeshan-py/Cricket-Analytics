export type RouteItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: RouteItem[] = [
  { label: "Home", href: "/" },
  { label: "Analytics", href: "/analytics" },
  { label: "Articles", href: "/articles" }
];

export const exploreNav: RouteItem[] = [
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Teams", href: "/teams" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Years", href: "/years" },
  { label: "Records", href: "/records" }
];

export const footerGroups: { title: string; links: RouteItem[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Players", href: "/players" },
      { label: "Matches", href: "/matches" },
      { label: "Teams", href: "/teams" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Years", href: "/years" },
      { label: "Articles", href: "/articles" },
      { label: "Search", href: "/search" }
    ]
  },
  {
    title: "Analytics",
    links: [
      { label: "Overview", href: "/analytics" },
      { label: "Batting", href: "/analytics/batting" },
      { label: "Bowling", href: "/analytics/bowling" },
      { label: "Teams", href: "/analytics/teams" },
      { label: "Compare Players", href: "/analytics/compare" },
      { label: "Records", href: "/records" }
    ]
  },
  {
    title: "Formats",
    links: [
      { label: "ODI Stats", href: "/analytics?format=odi" },
      { label: "Test Stats", href: "/analytics?format=test" },
      { label: "T20 Stats", href: "/analytics?format=t20" }
    ]
  }
];

export const sitemapStaticRoutes = [
  ...primaryNav.map((item) => item.href),
  ...exploreNav.map((item) => item.href),
  "/analytics/batting",
  "/analytics/bowling",
  "/analytics/teams",
  "/analytics/compare",
  "/search"
];

export function labelFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
