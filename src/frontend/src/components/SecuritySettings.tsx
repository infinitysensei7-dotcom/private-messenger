import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import { cn } from "@/lib/utils";
import {
  Fingerprint,
  KeyRound,
  Lock,
  LockOpen,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useState } from "react";

const AUTO_LOCK_OPTIONS = [
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
] as const;

export function SecuritySettings() {
  const {
    hasPin,
    biometricEnabled,
    biometricSupported,
    autoLockMinutes,
    isLocked,
    setPin,
    verifyPin,
    removePin,
    setBiometricEnabled,
    setAutoLockMinutes,
    lockNow,
    unlock,
  } = useSecuritySettings();

  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSaved, setPinSaved] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleSavePin = async () => {
    setPinError(null);
    if (pin.length < 4) {
      setPinError("Enter at least 4 characters.");
      return;
    }
    if (pin !== confirmPin) {
      setPinError("The two entries don't match.");
      return;
    }
    await setPin(pin);
    setPinValue("");
    setConfirmPin("");
    setPinSaved(true);
    window.setTimeout(() => setPinSaved(false), 2500);
  };

  const handleRemovePin = async () => {
    removePin();
    setPinValue("");
    setConfirmPin("");
  };

  const handleUnlock = async () => {
    setUnlockError(null);
    const ok = await verifyPin(unlockPin);
    if (!ok) {
      setUnlockError("Incorrect PIN. Try again.");
      return;
    }
    setUnlockPin("");
    unlock();
  };

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
        data-ocid="security_section"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <KeyRound className="h-5 w-5 text-primary" />
          Private channel lock
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a PIN that must be entered to open the private conversation. Your
          PIN is stored as a one-way hash — never in plaintext.
        </p>

        {isLocked ? (
          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-primary" />
              Private channel is locked
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your PIN to unlock and manage security settings.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleUnlock();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="unlock-pin">PIN</Label>
                <Input
                  id="unlock-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={unlockPin}
                  onChange={(event) => setUnlockPin(event.target.value)}
                  placeholder="Enter your PIN"
                  data-ocid="unlock_pin_input"
                />
              </div>
              {unlockError && (
                <p
                  className="text-sm font-medium text-destructive"
                  data-ocid="unlock_error"
                >
                  {unlockError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={unlockPin.length === 0}
                data-ocid="unlock_button"
              >
                <LockOpen className="h-4 w-4" />
                Unlock
              </Button>
            </form>
          </div>
        ) : (
          <>
            {hasPin ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    A PIN is set. Change it below or remove it to open the
                    channel without a PIN.
                  </span>
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSavePin();
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-pin">New PIN</Label>
                      <Input
                        id="new-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={pin}
                        onChange={(event) => setPinValue(event.target.value)}
                        placeholder="New PIN"
                        data-ocid="new_pin_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-pin">Confirm PIN</Label>
                      <Input
                        id="confirm-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={confirmPin}
                        onChange={(event) => setConfirmPin(event.target.value)}
                        placeholder="Confirm PIN"
                        data-ocid="confirm_pin_input"
                      />
                    </div>
                  </div>
                  {pinError && (
                    <p
                      className="text-sm font-medium text-destructive"
                      data-ocid="pin_error"
                    >
                      {pinError}
                    </p>
                  )}
                  {pinSaved && (
                    <p
                      className="text-sm font-medium text-primary"
                      data-ocid="pin_saved"
                    >
                      PIN updated.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      disabled={pin.length === 0 || confirmPin.length === 0}
                      data-ocid="save_pin_button"
                    >
                      Update PIN
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePin}
                      data-ocid="remove_pin_button"
                    >
                      Remove PIN
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <form
                className="mt-5 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSavePin();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="set-pin">PIN</Label>
                    <Input
                      id="set-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      value={pin}
                      onChange={(event) => setPinValue(event.target.value)}
                      placeholder="Choose a PIN"
                      data-ocid="set_pin_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-confirm-pin">Confirm PIN</Label>
                    <Input
                      id="set-confirm-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      value={confirmPin}
                      onChange={(event) => setConfirmPin(event.target.value)}
                      placeholder="Confirm PIN"
                      data-ocid="set_confirm_pin_input"
                    />
                  </div>
                </div>
                {pinError && (
                  <p
                    className="text-sm font-medium text-destructive"
                    data-ocid="pin_error"
                  >
                    {pinError}
                  </p>
                )}
                {pinSaved && (
                  <p
                    className="text-sm font-medium text-primary"
                    data-ocid="pin_saved"
                  >
                    PIN saved.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={pin.length === 0 || confirmPin.length === 0}
                  data-ocid="save_pin_button"
                >
                  Set PIN
                </Button>
              </form>
            )}
          </>
        )}
      </section>

      <section
        className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
        data-ocid="unlock_options_section"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Fingerprint className="h-5 w-5 text-primary" />
          Unlock options
        </h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Biometric unlock</p>
              <p className="text-sm text-muted-foreground">
                {biometricSupported
                  ? "Use your device fingerprint or face to unlock."
                  : "Not supported on this device."}
              </p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={setBiometricEnabled}
              disabled={!biometricSupported || !hasPin}
              aria-label="Biometric unlock"
              data-ocid="biometric_toggle"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Timer className="h-4 w-4 text-primary" />
                Auto-lock after inactivity
              </p>
              <p className="text-sm text-muted-foreground">
                Lock the private channel automatically after a period of no
                activity.
              </p>
            </div>
            <Select
              value={String(autoLockMinutes)}
              onValueChange={(value) => setAutoLockMinutes(Number(value))}
            >
              <SelectTrigger
                className="w-36"
                aria-label="Auto-lock period"
                data-ocid="autolock_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTO_LOCK_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    data-ocid={`autolock_option_${option.value}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
        data-ocid="lock_actions_section"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Lock className="h-5 w-5 text-primary" />
          Lock now
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lock the private channel immediately. You'll need your PIN to open it
          again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={lockNow}
            disabled={!hasPin || isLocked}
            data-ocid="lock_now_button"
          >
            <Lock className="h-4 w-4" />
            Lock now
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={unlock}
            disabled={!isLocked}
            data-ocid="unlock_now_button"
          >
            <LockOpen className="h-4 w-4" />
            Unlock
          </Button>
        </div>
        {!hasPin && (
          <p
            className={cn("mt-3 text-sm text-muted-foreground")}
            data-ocid="lock_hint"
          >
            Set a PIN above to enable locking.
          </p>
        )}
      </section>
    </div>
  );
}
