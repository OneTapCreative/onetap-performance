"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="content">
      <h1>Something interrupted the demo.</h1>
      <p>
        Your imports are temporary. Reload to return to the original synthetic
        dataset.
      </p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
