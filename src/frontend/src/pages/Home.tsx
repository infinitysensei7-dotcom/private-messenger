import { Link } from "@tanstack/react-router";
import {
  Fingerprint,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Strong authentication",
    body: "Sign in with your Internet Identity. Only the two pre-authorized accounts can open the private channel.",
  },
  {
    icon: Lock,
    title: "Automatic locking",
    body: "The private channel locks itself when you leave the app or stay inactive, and you can lock it instantly at any time.",
  },
  {
    icon: Fingerprint,
    title: "Secure storage",
    body: "Messages live in your own canister with role-based access control — nothing is stored on your device.",
  },
];

const flowSteps = [
  {
    title: "Unlock",
    body: "Open the Private Channel and enter your 4-digit PIN, or use biometrics where supported.",
  },
  {
    title: "Authenticate",
    body: "Sign in with your Internet Identity to prove who you are.",
  },
  {
    title: "Authorize",
    body: "Only the two pre-authorized accounts can read and send. Everyone else sees a clear access-denied screen.",
  },
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="animate-slide-up pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Private two-person messenger
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
          A quiet channel
          <br />
          for just the two of you.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Haven is a calm, private messenger built around strong authentication,
          automatic locking, secure storage, and encrypted network
          communication. No stealth, no hidden behavior — just a clear,
          documented privacy flow.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/conversation"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-bubble transition-smooth hover:brightness-105"
            data-ocid="open_private_channel_button"
          >
            <MessageSquare className="h-5 w-5" />
            Open Private Channel
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium text-foreground transition-smooth hover:bg-accent"
            data-ocid="privacy_settings_link"
          >
            <Lock className="h-5 w-5" />
            Privacy &amp; Security
          </Link>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        data-ocid="features_section"
      >
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
            data-ocid={`feature_card_${feature.title.toLowerCase().replace(/\s+/g, "_")}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <feature.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.body}
            </p>
          </article>
        ))}
      </section>

      <section
        className="rounded-3xl border border-border bg-card p-6 shadow-subtle"
        data-ocid="privacy_flow_section"
      >
        <h2 className="font-display text-xl font-semibold tracking-tight">
          How your privacy works
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Opening the private channel follows a clear, documented flow. Nothing
          is hidden or automatic behind your back.
        </p>
        <ol className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
          {flowSteps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span>
                <strong className="text-foreground">{step.title}.</strong>{" "}
                {step.body}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted p-4">
          <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Two-person only.</strong> This
            channel is restricted to exactly two pre-authorized accounts. If
            your identity is not on the access list, you will see a clear
            access-denied screen — never a disguised or misleading prompt.
          </p>
        </div>
      </section>
    </div>
  );
}
