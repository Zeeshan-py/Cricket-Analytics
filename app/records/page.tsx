import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { FoundationPage } from "@/components/ui/FoundationPage";
import { getRecords, type DatasetRecord } from "@/lib/data/analytics";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cricket Records & Statistics",
  description: "Browse batting, bowling, and match records calculated from the current Cricket Atlas Supabase dataset.",
  path: "/records"
});

function RecordGroup({ title, records }: { title: string; records: DatasetRecord[] }) {
  return (
    <section className="profile-section">
      <h2>{title}</h2>
      {records.length ? (
        <div className="records-grid records-grid--dataset">
          {records.map((record) => (
            <Link className="record-card" href={record.href} key={`${record.title}-${record.holder}`}>
              <span>Current dataset</span>
              <h3>{record.title}</h3>
              <p>{record.value}</p>
              <strong>{record.holder}</strong>
              <small>{record.context}</small>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={`No ${title.toLowerCase()}`} description="The current imported dataset does not contain enough rows for this record group." />
      )}
    </section>
  );
}

export default async function RecordsPage() {
  const records = await getRecords();

  return (
    <FoundationPage
      eyebrow="Records"
      title="Cricket Records & Statistics"
      description="Records in the current dataset, calculated from imported scorecards and match data. These are not world records or complete cricket-history records."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Records" }
      ]}
    >
      <section className="quick-link-row" aria-label="Record links">
        <Link className="button button--secondary" href="/analytics/batting">Batting analytics</Link>
        <Link className="button button--secondary" href="/analytics/bowling">Bowling analytics</Link>
        <Link className="button button--secondary" href="/analytics/teams">Team analytics</Link>
      </section>
      <RecordGroup title="Batting Records" records={records.batting} />
      <RecordGroup title="Bowling Records" records={records.bowling} />
      <RecordGroup title="Match Records" records={records.match} />
    </FoundationPage>
  );
}
