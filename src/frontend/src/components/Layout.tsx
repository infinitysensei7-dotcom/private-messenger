import { Link } from "@tanstack/react-router";
import { Lock, MessageSquare, Phone, Settings } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Lock },
  { to: "/conversation", label: "Private Channel", icon: MessageSquare },
  { to: "/call", label: "Call", icon: Phone },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  const footerHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    window.location.hostname,
  )}`;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card shadow-subtle">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight"
            data-ocid="brand_link"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Lock className="h-4 w-4" />
            </span>
            <span>Haven</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground sm:px-3"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                data-ocid={`nav_link_${item.label.toLowerCase().replace(/\s+/g, "_")}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 text-center text-sm text-muted-foreground">
          © {year}. Built with love using{" "}
          <a
            href={footerHref}
            className="underline underline-offset-2 transition-smooth hover:text-foreground"
            data-ocid="footer_link"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
