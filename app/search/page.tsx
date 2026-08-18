import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { SearchBar } from "@/components/ui/SearchBar";
import { StructuredData } from "@/components/seo/StructuredData";
import { DataAccessNotConfiguredError } from "@/lib/data/errors";
import { globalSearch, type GlobalSearchResult } from "@/lib/data/search";
import { breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = paramValue(params.q)?.trim();

  return createPageMetadata({
    title: query ? `Search Results for ${query}` : "Search Cricket Statistics",
    description: "Search players, teams, matches, tournaments, and years from the current Cricket Atlas Supabase dataset.",
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    noIndex: Boolean(query)
  });
}

function ResultGroup({ title, results }: { title: string; results: GlobalSearchResult["groups"][keyof GlobalSearchResult["groups"]] }) {
  if (!results.length) return null;

  return (
    <section className="search-result-group">
      <h2>{title}</h2>
      <div className="search-result-list">
        {results.map((result) => (
          <Link className="search-result-card" href={result.href} key={`${title}-${result.href}`}>
            <span>{result.meta ?? title}</span>
            <h3>{result.title}</h3>
            <p>{result.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = paramValue(params.q)?.trim() ?? "";

  try {
    const results = await globalSearch(query);

    return (
      <>
        <StructuredData
          data={breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: "Search", href: "/search" }
          ])}
        />
        <FoundationPage
          eyebrow="Search"
          title="Search Cricket Atlas"
          description="Search the real Supabase-backed index for players, teams, matches, tournaments, and years. Deliveries are intentionally excluded for performance."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Search" }
          ]}
        >
          <div className="search-page-panel">
            <SearchBar
              id="search-page-input"
              variant="page"
              defaultValue={query}
              showClear
              placeholder="Search player, team, match, tournament, or year"
            />
            {!results.query ? (
              <EmptyState
                title="Start with a player, team, match, tournament, or year"
                description="Try a partial name such as Australia, a player surname, or a season year from the imported dataset."
                actionHref="/players"
                actionLabel="Browse players"
              />
            ) : results.total > 0 ? (
              <div className="search-results" aria-live="polite">
                <p className="result-count">{results.total} results for "{results.query}"</p>
                <ResultGroup title="Players" results={results.groups.players} />
                <ResultGroup title="Teams" results={results.groups.teams} />
                <ResultGroup title="Matches" results={results.groups.matches} />
                <ResultGroup title="Tournaments" results={results.groups.tournaments} />
                <ResultGroup title="Years" results={results.groups.years} />
              </div>
            ) : (
              <EmptyState
                title={`No results for "${results.query}"`}
                description="No matching players, teams, matches, tournaments, or years exist in the current verified sample. Try a broader term."
                actionHref="/search"
                actionLabel="Clear search"
              />
            )}
          </div>
        </FoundationPage>
      </>
    );
  } catch (error) {
    if (error instanceof DataAccessNotConfiguredError) {
      return (
        <FoundationPage
          eyebrow="Search"
          title="Search Cricket Atlas"
          description="Supabase configuration is required before search results can be loaded."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        >
          <EmptyState title="Supabase is not configured" description="Add the public Supabase URL and publishable key locally to search the dataset." />
        </FoundationPage>
      );
    }
    throw error;
  }
}
