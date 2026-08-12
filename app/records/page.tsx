import Link from "next/link";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getPopularRecords } from "@/data/cricketRepository";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Records",
  description: "Browse the cricket records foundation, prepared for batting, bowling, team, tournament, format, and yearly record pages.",
  path: "/records"
});

export default async function RecordsPage() {
  const records = await getPopularRecords();

  return (
    <FoundationPage
      eyebrow="Records"
      title="Cricket Records"
      description="Record pages are ready for verified holders, values, date context, match links, tournament links, and historical explanations."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Records" }
      ]}
    >
      <div className="records-grid">
        {records.map((record) => (
          <Link className="record-card" href={record.href} key={record.title}>
            <span>{record.format}</span>
            <h2>{record.title}</h2>
            <p>{record.value}</p>
            <strong>{record.holder}</strong>
          </Link>
        ))}
      </div>
    </FoundationPage>
  );
}
