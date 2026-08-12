import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";

type FoundationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  children?: ReactNode;
};

export function FoundationPage({ eyebrow, title, description, breadcrumbs, children }: FoundationPageProps) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
      <div className="container page-content">
        {children ?? (
          <EmptyState
            title="Dataset connection coming later"
            description="This route is part of the public website foundation. It is ready for filters, tables, charts, and SEO content when verified cricket data is connected."
            actionHref="/"
            actionLabel="Back to homepage"
          />
        )}
      </div>
    </div>
  );
}
