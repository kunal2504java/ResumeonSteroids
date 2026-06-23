"use client";

interface ThemeToggleProps {
  className?: string;
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.localStorage.setItem("resumeai-theme", theme);
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  function handleToggle() {
    const current =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle light and dark mode"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] ${className}`}
    >
      <span className="theme-toggle-icon-light" aria-hidden="true">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4V2M12 22v-2M4 12H2m20 0h-2M5.64 5.64 4.22 4.22m15.56 15.56-1.42-1.42m0-12.72 1.42-1.42M4.22 19.78l1.42-1.42"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <span className="theme-toggle-icon-dark" aria-hidden="true">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 15.2A7.8 7.8 0 0 1 8.8 4 8.6 8.6 0 1 0 20 15.2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    </button>
  );
}
