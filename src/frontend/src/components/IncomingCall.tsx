import { Phone, PhoneOff } from "lucide-react";

export function IncomingCall({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      className="frosted flex flex-col items-center rounded-3xl border border-border px-6 py-8 text-center shadow-elevated animate-slide-up"
      data-ocid="incoming_call"
    >
      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/30" />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 font-display text-3xl font-bold text-primary">
          H
        </span>
      </div>

      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Private Channel
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Incoming voice call…</p>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={onDecline}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-bubble transition-smooth hover:brightness-105"
          aria-label="Decline call"
          data-ocid="decline_button"
        >
          <PhoneOff className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={onAccept}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-bubble transition-smooth hover:brightness-105"
          aria-label="Accept call"
          data-ocid="accept_button"
        >
          <Phone className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}
