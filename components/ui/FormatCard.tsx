import Link from "next/link";
import type { CSSProperties } from "react";
import type { ExploreCard } from "@/data/mockCricketData";
import { ArrowRightIcon } from "@/components/ui/Icon";

type FormatCardProps = {
  item: ExploreCard;
};

export function FormatCard({ item }: FormatCardProps) {
  return (
    <Link
      className="explore-card"
      href={item.href}
      style={{ "--card-accent": item.accent } as CSSProperties}
    >
      <span>{item.label}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <strong>
        Explore
        <ArrowRightIcon />
      </strong>
    </Link>
  );
}
