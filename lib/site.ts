export const siteConfig = {
  name: "Cricket Atlas",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cricketatlas.com",
  defaultTitle: "Cricket Analytics & Statistics",
  titleTemplate: "%s | Cricket Atlas",
  description:
    "Explore cricket players, matches, teams, tournaments, records and data-driven cricket statistics from verified cricket data.",
  tagline: "Explore cricket through data",
  defaultRobots: {
    index: true,
    follow: true
  },
  searchPath: "/search",
  futureIntegrations: {
    analytics: ["Google Analytics 4", "Google Tag Manager", "Google Search Console"],
    advertising: ["Google AdSense"],
    privacy: ["Cookie notices", "Privacy controls", "Consent-mode requirements"]
  },
  futureDynamicRoutes: [
    "/players/:playerSlug",
    "/teams/:teamSlug",
    "/tournaments/:tournamentSlug",
    "/years/:year",
    "/matches/:matchId",
    "/articles/:articleSlug"
  ]
} as const;
