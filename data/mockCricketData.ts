export type Statistic = {
  label: string;
  value: string;
  description: string;
  tone: "green" | "gold" | "blue" | "ink";
};

export type ExploreCard = {
  title: string;
  href: string;
  label: string;
  description: string;
  accent: string;
};

export type Player = {
  id: string;
  name: string;
  country: string;
  matches: number;
  runs: number;
  wickets: number;
  average: string;
  role: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  imageAlt: string;
  accent: string;
};

export type RecordItem = {
  title: string;
  format: string;
  value: string;
  holder: string;
  href: string;
};

export const quickStats: Statistic[] = [
  {
    label: "Total Matches",
    value: "Demo",
    description: "Dataset count placeholder",
    tone: "green"
  },
  {
    label: "Total Players",
    value: "Demo",
    description: "Player index placeholder",
    tone: "gold"
  },
  {
    label: "Total Teams",
    value: "Demo",
    description: "Team directory placeholder",
    tone: "blue"
  },
  {
    label: "Years Covered",
    value: "Demo",
    description: "Historical range placeholder",
    tone: "ink"
  }
];

export const formatCards: ExploreCard[] = [
  {
    title: "ODI",
    href: "/analytics?format=odi",
    label: "Format",
    description: "Compare innings patterns, run rates, batting depth, and bowling impact in one-day cricket.",
    accent: "#136F43"
  },
  {
    title: "Test",
    href: "/analytics?format=test",
    label: "Format",
    description: "Explore long-form cricket trends across sessions, venues, partnerships, and match results.",
    accent: "#10201A"
  },
  {
    title: "T20",
    href: "/analytics?format=t20",
    label: "Format",
    description: "Track scoring surges, strike rates, powerplay patterns, and death-over performance.",
    accent: "#1F6F8B"
  }
];

export const tournamentCards: ExploreCard[] = [
  {
    title: "World Cup",
    href: "/tournaments/world-cup",
    label: "Tournament",
    description: "Prepare for tournament histories, knockout records, country performance, and venue trends.",
    accent: "#D79A1E"
  },
  {
    title: "Other Tournaments",
    href: "/tournaments",
    label: "Collection",
    description: "A future home for bilateral series, domestic leagues, continental events, and qualifiers.",
    accent: "#8B3A2F"
  }
];

export const recentYears = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

export const topPlayers: Player[] = [
  {
    id: "ayaan-malik",
    name: "Ayaan Malik",
    country: "Pakistan",
    matches: 42,
    runs: 1830,
    wickets: 12,
    average: "45.7",
    role: "Top order"
  },
  {
    id: "noah-patel",
    name: "Noah Patel",
    country: "India",
    matches: 38,
    runs: 1424,
    wickets: 4,
    average: "41.8",
    role: "Anchor batter"
  },
  {
    id: "luca-fernando",
    name: "Luca Fernando",
    country: "Sri Lanka",
    matches: 35,
    runs: 902,
    wickets: 58,
    average: "31.1",
    role: "All-rounder"
  },
  {
    id: "samira-khan",
    name: "Samira Khan",
    country: "England",
    matches: 31,
    runs: 764,
    wickets: 44,
    average: "29.4",
    role: "Seam bowler"
  }
];

export const featuredArticles: Article[] = [
  {
    slug: "how-cricket-statistics-explain-match-momentum",
    title: "How Cricket Statistics Explain Match Momentum",
    excerpt:
      "A future editorial template for turning scorecards, phases, and pressure points into readable analysis.",
    date: "2026-08-01",
    category: "Analytics",
    imageAlt: "Abstract cricket pitch with score graph overlay",
    accent: "#136F43"
  },
  {
    slug: "building-better-player-comparisons",
    title: "Building Better Player Comparisons",
    excerpt:
      "A framework for comparing players by role, era, match context, and format instead of raw totals alone.",
    date: "2026-07-21",
    category: "Players",
    imageAlt: "Player comparison chart placeholder",
    accent: "#1F6F8B"
  },
  {
    slug: "why-yearly-cricket-trends-matter",
    title: "Why Yearly Cricket Trends Matter",
    excerpt:
      "A search-friendly article pattern for exploring how cricket changes across seasons and tournament cycles.",
    date: "2026-07-09",
    category: "Years",
    imageAlt: "Timeline and cricket statistics placeholder",
    accent: "#D79A1E"
  }
];

export const popularRecords: RecordItem[] = [
  {
    title: "Highest ODI Score",
    format: "ODI",
    value: "Dataset pending",
    holder: "Demo record placeholder",
    href: "/records/highest-odi-score"
  },
  {
    title: "Most Test Runs",
    format: "Test",
    value: "Dataset pending",
    holder: "Demo record placeholder",
    href: "/records/most-test-runs"
  },
  {
    title: "Most International Wickets",
    format: "All formats",
    value: "Dataset pending",
    holder: "Demo record placeholder",
    href: "/records/most-international-wickets"
  },
  {
    title: "Most World Cup Runs",
    format: "World Cup",
    value: "Dataset pending",
    holder: "Demo record placeholder",
    href: "/records/most-world-cup-runs"
  }
];
