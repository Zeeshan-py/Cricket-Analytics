import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icon";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-live="polite">
      <h2>{title}</h2>
      <p>{description}</p>
      {actionHref && actionLabel ? (
        <Link className="button button--secondary" href={actionHref}>
          {actionLabel}
          <ArrowRightIcon />
        </Link>
      ) : null}
    </section>
  );
}
