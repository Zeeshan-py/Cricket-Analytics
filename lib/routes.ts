export type RouteItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNav: RouteItem[] = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Years", href: "/years" },
  { label: "Analytics", href: "/analytics" },
  { label: "Records", href: "/records" },
  { label: "Articles", href: "/articles" }
];

export const footerGroups: { title: string; links: RouteItem[] }[] = [
  {
    title: "Main",
    links: primaryNav.filter((item) => item.href !== "/")
  },
  {
    title: "Cricket Sections",
    links: [
      { label: "ODI Stats", href: "/analytics?format=odi" },
      { label: "Test Stats", href: "/analytics?format=test" },
      { label: "T20 Stats", href: "/analytics?format=t20" },
      { label: "World Cup", href: "/tournaments/world-cup" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/articles/about-cricket-atlas" },
      { label: "Contact", href: "/articles/contact" },
      { label: "Privacy Policy", href: "/articles/privacy-policy" },
      { label: "Terms", href: "/articles/terms" },
      { label: "Disclaimer", href: "/articles/disclaimer" }
    ]
  }
];

export const sitemapStaticRoutes = [
  ...primaryNav.map((item) => item.href),
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
