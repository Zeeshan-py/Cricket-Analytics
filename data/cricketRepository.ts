import {
  featuredArticles,
  formatCards,
  popularRecords,
  quickStats,
  recentYears,
  topPlayers,
  tournamentCards
} from "@/data/mockCricketData";

export async function getHomepageData() {
  return {
    quickStats,
    formatCards,
    tournamentCards,
    recentYears,
    topPlayers,
    featuredArticles,
    popularRecords
  };
}

export async function getFeaturedArticles() {
  return featuredArticles;
}

export async function getTopPlayers() {
  return topPlayers;
}

export async function getPopularRecords() {
  return popularRecords;
}
