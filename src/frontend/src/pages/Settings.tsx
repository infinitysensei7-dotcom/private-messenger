import { SecuritySettings } from "@/components/SecuritySettings";
import { useGetCallerUserRole } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Fingerprint, LogOut, ShieldCheck, UserRound } from "lucide-react";

const roleLabel: Record<UserRole, string> = {
  [UserRole.admin]: "Administrator",
  [UserRole.user]: "Authorized user",
  [UserRole.guest]: "Guest",
};

export function SettingsPage() {
  const { isAuthenticated, identity, clear, isInitializing } =
    useInternetIdentity();
  const { data: role } = useGetCallerUserRole();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    clear();
    queryClient.clear();
  };

  const principal = identity?.getPrincipal().toString();

  return (
    <div className="space-y-6">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Privacy &amp; security
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Manage your account and review how Haven protects your privacy.
        </p>
      </section>

      <section
        className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
        data-ocid="account_section"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <UserRound className="h-5 w-5 text-primary" />
          Account
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              data-ocid="auth_status"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isAuthenticated ? "bg-primary" : "bg-muted-foreground",
                )}
              />
              {isAuthenticated ? "Signed in" : "Signed out"}
            </span>
          </div>
          {role && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Access level</span>
              <span className="font-medium" data-ocid="role_label">
                {roleLabel[role]}
              </span>
            </div>
          )}
          {principal && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Identity</span>
              <span className="max-w-[55%] truncate font-mono text-xs">
                {principal}
              </span>
            </div>
          )}
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isInitializing}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 font-medium text-foreground transition-smooth hover:bg-accent disabled:opacity-60"
            data-ocid="sign_out_button"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        )}
      </section>

      <SecuritySettings />

      <section
        className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
        data-ocid="privacy_section"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Fingerprint className="h-5 w-5 text-primary" />
          How Haven protects you
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">
                Strong authentication.
              </strong>{" "}
              Sign in with your Internet Identity; only the two pre-authorized
              accounts can access the private channel.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Automatic locking.</strong>{" "}
              The private channel stays behind a frosted lock until you unlock
              it with your identity.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Secure storage.</strong>{" "}
              Messages live in your own canister with role-based access control.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Encrypted network.</strong>{" "}
              All communication is encrypted. No stealth or hidden behavior.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
