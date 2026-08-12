import Link from "next/link";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { recentYears } from "@/data/mockCricketData";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Statistics by Year",
  description: "Explore yearly cricket analytics foundations for season summaries, records, player performance, teams, and tournaments.",
  path: "/years"
});

export default function YearsPage() {
  return (
    <FoundationPage
      eyebrow="Yearly analytics"
      title="Cricket Through the Years"
      description="Year pages are prepared for annual cricket trends, match lists, records, player rankings, tournaments, and editorial context."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Years" }
      ]}
    >
      <div className="year-grid year-grid--wide">
        {recentYears.map((year) => (
          <Link key={year} href={`/years/${year}`}>
            <span>{year}</span>
            <strong>Open year page</strong>
          </Link>
        ))}
      </div>
    </FoundationPage>
  );
}
