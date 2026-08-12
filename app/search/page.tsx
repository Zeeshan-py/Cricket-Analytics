import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { SearchBar } from "@/components/ui/SearchBar";
import { createPageMetadata } from "@/lib/seo";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export const metadata = createPageMetadata({
  title: "Search Cricket Statistics",
  description: "Search foundation for cricket players, teams, tournaments, matches, records, years, and articles.",
  path: "/search"
});

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  const trimmedQuery = query?.trim();

  return (
    <FoundationPage
      eyebrow="Search"
      title="Search Cricket Atlas"
      description="The global search route is ready for future indexing across players, teams, tournaments, matches, records, years, and articles."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Search" }
      ]}
    >
      <div className="search-page-panel">
        <SearchBar id="search-page-input" variant="page" defaultValue={trimmedQuery} />
        <EmptyState
          title={trimmedQuery ? `No demo results for "${trimmedQuery}"` : "Search index coming later"}
          description="The UI and route are in place. Connect the cricket dataset or search service in a later phase to return real results."
          actionHref="/players"
          actionLabel="Browse players"
        />
      </div>
    </FoundationPage>
  );
}
