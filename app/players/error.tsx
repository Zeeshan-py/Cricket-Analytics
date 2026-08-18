"use client";

export default function PlayersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page-content">
      <section className="empty-state" aria-live="polite">
        <h2>Player data could not be loaded</h2>
        <p>There was a problem reading the current Supabase player statistics. Try again after the connection settles.</p>
        <button className="button button--secondary" type="button" onClick={() => reset()}>
          Retry
        </button>
      </section>
    </div>
  );
}