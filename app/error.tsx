"use client";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page-content">
      <section className="empty-state" aria-live="polite">
        <h2>Something went wrong</h2>
        <p>The page could not be loaded. Try again, or return to the homepage and choose another section.</p>
        <button className="button button--secondary" type="button" onClick={() => reset()}>
          Retry
        </button>
      </section>
    </div>
  );
}
