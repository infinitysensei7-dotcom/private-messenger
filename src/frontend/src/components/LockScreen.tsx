import { cn } from "@/lib/utils";
import { Delete, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const PIN_LENGTH = 4;

interface LockScreenProps {
  mode: "setup" | "unlock";
  error: string | null;
  autoLockMs: number;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  onSetupPin: (pin: string) => Promise<boolean>;
  onUnlock: (pin: string) => Promise<boolean>;
  onUnlockWithBiometric: () => Promise<boolean>;
  onEnableBiometric: () => Promise<boolean>;
  onUpdateAutoLock: (ms: number) => void;
}

const AUTO_LOCK_OPTIONS = [
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "5m", value: 300_000 },
  { label: "Never", value: 0 },
] as const;

export function LockScreen({
  mode,
  error,
  autoLockMs,
  biometricAvailable,
  biometricEnabled,
  onSetupPin,
  onUnlock,
  onUnlockWithBiometric,
  onEnableBiometric,
  onUpdateAutoLock,
}: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const keys = useMemo(
    () => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"],
    [],
  );

  const submit = async (value: string) => {
    if (busy) return;
    setBusy(true);
    const ok =
      mode === "setup" ? await onSetupPin(value) : await onUnlock(value);
    setBusy(false);
    if (!ok) setPin("");
  };

  const handleKey = (key: string) => {
    if (busy) return;
    if (key === "back") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      void submit(next);
    }
  };

  const handleBiometric = async () => {
    if (busy) return;
    setBusy(true);
    await onUnlockWithBiometric();
    setBusy(false);
  };

  const handleEnableBiometric = async () => {
    if (busy) return;
    setBusy(true);
    await onEnableBiometric();
    setBusy(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div
        className="frosted w-full max-w-sm rounded-3xl border border-border p-7 text-center shadow-elevated animate-slide-up"
        data-ocid="lock_screen"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          {mode === "setup" ? "Set a privacy PIN" : "Private Channel"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {mode === "setup"
            ? "Choose a 4-digit PIN. You will need it to open the private conversation."
            : "This conversation is locked. Enter your PIN to open it."}
        </p>

        <div
          className="mt-6 flex items-center justify-center gap-3"
          aria-label="PIN entry"
          data-ocid="pin_dots"
        >
          {Array.from({ length: PIN_LENGTH }, (_, i) => `dot-${i}`).map(
            (id, i) => (
              <span
                key={id}
                className={cn(
                  "h-3.5 w-3.5 rounded-full border border-border transition-smooth",
                  i < pin.length
                    ? "bg-primary border-primary"
                    : "bg-background",
                )}
              />
            ),
          )}
        </div>

        {error && (
          <p
            className="mt-3 text-xs font-medium text-destructive"
            data-ocid="lock_error"
          >
            {error}
          </p>
        )}

        <div
          className="mx-auto mt-6 grid max-w-[240px] grid-cols-3 gap-2.5"
          data-ocid="pin_keypad"
        >
          {keys.map((key) => {
            if (key === "") {
              return <span key="empty" />;
            }
            if (key === "back") {
              return (
                <button
                  key="back"
                  type="button"
                  onClick={() => handleKey("back")}
                  disabled={busy}
                  className="flex h-14 items-center justify-center rounded-2xl text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  aria-label="Delete digit"
                  data-ocid="pin_backspace"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                disabled={busy}
                className="h-14 rounded-2xl bg-card font-display text-xl font-semibold shadow-subtle transition-smooth hover:bg-accent hover:text-accent-foreground active:scale-95 disabled:opacity-50"
                aria-label={`Digit ${key}`}
                data-ocid={`pin_key_${key}`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {biometricAvailable && biometricEnabled && (
          <button
            type="button"
            onClick={handleBiometric}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-accent disabled:opacity-60"
            data-ocid="biometric_unlock_button"
          >
            <Fingerprint className="h-4 w-4 text-primary" />
            Unlock with biometrics
          </button>
        )}

        {biometricAvailable && !biometricEnabled && mode === "setup" && (
          <button
            type="button"
            onClick={handleEnableBiometric}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-accent disabled:opacity-60"
            data-ocid="enable_biometric_button"
          >
            <Fingerprint className="h-4 w-4 text-primary" />
            Enable biometric unlock
          </button>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Auto-lock after
          </p>
          <div
            className="mt-2 flex items-center justify-center gap-1.5"
            data-ocid="auto_lock_options"
          >
            {AUTO_LOCK_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onUpdateAutoLock(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-smooth",
                  autoLockMs === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
                data-ocid={`auto_lock_${option.label.toLowerCase()}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your PIN is stored only on this device. Message contents are never
          shown while locked.
        </p>
      </div>
    </div>
  );
}
