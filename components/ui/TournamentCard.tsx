import Link from "next/link";
import type { CSSProperties } from "react";
import type { ExploreCard } from "@/data/mockCricketData";
import { ArrowRightIcon } from "@/components/ui/Icon";

type TournamentCardProps = {
  item: ExploreCard;
};

export function TournamentCard({ item }: TournamentCardProps) {
  return (
    <Link
      className="tournament-card"
      href={item.href}
      style={{ "--card-accent": item.accent } as CSSProperties}
    >
      <span>{item.label}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <strong>
        Open section
        <ArrowRightIcon />
      </strong>
    </Link>
  );
}
