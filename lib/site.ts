export const siteConfig = {
  name: "Cricket Atlas",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cricketatlas.com",
  description:
    "A public cricket analytics and statistics platform for exploring matches, players, teams, tournaments, yearly trends, and records from verified cricket data.",
  tagline: "Explore cricket through data",
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
