import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="container not-found">
      <EmptyState
        title="Page not found"
        description="The cricket page you requested does not exist yet, or the route will be added when the dataset is connected."
        actionHref="/"
        actionLabel="Back to homepage"
      />
    </div>
  );
}
