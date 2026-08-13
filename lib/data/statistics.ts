import "server-only";
import { getMatchesByYear } from "@/lib/data/matches";
import { getSeriesSummaries } from "@/lib/data/tournaments";
import { getTopRunScorers, getTopWicketTakers } from "@/lib/data/players";

export async function getYearStatistics(year: number) {
  const [matches, seriesSummaries, topRunScorers, topWicketTakers] = await Promise.all([
    getMatchesByYear(year, { limit: 25 }),
    getSeriesSummaries({ year, limit: 25 }),
    getTopRunScorers({ limit: 10 }),
    getTopWicketTakers({ limit: 10 })
  ]);

  return {
    year,
    matches,
    seriesSummaries,
    topRunScorers,
    topWicketTakers
  };
}
