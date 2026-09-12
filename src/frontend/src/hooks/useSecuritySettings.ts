import { usePrivacyLock } from "@/hooks/usePrivacyLock";

/**
 * Thin compatibility wrapper over the consolidated privacy lock. Kept so the
 * Settings surface can keep its existing API while all PIN/biometric state
 * lives in a single source of truth (usePrivacyLock).
 */
export function useSecuritySettings() {
  const lock = usePrivacyLock();

  return {
    hasPin: lock.hasPin,
    biometricEnabled: lock.biometricEnabled,
    biometricSupported: lock.biometricSupported,
    autoLockMinutes: lock.autoLockMinutes,
    isLocked: lock.isLocked,
    setPin: lock.setupPin,
    verifyPin: lock.verifyPin,
    removePin: lock.removePin,
    setBiometricEnabled: lock.setBiometricEnabled,
    setAutoLockMinutes: lock.setAutoLockMinutes,
    lockNow: lock.lockNow,
    unlock: lock.unlockNow,
    recordActivity: lock.recordActivity,
  };
}
