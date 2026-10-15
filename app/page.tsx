import Link from "next/link";
import { Brand } from "@/components/ui";
export default function Home() {
  return (
    <main className="app-shell">
      <header className="header">
        <Brand />
        <span className="demo-pill">PRODUCT DEMONSTRATION</span>
      </header>
      <section className="landing content">
        <p className="eyebrow">A LITTLE CLARITY. A LOT OF PROGRESS.</p>
        <h1>
          Great work deserves
          <br />
          <span>a clear picture.</span>
        </h1>
        <p>
          Performance your associates can understand.
          <br />
          Insight your managers can act on.
        </p>
        <div className="entry-grid">
          <Link href="/kiosk" className="entry-card green">
            <span className="eyebrow">FOR ASSOCIATES / PARA ASOCIADOS</span>
            <h2>
              Your work.
              <br />
              Your progress.
            </h2>
            <p>
              Private sign-in. One clear view.
              <br />
              Built for a shared iPad.
            </p>
            <strong>
              Open associate kiosk <span>↗</span>
            </strong>
          </Link>
          <Link href="/manager" className="entry-card">
            <span className="eyebrow">FOR MANAGERS / PARA SUPERVISORES</span>
            <h2>
              See your team.
              <br />
              Support their growth.
            </h2>
            <p>
              Review performance and reporting gaps.
              <br />
              Preview and publish synthetic reports.
            </p>
            <strong>
              Open manager demo <span>↗</span>
            </strong>
          </Link>
        </div>
        <p className="quiet-note">
          30 fictional associates · Four reporting weeks · English / Español
          <br />
          Simulated access and local imports. No real employee records.
        </p>
      </section>
      <footer className="footer">
        <span>Designed by OneTap Creative</span>
        <span>One tap. A clearer path forward.</span>
      </footer>
    </main>
  );
}
