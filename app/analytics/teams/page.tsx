import Link from "next/link";
import { AnalyticsFilters } from "@/components/ui/AnalyticsFilters";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getTeamAnalytics, type TeamAnalyticsRow } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Team Analytics",
  description: "Explore team matches, wins, losses, win percentage, runs, wickets, and top performers from the current Cricket Atlas dataset.",
  path: "/analytics/teams"
});

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberParam(value: string | string[] | undefined) {
  const parsed = Number.parseInt(paramValue(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function decimal(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "-";
}

export default async function TeamAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const values = {
    year: numberParam(params.year),
    formatSlug: paramValue(params.format) || undefined,
    teamSlug: paramValue(params.team) || undefined,
    tournamentSlug: paramValue(params.tournament) || undefined
  };
  const result = await getTeamAnalytics(values);

  if (!result) {
    return (
      <FoundationPage eyebrow="Team analytics" title="Cricket Team Analytics" description="No team data is available for those filters." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Teams" }]}>
        <EmptyState title="No team data" description="Try changing the year, format, team, or tournament filter." actionHref="/analytics/teams" actionLabel="Reset filters" />
      </FoundationPage>
    );
  }

  const columns: DataColumn<TeamAnalyticsRow>[] = [
    { key: "team", header: "Team", render: (row) => <Link className="table-primary-link" href={`/teams/${row.teamSlug}`}>{row.teamName}</Link> },
    { key: "matches", header: "Mat", align: "right", render: (row) => row.matches },
    { key: "wins", header: "Wins", align: "right", render: (row) => row.wins },
    { key: "losses", header: "Losses", align: "right", render: (row) => row.losses },
    { key: "draws", header: "Draw/NR", align: "right", render: (row) => row.drawsNoResults },
    { key: "winPct", header: "Win %", align: "right", render: (row) => decimal(row.winPercentage) },
    { key: "runs", header: "Runs", align: "right", render: (row) => row.runsScored },
    { key: "wickets", header: "Wickets", align: "right", render: (row) => row.wicketsTaken },
    { key: "topRun", header: "Top batter", render: (row) => row.topRunScorer ? <Link className="table-primary-link" href={`/players/${row.topRunScorer.playerSlug}`}>{row.topRunScorer.playerName}<span>{row.topRunScorer.runs} runs</span></Link> : "-" },
    { key: "topWicket", header: "Top bowler", render: (row) => row.topWicketTaker ? <Link className="table-primary-link" href={`/players/${row.topWicketTaker.playerSlug}`}>{row.topWicketTaker.playerName}<span>{row.topWicketTaker.wickets} wickets</span></Link> : "-" }
  ];

  return (
    <FoundationPage
      eyebrow="Team analytics"
      title="Cricket Team Analytics"
      description="Team-level matches, results, scoring, wickets, and top performers from the current verified Supabase dataset."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Analytics", href: "/analytics" }, { label: "Teams" }]}
    >
      <AnalyticsFilters action="/analytics/teams" options={result.filters} values={values} />
      {result.teams.length ? (
        <DataTable caption="Team analytics from current imported matches. Win percentage uses decisive results only." columns={columns} data={result.teams} getRowKey={(row) => row.teamId} />
      ) : (
        <EmptyState title="No team analytics" description="No teams have match data for this filter." />
      )}
    </FoundationPage>
  );
}
