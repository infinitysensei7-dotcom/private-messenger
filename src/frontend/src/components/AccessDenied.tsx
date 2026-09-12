import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export function AccessDenied() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center py-8 text-center"
      data-ocid="access_denied"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Access denied
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        This private channel is restricted to the two pre-authorized accounts.
        Your identity is not on the access list.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full border border-border bg-card px-6 py-3 font-medium text-foreground transition-smooth hover:bg-accent"
        data-ocid="back_home_button"
      >
        Back to Home
      </Link>
    </div>
  );
}
