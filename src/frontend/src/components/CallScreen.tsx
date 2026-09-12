import type { ConnectionStatus } from "@/hooks/useWebRTC";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

const statusLabel: Record<ConnectionStatus, string> = {
  idle: "Idle",
  requesting: "Requesting microphone…",
  connecting: "Connecting…",
  connected: "Connected",
  disconnected: "Connection lost",
  error: "Microphone unavailable",
};

function useElapsed(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CallScreen({
  isOutgoing,
  connectionStatus,
  isMuted,
  isSpeakerOn,
  remoteStream,
  onToggleMute,
  onToggleSpeaker,
  onEnd,
}: {
  isOutgoing: boolean;
  connectionStatus: ConnectionStatus;
  isMuted: boolean;
  isSpeakerOn: boolean;
  remoteStream: MediaStream | null;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEnd: () => void;
}) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const elapsed = useElapsed(startedAt);

  useEffect(() => {
    if (connectionStatus === "connected" && startedAt === null) {
      setStartedAt(Date.now());
    }
  }, [connectionStatus, startedAt]);

  const isConnected = connectionStatus === "connected";

  return (
    <div
      className="frosted flex flex-col items-center rounded-3xl border border-border px-6 py-8 text-center shadow-elevated animate-slide-up"
      data-ocid="call_screen"
    >
      <audio
        data-call-remote
        ref={(node) => {
          if (node && remoteStream) {
            node.srcObject = remoteStream;
            void node.play().catch(() => undefined);
          }
        }}
        autoPlay
        className="hidden"
      >
        <track kind="captions" />
      </audio>

      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/30" />
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 font-display text-3xl font-bold text-primary">
          H
        </span>
      </div>

      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Private Channel
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isOutgoing ? "Calling…" : "Incoming call"}
      </p>

      <div
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
          isConnected
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
        data-ocid="connection_status"
      >
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
        {statusLabel[connectionStatus]}
      </div>

      {isConnected && (
        <p
          className="mt-3 font-mono text-2xl font-semibold tabular-nums"
          data-ocid="call_timer"
        >
          {formatElapsed(elapsed)}
        </p>
      )}

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onToggleMute}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-bubble transition-smooth hover:brightness-105",
            isMuted
              ? "bg-destructive text-destructive-foreground"
              : "bg-card text-foreground",
          )}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          data-ocid="mute_button"
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>

        <button
          type="button"
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-bubble transition-smooth hover:brightness-105"
          aria-label="End call"
          data-ocid="end_call_button"
        >
          <PhoneOff className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={onToggleSpeaker}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-bubble transition-smooth hover:brightness-105",
            isSpeakerOn
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground",
          )}
          aria-label={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
          data-ocid="speaker_button"
        >
          {isSpeakerOn ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}
