import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icon";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function SectionHeader({ eyebrow, title, description, actionHref, actionLabel }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link className="text-link" href={actionHref}>
          {actionLabel}
          <ArrowRightIcon />
        </Link>
      ) : null}
    </div>
  );
}
