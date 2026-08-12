import type { Statistic } from "@/data/mockCricketData";

type StatisticCardProps = {
  stat: Statistic;
};

export function StatisticCard({ stat }: StatisticCardProps) {
  return (
    <article className={`stat-card stat-card--${stat.tone}`}>
      <div>
        <p>{stat.label}</p>
        <strong>{stat.value}</strong>
      </div>
      <span>Demo data</span>
      <p>{stat.description}</p>
    </article>
  );
}
