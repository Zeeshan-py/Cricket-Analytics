import Link from "next/link";
import { AnalyticsFilters } from "@/components/ui/AnalyticsFilters";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getBowlingLeaderboard, type BowlingLeader } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Bowling Statistics",
  description: "Filter bowling leaderboards by year, format, team, and tournament using the current Cricket Atlas Supabase dataset.",
  path: "/analytics/bowling"
});

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined, fallback?: number) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

function buildHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
  const qs = query.toString();
  return qs ? `/analytics/bowling?${qs}` : "/analytics/bowling";
}

export default async function BowlingAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const values = {
    year: numberParam(params.year),
    formatSlug: paramValue(params.format) || undefined,
    teamSlug: paramValue(params.team) || undefined,
    tournamentSlug: paramValue(params.tournament) || undefined,
    sort: paramValue(params.sort) || "wickets"
  };
  const page = numberParam(params.page, 1) ?? 1;
  const result = await getBowlingLeaderboard({ ...values, page });

  if (!result) {
    return (
      <FoundationPage eyebrow="Bowling analytics" title="Cricket Bowling Statistics" description="No bowling data is available for those filters." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Bowling" }]}>
        <EmptyState title="No bowling data" description="Try changing the year, format, team, or tournament filter." actionHref="/analytics/bowling" actionLabel="Reset filters" />
      </FoundationPage>
    );
  }

  const columns: DataColumn<BowlingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "matches", header: "Mat", align: "right", render: (row) => row.matches },
    { key: "innings", header: "Inn", align: "right", render: (row) => row.innings },
    { key: "overs", header: "Overs", align: "right", render: (row) => row.overs ?? "-" },
    { key: "maidens", header: "M", align: "right", render: (row) => row.maidens },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runsConceded },
    { key: "wickets", header: "Wkts", align: "right", render: (row) => row.wickets },
    { key: "best", header: "Best", align: "right", render: (row) => row.bestRunsConceded !== null ? `${row.bestWickets}/${row.bestRunsConceded}` : "-" },
    { key: "avg", header: "Avg", align: "right", render: (row) => decimal(row.average) },
    { key: "econ", header: "Econ", align: "right", render: (row) => decimal(row.economy) }
  ];
  const baseParams = {
    year: values.year ? String(values.year) : undefined,
    format: values.formatSlug,
    team: values.teamSlug,
    tournament: values.tournamentSlug,
    sort: values.sort
  };

  return (
    <FoundationPage
      eyebrow="Bowling analytics"
      title="Cricket Bowling Statistics"
      description="Filterable bowling leaderboards calculated from imported bowling scorecards in the current Supabase dataset."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Bowling" }]}
    >
      <AnalyticsFilters
        action="/analytics/bowling"
        options={result.filters}
        values={values}
        sortOptions={[
          { label: "Most wickets", value: "wickets" },
          { label: "Best bowling figures", value: "best-figures" },
          { label: "Best economy", value: "economy" },
          { label: "Best average", value: "average" },
          { label: "Most maidens", value: "maidens" },
          { label: "Most overs", value: "overs" },
          { label: "Most runs conceded", value: "runs-conceded" }
        ]}
      />
      {result.rows.length ? (
        <>
          <DataTable caption="Bowling leaderboard from current imported scorecards." columns={columns} data={result.rows} getRowKey={(row) => row.playerId} />
          <nav className="pagination" aria-label="Bowling pagination">
            <Link className={result.page <= 1 ? "is-disabled" : undefined} aria-disabled={result.page <= 1} href={buildHref({ ...baseParams, page: String(Math.max(1, result.page - 1)) })}>Previous</Link>
            <span>Page {result.page} of {result.totalPages}</span>
            <Link className={result.page >= result.totalPages ? "is-disabled" : undefined} aria-disabled={result.page >= result.totalPages} href={buildHref({ ...baseParams, page: String(Math.min(result.totalPages, result.page + 1)) })}>Next</Link>
          </nav>
        </>
      ) : (
        <EmptyState title="No bowling data" description="No bowling rows are available for this filter." />
      )}
    </FoundationPage>
  );
}
