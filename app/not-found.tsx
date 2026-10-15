import Link from "next/link";
export default function NotFound() {
  return (
    <main className="content">
      <h1>This page isn’t here.</h1>
      <Link className="primary" href="/">
        Return to OneTap Performance
      </Link>
    </main>
  );
}
