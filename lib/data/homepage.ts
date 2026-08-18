import "server-only";
import { getAnalyticsOverview, getBattingLeaderboard, getBowlingLeaderboard, getRecords } from "@/lib/data/analytics";
import { getMatches } from "@/lib/data/matches";
import { getTournaments } from "@/lib/data/tournaments";

export async function getHomepageDiscoveryData() {
  const [summary, recentMatches, batting, bowling, records, tournaments] = await Promise.all([
    getAnalyticsOverview(),
    getMatches({ pageSize: 4 }),
    getBattingLeaderboard({ pageSize: 4 }),
    getBowlingLeaderboard({ pageSize: 4 }),
    getRecords(),
    getTournaments({ pageSize: 4 })
  ]);

  return {
    summary,
    recentMatches: recentMatches.matches,
    battingLeaders: batting?.rows ?? [],
    bowlingLeaders: bowling?.rows ?? [],
    records: [...records.batting, ...records.bowling, ...records.match].slice(0, 6),
    tournaments: tournaments.tournaments,
    years: summary?.filters.years.slice(0, 8) ?? []
  };
}
