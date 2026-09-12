import { useCallback, useEffect, useRef, useState } from "react";

const PIN_KEY = "haven.pinHash";
const CREDENTIAL_KEY = "haven.credentialId";
const AUTO_LOCK_KEY = "haven.autoLockMs";
const BIOMETRIC_KEY = "haven.biometricEnabled";

export const AUTO_LOCK_OPTIONS = [
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "5m", value: 300_000 },
  { label: "Never", value: 0 },
] as const;

const DEFAULT_AUTO_LOCK_MS = 60_000;

export type PrivacyLockState = "uninitialized" | "locked" | "unlocked";

function loadPinHash(): string | null {
  return window.localStorage.getItem(PIN_KEY);
}

function loadAutoLockMs(): number {
  const raw = window.localStorage.getItem(AUTO_LOCK_KEY);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_AUTO_LOCK_MS;
}

function loadBiometricEnabled(): boolean {
  return window.localStorage.getItem(BIOMETRIC_KEY) === "1";
}

function loadCredentialId(): string | null {
  return window.localStorage.getItem(CREDENTIAL_KEY);
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`haven:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function webAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

function randomChallenge(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(32));
  crypto.getRandomValues(bytes);
  return bytes;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Single consolidated privacy lock. Owns the PIN hash, biometric credential,
 * auto-lock period, and the locked/unlocked state machine. Auto-locks on
 * backgrounding and after a configurable inactivity period, and exposes an
 * immediate lock control.
 */
export function usePrivacyLock() {
  const [state, setState] = useState<PrivacyLockState>("uninitialized");
  const [autoLockMs, setAutoLockMs] = useState<number>(loadAutoLockMs);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] =
    useState<boolean>(loadBiometricEnabled);
  const [error, setError] = useState<string | null>(null);

  const inactivityRef = useRef<number | null>(null);
  const stateRef = useRef<PrivacyLockState>("uninitialized");
  stateRef.current = state;

  const clearInactivity = useCallback(() => {
    if (inactivityRef.current !== null) {
      window.clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
  }, []);

  const lock = useCallback(() => {
    clearInactivity();
    setState("locked");
  }, [clearInactivity]);

  const armInactivity = useCallback(() => {
    clearInactivity();
    if (autoLockMs <= 0) return;
    inactivityRef.current = window.setTimeout(() => {
      if (stateRef.current === "unlocked") {
        setState("locked");
      }
    }, autoLockMs);
  }, [autoLockMs, clearInactivity]);

  useEffect(() => {
    setState(loadPinHash() ? "locked" : "uninitialized");
    setBiometricAvailable(webAuthnSupported());
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [lock]);

  useEffect(() => {
    if (state !== "unlocked") return;
    armInactivity();
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
    ];
    const onActivity = () => armInactivity();
    for (const event of events) {
      window.addEventListener(event, onActivity);
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
      clearInactivity();
    };
  }, [state, armInactivity, clearInactivity]);

  const setupPin = useCallback(async (pin: string) => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return false;
    }
    const hash = await hashPin(pin);
    window.localStorage.setItem(PIN_KEY, hash);
    setState("unlocked");
    setError(null);
    return true;
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const stored = loadPinHash();
    if (!stored) {
      setError("No PIN is set up yet.");
      return false;
    }
    const hash = await hashPin(pin);
    if (hash !== stored) {
      setError("Incorrect PIN. Try again.");
      return false;
    }
    setState("unlocked");
    setError(null);
    return true;
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    const stored = loadPinHash();
    if (!stored) return false;
    const hash = await hashPin(pin);
    return hash === stored;
  }, []);

  const unlockNow = useCallback(() => {
    setState("unlocked");
    setError(null);
  }, []);

  const removePin = useCallback(() => {
    window.localStorage.removeItem(PIN_KEY);
    window.localStorage.removeItem(CREDENTIAL_KEY);
    window.localStorage.removeItem(BIOMETRIC_KEY);
    setBiometricEnabledState(false);
    setState("uninitialized");
    setError(null);
  }, []);

  const updateAutoLock = useCallback((ms: number) => {
    setAutoLockMs(ms);
    window.localStorage.setItem(AUTO_LOCK_KEY, String(ms));
  }, []);

  const setAutoLockMinutes = useCallback(
    (minutes: number) => {
      updateAutoLock(minutes * 60_000);
    },
    [updateAutoLock],
  );

  const enableBiometric = useCallback(async () => {
    if (!webAuthnSupported()) {
      setError("Biometric unlock is not supported on this device.");
      return false;
    }
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: "Haven" },
          user: {
            id: randomChallenge(),
            name: "haven-user",
            displayName: "Haven User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60_000,
        },
      });
      if (!credential) {
        setError("Biometric setup was cancelled.");
        return false;
      }
      const id = (credential as PublicKeyCredential).id;
      window.localStorage.setItem(CREDENTIAL_KEY, id);
      window.localStorage.setItem(BIOMETRIC_KEY, "1");
      setBiometricEnabledState(true);
      setError(null);
      return true;
    } catch {
      setError("Could not set up biometric unlock.");
      return false;
    }
  }, []);

  const disableBiometric = useCallback(() => {
    window.localStorage.removeItem(CREDENTIAL_KEY);
    window.localStorage.removeItem(BIOMETRIC_KEY);
    setBiometricEnabledState(false);
  }, []);

  const setBiometricEnabled = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        void enableBiometric();
      } else {
        disableBiometric();
      }
    },
    [enableBiometric, disableBiometric],
  );

  const unlockWithBiometric = useCallback(async () => {
    const credentialId = loadCredentialId();
    if (!credentialId || !webAuthnSupported()) {
      setError("Biometric unlock is not set up.");
      return false;
    }
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: [
            {
              type: "public-key",
              id: base64UrlToBytes(credentialId),
            },
          ],
          userVerification: "required",
          timeout: 60_000,
        },
      });
      if (!credential) {
        setError("Biometric unlock was cancelled.");
        return false;
      }
      setState("unlocked");
      setError(null);
      return true;
    } catch {
      setError("Biometric unlock failed.");
      return false;
    }
  }, []);

  return {
    state,
    error,
    autoLockMs,
    autoLockMinutes: Math.round(autoLockMs / 60_000),
    biometricAvailable,
    biometricSupported: biometricAvailable,
    biometricEnabled,
    hasPin: state !== "uninitialized",
    isLocked: state === "locked",
    setupPin,
    unlock,
    verifyPin,
    unlockNow,
    lock,
    lockNow: lock,
    updateAutoLock,
    setAutoLockMinutes,
    enableBiometric,
    disableBiometric,
    setBiometricEnabled,
    unlockWithBiometric,
    removePin,
    recordActivity: armInactivity,
  };
}
