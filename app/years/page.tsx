import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { getYears } from "@/lib/data/years";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Statistics by Year",
  description: "Explore the years currently represented in Cricket Atlas, with links to match lists, tournaments, teams, and player performances from Supabase.",
  path: "/years"
});

export default async function YearsPage() {
  try {
    const years = await getYears();

    return (
      <FoundationPage
        eyebrow="Year explorer"
        title="Cricket Statistics by Year"
        description="Browse the years that actually exist in the current verified Supabase dataset. Coverage is limited to the imported 50-match Cricsheet sample until the full dataset is loaded."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Years" }
        ]}
      >
        {years.length ? (
          <section className="year-grid year-grid--wide" aria-label="Available years">
            {years.map((item) => (
              <Link key={item.year} href={`/years/${item.year}`}>
                <span>{item.year}</span>
                <strong>{item.matches} match{item.matches === 1 ? "" : "es"}</strong>
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState
            title="No years available"
            description="No match years are currently available in Supabase. Run the verified importer before using this explorer."
            actionHref="/matches"
            actionLabel="View matches"
          />
        )}
      </FoundationPage>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Year explorer"
          title="Cricket Statistics by Year"
          description="Supabase configuration is required before year data can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Years" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to load year summaries." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
