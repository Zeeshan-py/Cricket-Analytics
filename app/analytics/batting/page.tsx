import Link from "next/link";
import { AnalyticsFilters } from "@/components/ui/AnalyticsFilters";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getBattingLeaderboard, type BattingLeader } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Batting Statistics",
  description: "Filter batting leaderboards by year, format, team, and tournament using the current Cricket Atlas Supabase dataset.",
  path: "/analytics/batting"
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
  return qs ? `/analytics/batting?${qs}` : "/analytics/batting";
}

export default async function BattingAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const values = {
    year: numberParam(params.year),
    formatSlug: paramValue(params.format) || undefined,
    teamSlug: paramValue(params.team) || undefined,
    tournamentSlug: paramValue(params.tournament) || undefined,
    sort: paramValue(params.sort) || "runs"
  };
  const page = numberParam(params.page, 1) ?? 1;
  const result = await getBattingLeaderboard({ ...values, page });

  if (!result) {
    return (
      <FoundationPage eyebrow="Batting analytics" title="Cricket Batting Statistics" description="No batting data is available for those filters." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Batting" }]}>
        <EmptyState title="No batting data" description="Try changing the year, format, team, or tournament filter." actionHref="/analytics/batting" actionLabel="Reset filters" />
      </FoundationPage>
    );
  }

  const columns: DataColumn<BattingLeader>[] = [
    { key: "player", header: "Player", render: (row) => <Link className="table-primary-link" href={`/players/${row.playerSlug}`}>{row.playerName}<span>{row.teamName ?? "Team unavailable"}</span></Link> },
    { key: "matches", header: "Mat", align: "right", render: (row) => row.matches },
    { key: "innings", header: "Inn", align: "right", render: (row) => row.innings },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runs },
    { key: "hs", header: "HS", align: "right", render: (row) => row.highestScore ?? "-" },
    { key: "avg", header: "Avg", align: "right", render: (row) => decimal(row.average) },
    { key: "sr", header: "SR", align: "right", render: (row) => decimal(row.strikeRate) },
    { key: "50", header: "50s", align: "right", render: (row) => row.fifties },
    { key: "100", header: "100s", align: "right", render: (row) => row.hundreds },
    { key: "4s", header: "4s", align: "right", render: (row) => row.fours },
    { key: "6s", header: "6s", align: "right", render: (row) => row.sixes }
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
      eyebrow="Batting analytics"
      title="Cricket Batting Statistics"
      description="Filterable batting leaderboards calculated from imported batting scorecards in the current Supabase dataset."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Batting" }]}
    >
      <AnalyticsFilters
        action="/analytics/batting"
        options={result.filters}
        values={values}
        sortOptions={[
          { label: "Most runs", value: "runs" },
          { label: "Highest score", value: "highest-score" },
          { label: "Best average", value: "average" },
          { label: "Best strike rate", value: "strike-rate" },
          { label: "Most fifties", value: "fifties" },
          { label: "Most hundreds", value: "hundreds" },
          { label: "Most fours", value: "fours" },
          { label: "Most sixes", value: "sixes" }
        ]}
      />
      {result.rows.length ? (
        <>
          <DataTable caption="Batting leaderboard from current imported scorecards." columns={columns} data={result.rows} getRowKey={(row) => row.playerId} />
          <nav className="pagination" aria-label="Batting pagination">
            <Link className={result.page <= 1 ? "is-disabled" : undefined} aria-disabled={result.page <= 1} href={buildHref({ ...baseParams, page: String(Math.max(1, result.page - 1)) })}>Previous</Link>
            <span>Page {result.page} of {result.totalPages}</span>
            <Link className={result.page >= result.totalPages ? "is-disabled" : undefined} aria-disabled={result.page >= result.totalPages} href={buildHref({ ...baseParams, page: String(Math.min(result.totalPages, result.page + 1)) })}>Next</Link>
          </nav>
        </>
      ) : (
        <EmptyState title="No batting data" description="No batting rows are available for this filter." />
      )}
    </FoundationPage>
  );
}
