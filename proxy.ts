import { NextResponse, type NextRequest } from "next/server";

const PLAYER_PROFILE_PATTERN = /^\/players\/([^/]+)\/?$/;

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

function playerNotFoundResponse(slug: string) {
  const safeSlug = escapeHtml(slug);

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Player Not Found | Cricket Atlas</title>
  </head>
  <body>
    <main>
      <h1>Player not found</h1>
      <p>No player profile exists for ${safeSlug} in the current Cricket Atlas dataset.</p>
      <p><a href="/players">Back to players</a></p>
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

export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(PLAYER_PROFILE_PATTERN);
  if (!match) return NextResponse.next();

  const slug = match[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) return NextResponse.next();

  const playerUrl = new URL("/rest/v1/players", supabaseUrl);
  playerUrl.searchParams.set("slug", `eq.${slug}`);
  playerUrl.searchParams.set("select", "id");
  playerUrl.searchParams.set("limit", "1");

  const response = await fetch(playerUrl, {
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`
    }
  });

  if (!response.ok) return NextResponse.next();

  const players = (await response.json()) as { id: string }[];
  if (players.length > 0) return NextResponse.next();

  return playerNotFoundResponse(slug);
}

export const config = {
  matcher: "/players/:playerSlug"
};
