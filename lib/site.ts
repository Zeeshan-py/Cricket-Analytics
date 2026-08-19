const productionSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cricatlas.netlify.app").replace(/\/$/, "");

export const siteConfig = {
  name: "Cricket Atlas",
  url: productionSiteUrl,
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
