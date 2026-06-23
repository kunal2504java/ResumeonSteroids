import Link from "next/link";

/** Shared paper chrome for the in-app screens (dashboard, tracker, …). */
export default function AppHeader({ active }: { active?: "resumes" | "tracker" }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand-word">
          <b>ResumeAI<span className="dot">.</span></b>
          <small>resume studio</small>
        </Link>
        <nav className="app-nav">
          <Link href="/dashboard" className={active === "resumes" ? "is-active" : ""}>Resumes</Link>
          <Link href="/tracker" className={active === "tracker" ? "is-active" : ""}>Tracker</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/dashboard" className="btn btn-pen btn-sm">New draft</Link>
          <div className="app-avatar">U</div>
        </div>
      </div>
    </header>
  );
}
