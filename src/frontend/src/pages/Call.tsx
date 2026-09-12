import { createActor } from "@/backend";
import { AccessDenied } from "@/components/AccessDenied";
import { CallScreen } from "@/components/CallScreen";
import { IncomingCall } from "@/components/IncomingCall";
import { LockScreen } from "@/components/LockScreen";
import { usePrivacyLock } from "@/hooks/usePrivacyLock";
import {
  timestampToDate,
  useAcceptCall,
  useEndCall,
  useGetAuthorizedUsers,
  useGetPartner,
  useListCalls,
  useStartCall,
} from "@/hooks/useQueries";
import { useWebRTC } from "@/hooks/useWebRTC";
import type { WebRTCSignaling } from "@/hooks/useWebRTC";
import { cn } from "@/lib/utils";
import { type CallId, CallStatus, type UserId } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusLabel: Record<CallStatus, string> = {
  [CallStatus.ringing]: "Ringing",
  [CallStatus.ongoing]: "Ongoing",
  [CallStatus.ended]: "Ended",
  [CallStatus.missed]: "Missed",
  [CallStatus.declined]: "Declined",
};

type CallState = "idle" | "outgoing" | "incoming" | "active";

function CallRow({
  call,
  onEnd,
}: {
  call: {
    id: bigint;
    status: CallStatus;
    startedAt: bigint;
  };
  onEnd: (id: bigint) => void;
}) {
  const date = timestampToDate(call.startedAt);
  const time = date
    ? date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const isMissed =
    call.status === CallStatus.missed || call.status === CallStatus.declined;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle"
      data-ocid={`call_item_${call.id}`}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isMissed
            ? "bg-destructive/15 text-destructive"
            : "bg-primary/15 text-primary",
        )}
      >
        {isMissed ? (
          <PhoneMissed className="h-5 w-5" />
        ) : (
          <PhoneCall className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{statusLabel[call.status]}</p>
        <p className="font-mono text-xs text-muted-foreground">{time}</p>
      </div>
      {call.status === CallStatus.ongoing && (
        <button
          type="button"
          onClick={() => onEnd(call.id)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-smooth hover:brightness-105"
          aria-label="End call"
          data-ocid={`end_call_button_${call.id}`}
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function CallPage() {
  const { isAuthenticated, identity } = useInternetIdentity();
  const privacyLock = usePrivacyLock();
  const { actor } = useActor(createActor);
  const { data: calls = [], isLoading } = useListCalls();
  const { data: partner } = useGetPartner();
  const { data: authorizedUsers = [] } = useGetAuthorizedUsers();
  const endCall = useEndCall();
  const acceptCallBackend = useAcceptCall();
  const startCallBackend = useStartCall();
  const [callState, setCallState] = useState<CallState>("idle");
  const [activeCallId, setActiveCallId] = useState<CallId | null>(null);

  const myPrincipal = identity?.getPrincipal().toString();

  // The private channel has exactly two authorized accounts. The "other"
  // participant is the partner reported by the backend, falling back to the
  // authorized user that isn't us — so the call target is known even before
  // the partner has sent a message.
  const otherUser = useMemo<UserId | null>(() => {
    const mine = identity?.getPrincipal();
    if (!mine) return null;
    if (partner) return partner;
    return (
      authorizedUsers.find((user) => user.toString() !== mine.toString()) ??
      null
    );
  }, [partner, authorizedUsers, identity]);

  const signaling = useMemo<WebRTCSignaling>(
    () => ({
      setOffer: async (callId, sdp) => {
        if (!actor) throw new Error("Backend is not ready");
        await actor.setOffer(callId, sdp);
      },
      getOffer: async (callId) => {
        if (!actor) return null;
        return actor.getOffer(callId);
      },
      setAnswer: async (callId, sdp) => {
        if (!actor) throw new Error("Backend is not ready");
        await actor.setAnswer(callId, sdp);
      },
      getAnswer: async (callId) => {
        if (!actor) return null;
        return actor.getAnswer(callId);
      },
      addIceCandidate: async (callId, candidate) => {
        if (!actor) throw new Error("Backend is not ready");
        await actor.addIceCandidate(callId, candidate);
      },
      getIceCandidates: async (callId) => {
        if (!actor) return [];
        return actor.getIceCandidates(callId);
      },
    }),
    [actor],
  );

  const webRTC = useWebRTC(signaling);

  const incomingCall = calls.find(
    (call) =>
      call.status === CallStatus.ringing &&
      call.callee.toString() === myPrincipal,
  );

  useEffect(() => {
    if (callState !== "idle") return;
    const incoming = calls.find(
      (call) =>
        call.status === CallStatus.ringing &&
        call.callee.toString() === myPrincipal,
    );
    if (incoming) setCallState("incoming");
  }, [calls, myPrincipal, callState]);

  const handleStartCall = useCallback(() => {
    if (!otherUser) return;
    setCallState("outgoing");
    startCallBackend.mutate(otherUser, {
      onSuccess: (callId) => {
        setActiveCallId(callId);
        void webRTC.startCall(callId);
      },
      onError: () => {
        setCallState("idle");
      },
    });
  }, [otherUser, startCallBackend, webRTC]);

  const handleAccept = useCallback(() => {
    if (!incomingCall) return;
    setCallState("active");
    setActiveCallId(incomingCall.id);
    // Transition the ringing call to #ongoing on the backend so it reaches a
    // terminal state in history and the in-history end button renders.
    acceptCallBackend.mutate(incomingCall.id);
    void webRTC.acceptCall(incomingCall.id);
  }, [incomingCall, acceptCallBackend, webRTC]);

  const handleDecline = useCallback(() => {
    if (incomingCall) endCall.mutate(incomingCall.id);
    webRTC.declineCall();
    setActiveCallId(null);
    setCallState("idle");
  }, [incomingCall, endCall, webRTC]);

  const handleEnd = useCallback(() => {
    // End the active call regardless of its status (ringing or ongoing) so it
    // reaches a terminal state in history and the in-history end button renders.
    if (activeCallId !== null) endCall.mutate(activeCallId);
    webRTC.endCall();
    setActiveCallId(null);
    setCallState("idle");
  }, [activeCallId, endCall, webRTC]);

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center py-8 text-center"
        data-ocid="call_unauthorized"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Phone className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Sign in to see calls
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Call history is private to the two authorized accounts. Sign in from
          the Private Channel to continue.
        </p>
      </div>
    );
  }

  // The private call history is restricted to the two pre-authorized accounts.
  // A registered user who is not on the allow-list must not see the private
  // call UI, even though the backend grants them the #user role.
  const isAuthorized =
    !!myPrincipal &&
    authorizedUsers.some((user) => user.toString() === myPrincipal);

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  // Private call history and the call screen are gated behind the same
  // PIN/biometric privacy lock as the private conversation.
  if (privacyLock.state === "uninitialized") {
    return (
      <LockScreen
        mode="setup"
        error={privacyLock.error}
        autoLockMs={privacyLock.autoLockMs}
        biometricAvailable={privacyLock.biometricAvailable}
        biometricEnabled={privacyLock.biometricEnabled}
        onSetupPin={privacyLock.setupPin}
        onUnlock={privacyLock.unlock}
        onUnlockWithBiometric={privacyLock.unlockWithBiometric}
        onEnableBiometric={privacyLock.enableBiometric}
        onUpdateAutoLock={privacyLock.updateAutoLock}
      />
    );
  }

  if (privacyLock.state === "locked") {
    return (
      <LockScreen
        mode="unlock"
        error={privacyLock.error}
        autoLockMs={privacyLock.autoLockMs}
        biometricAvailable={privacyLock.biometricAvailable}
        biometricEnabled={privacyLock.biometricEnabled}
        onSetupPin={privacyLock.setupPin}
        onUnlock={privacyLock.unlock}
        onUnlockWithBiometric={privacyLock.unlockWithBiometric}
        onEnableBiometric={privacyLock.enableBiometric}
        onUpdateAutoLock={privacyLock.updateAutoLock}
      />
    );
  }

  if (callState === "incoming") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-8">
        <IncomingCall onAccept={handleAccept} onDecline={handleDecline} />
      </div>
    );
  }

  if (callState === "outgoing" || callState === "active") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-8">
        <CallScreen
          isOutgoing={callState === "outgoing"}
          connectionStatus={webRTC.connectionStatus}
          isMuted={webRTC.isMuted}
          isSpeakerOn={webRTC.isSpeakerOn}
          remoteStream={webRTC.remoteStream}
          onToggleMute={webRTC.toggleMute}
          onToggleSpeaker={webRTC.toggleSpeaker}
          onEnd={handleEnd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Private calls
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Call history
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Start a private voice call with your channel partner and review past
          calls.
        </p>
      </section>

      <section className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleStartCall}
          disabled={startCallBackend.isPending || !otherUser}
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-bubble transition-smooth hover:brightness-105 disabled:opacity-60"
          data-ocid="start_call_button"
        >
          <PhoneCall className="h-5 w-5" />
          Start voice call
        </button>
        {!otherUser && (
          <p
            className="max-w-sm text-center text-sm text-muted-foreground"
            data-ocid="no_partner_hint"
          >
            No channel partner is configured yet. Ask an admin to authorize a
            second account before you can call.
          </p>
        )}
        {webRTC.permissionError && (
          <p
            className="max-w-sm text-center text-sm text-destructive"
            data-ocid="error_state"
          >
            {webRTC.permissionError}
          </p>
        )}
      </section>

      <section className="space-y-3" data-ocid="call_list">
        {isLoading ? (
          <div className="space-y-3" data-ocid="loading_state">
            {Array.from({ length: 3 }, (_, i) => `call-skeleton-${i}`).map(
              (id) => (
                <div
                  key={id}
                  className="h-16 animate-pulse rounded-2xl bg-muted"
                />
              ),
            )}
          </div>
        ) : calls.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center"
            data-ocid="empty_state"
          >
            <Phone className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No calls yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your private call history will appear here.
            </p>
          </div>
        ) : (
          calls.map((call) => (
            <CallRow
              key={call.id}
              call={call}
              onEnd={(id) => endCall.mutate(id)}
            />
          ))
        )}
      </section>
    </div>
  );
}
