import Link from "next/link";
import type { Player } from "@/data/mockCricketData";

type PlayerCardProps = {
  player: Player;
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article className="player-card">
      <div>
        <span>{player.country}</span>
        <h3>
          <Link href={`/players/${player.id}`}>{player.name}</Link>
        </h3>
        <p>{player.role}</p>
      </div>
      <dl>
        <div>
          <dt>Matches</dt>
          <dd>{player.matches}</dd>
        </div>
        <div>
          <dt>Runs</dt>
          <dd>{player.runs.toLocaleString("en")}</dd>
        </div>
        <div>
          <dt>Wickets</dt>
          <dd>{player.wickets}</dd>
        </div>
      </dl>
    </article>
  );
}
