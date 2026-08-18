import type { AnalyticsFilterInput, AnalyticsFilterOptions } from "@/lib/data/analytics";

type AnalyticsFiltersProps = {
  action: string;
  options: AnalyticsFilterOptions;
  values: AnalyticsFilterInput & { sort?: string };
  includePlayer?: boolean;
  sortOptions?: { label: string; value: string }[];
};

export function AnalyticsFilters({ action, options, values, includePlayer = false, sortOptions = [] }: AnalyticsFiltersProps) {
  return (
    <section className="explorer-panel" aria-label="Analytics filters">
      <form className="explorer-filter-form analytics-filter-form" action={action}>
        <label>
          <span>Year</span>
          <select name="year" defaultValue={values.year ? String(values.year) : ""}>
            <option value="">All years</option>
            {options.years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Format</span>
          <select name="format" defaultValue={values.formatSlug ?? ""}>
            <option value="">All formats</option>
            {options.formats.map((format) => (
              <option key={format.slug} value={format.slug}>{format.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Team</span>
          <select name="team" defaultValue={values.teamSlug ?? ""}>
            <option value="">All teams</option>
            {options.teams.map((team) => (
              <option key={team.slug} value={team.slug}>{team.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tournament</span>
          <select name="tournament" defaultValue={values.tournamentSlug ?? ""}>
            <option value="">All tournaments</option>
            {options.tournaments.map((tournament) => (
              <option key={tournament.slug} value={tournament.slug}>{tournament.name}</option>
            ))}
          </select>
        </label>
        {includePlayer ? (
          <label>
            <span>Player</span>
            <select name="player" defaultValue={values.playerSlug ?? ""}>
              <option value="">All players</option>
              {options.players.map((player) => (
                <option key={player.slug} value={player.slug}>{player.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        {sortOptions.length ? (
          <label>
            <span>Sort</span>
            <select name="sort" defaultValue={values.sort ?? sortOptions[0]?.value}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit">Apply</button>
      </form>
      <p>Analytics reflect the available dataset and may not represent complete historical cricket records.</p>
    </section>
  );
}
