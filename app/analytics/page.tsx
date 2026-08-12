import { FoundationPage } from "@/components/ui/FoundationPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Analytics",
  description: "Explore the cricket analytics foundation for trends, charts, rankings, format splits, yearly insights, and comparison tools.",
  path: "/analytics"
});

export default function AnalyticsPage() {
  return (
    <FoundationPage
      eyebrow="Analytics"
      title="Cricket Analytics"
      description="A data-focused home for charts, rankings, trend analysis, player comparisons, format filters, and future dataset-backed insights."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Analytics" }
      ]}
    >
      <section className="analytics-preview" aria-label="Analytics placeholders">
        <article>
          <h2>Trend Charts</h2>
          <div className="chart-placeholder" aria-hidden="true">
            <span style={{ height: "32%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "44%" }} />
            <span style={{ height: "72%" }} />
            <span style={{ height: "61%" }} />
          </div>
          <p>Prepared for run-rate trends, yearly changes, venue factors, and format-specific comparisons.</p>
        </article>
        <article>
          <h2>Comparison Tables</h2>
          <p>Ready for sortable player, team, tournament, and match tables with accessible table markup.</p>
        </article>
      </section>
    </FoundationPage>
  );
}
