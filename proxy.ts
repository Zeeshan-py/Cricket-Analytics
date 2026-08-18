import { NextResponse, type NextRequest } from "next/server";

const PLAYER_PROFILE_PATTERN = /^\/players\/([^/]+)\/?$/;
const TEAM_PROFILE_PATTERN = /^\/teams\/([^/]+)\/?$/;
const MATCH_DETAIL_PATTERN = /^\/matches\/([^/]+)\/?$/;
const YEAR_DETAIL_PATTERN = /^\/years\/([^/]+)\/?$/;
const TOURNAMENT_DETAIL_PATTERN = /^\/tournaments\/([^/]+)\/?$/;
const ANALYTICS_YEAR_PATTERN = /^\/analytics\/year\/([^/]+)\/?$/;
const ANALYTICS_FORMAT_PATTERN = /^\/analytics\/format\/([^/]+)\/?$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function notFoundResponse(title: string, message: string, backHref: string, backLabel: string) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(title)} | Cricket Atlas</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a></p>
    </main>
  </body>
</html>`,
    {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex"
      }
    }
  );
}

async function existsInTable(table: string, column: string, value: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) return true;

  const lookupUrl = new URL(`/rest/v1/${table}`, supabaseUrl);
  lookupUrl.searchParams.set(column, `eq.${value}`);
  lookupUrl.searchParams.set("select", "id");
  lookupUrl.searchParams.set("limit", "1");

  const response = await fetch(lookupUrl, {
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`
    }
  });

  if (!response.ok) return true;

  const rows = (await response.json()) as { id: string }[];
  return rows.length > 0;
}

function parseYear(value: string) {
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) && String(year) === value && year >= 1800 && year <= 2200 ? year : null;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const playerMatch = pathname.match(PLAYER_PROFILE_PATTERN);
  const teamMatch = pathname.match(TEAM_PROFILE_PATTERN);
  const matchMatch = pathname.match(MATCH_DETAIL_PATTERN);
  const yearMatch = pathname.match(YEAR_DETAIL_PATTERN);
  const tournamentMatch = pathname.match(TOURNAMENT_DETAIL_PATTERN);
  const analyticsYearMatch = pathname.match(ANALYTICS_YEAR_PATTERN);
  const analyticsFormatMatch = pathname.match(ANALYTICS_FORMAT_PATTERN);

  if (playerMatch) {
    const slug = playerMatch[1];
    if (await existsInTable("players", "slug", slug)) return NextResponse.next();
    return notFoundResponse("Player not found", `No player profile exists for ${slug} in the current Cricket Atlas dataset.`, "/players", "Back to players");
  }

  if (teamMatch) {
    const slug = teamMatch[1];
    if (await existsInTable("teams", "slug", slug)) return NextResponse.next();
    return notFoundResponse("Team not found", `No team profile exists for ${slug} in the current Cricket Atlas dataset.`, "/teams", "Back to teams");
  }

  if (matchMatch) {
    const matchId = matchMatch[1];
    if (!UUID_PATTERN.test(matchId)) {
      return notFoundResponse("Match not found", `No match exists for ${matchId} in the current Cricket Atlas dataset.`, "/matches", "Back to matches");
    }
    if (await existsInTable("matches", "id", matchId)) return NextResponse.next();
    return notFoundResponse("Match not found", `No match exists for ${matchId} in the current Cricket Atlas dataset.`, "/matches", "Back to matches");
  }

  if (yearMatch) {
    const yearValue = yearMatch[1];
    const year = parseYear(yearValue);
    if (!year) {
      return notFoundResponse("Year not found", `${yearValue} is not a valid year route for the current Cricket Atlas dataset.`, "/years", "Back to years");
    }
    if (await existsInTable("matches", "season_year", String(year))) return NextResponse.next();
    return notFoundResponse("Year not found", `No matches exist for ${year} in the current Cricket Atlas dataset.`, "/years", "Back to years");
  }

  if (tournamentMatch) {
    const slug = tournamentMatch[1];
    if (await existsInTable("tournaments", "slug", slug)) return NextResponse.next();
    return notFoundResponse("Tournament not found", `No tournament exists for ${slug} in the current Cricket Atlas dataset.`, "/tournaments", "Back to tournaments");
  }

  if (analyticsYearMatch) {
    const yearValue = analyticsYearMatch[1];
    const year = parseYear(yearValue);
    if (!year) {
      return notFoundResponse("Year analytics not found", `${yearValue} is not a valid analytics year route.`, "/analytics", "Back to analytics");
    }
    if (await existsInTable("matches", "season_year", String(year))) return NextResponse.next();
    return notFoundResponse("Year analytics not found", `No analytics exist for ${year} in the current Cricket Atlas dataset.`, "/analytics", "Back to analytics");
  }

  if (analyticsFormatMatch) {
    const slug = analyticsFormatMatch[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) return NextResponse.next();

    const formatUrl = new URL("/rest/v1/formats", supabaseUrl);
    formatUrl.searchParams.set("slug", `eq.${slug}`);
    formatUrl.searchParams.set("select", "id");
    formatUrl.searchParams.set("limit", "1");
    const formatResponse = await fetch(formatUrl, { headers: { apikey: publishableKey, authorization: `Bearer ${publishableKey}` } });
    if (!formatResponse.ok) return NextResponse.next();
    const formats = (await formatResponse.json()) as { id: string }[];
    const formatId = formats[0]?.id;
    if (!formatId) return notFoundResponse("Format analytics not found", `No format exists for ${slug} in the current Cricket Atlas dataset.`, "/analytics", "Back to analytics");
    if (await existsInTable("matches", "format_id", formatId)) return NextResponse.next();
    return notFoundResponse("Format analytics not found", `No matches exist for ${slug} in the current Cricket Atlas dataset.`, "/analytics", "Back to analytics");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/players/:playerSlug",
    "/teams/:teamSlug",
    "/matches/:matchId",
    "/years/:year",
    "/tournaments/:tournamentSlug",
    "/analytics/year/:year",
    "/analytics/format/:formatSlug"
  ]
};
