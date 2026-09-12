import type { CallId } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus =
  | "idle"
  | "requesting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface WebRTCSignaling {
  setOffer: (callId: CallId, sdp: string) => Promise<void>;
  getOffer: (callId: CallId) => Promise<string | null>;
  setAnswer: (callId: CallId, sdp: string) => Promise<void>;
  getAnswer: (callId: CallId) => Promise<string | null>;
  addIceCandidate: (callId: CallId, candidate: string) => Promise<void>;
  getIceCandidates: (callId: CallId) => Promise<string[]>;
}

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const POLL_INTERVAL_MS = 2000;

export function useWebRTC(signaling: WebRTCSignaling) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<CallId | null>(null);
  const roleRef = useRef<"caller" | "callee" | null>(null);
  const signalingRef = useRef(signaling);
  signalingRef.current = signaling;
  const pollRef = useRef<number | null>(null);
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const remoteDescSetRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopPolling();
    for (const sender of peerRef.current?.getSenders() ?? []) {
      sender.track?.stop();
    }
    peerRef.current?.close();
    peerRef.current = null;
    for (const track of localStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    localStreamRef.current = null;
    callIdRef.current = null;
    roleRef.current = null;
    addedCandidatesRef.current = new Set();
    remoteDescSetRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus("idle");
    setIsMuted(false);
    setIsSpeakerOn(true);
  }, [stopPolling]);

  const requestMicrophone = useCallback(async () => {
    setPermissionError(null);
    setConnectionStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      setConnectionStatus("error");
      setPermissionError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access in your browser to make calls."
          : "Could not access your microphone. Check that a microphone is connected.",
      );
      return null;
    }
  }, []);

  const createPeer = useCallback((stream: MediaStream) => {
    const peer = new RTCPeerConnection(STUN_SERVERS);
    for (const track of stream.getTracks()) {
      peer.addTrack(track, stream);
    }
    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? null);
    };
    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") setConnectionStatus("connected");
      else if (state === "connecting") setConnectionStatus("connecting");
      else if (state === "disconnected" || state === "failed")
        setConnectionStatus("disconnected");
      else if (state === "closed") setConnectionStatus("idle");
    };
    peer.onicecandidate = (event) => {
      const callId = callIdRef.current;
      if (!callId || !event.candidate) return;
      const candidate = event.candidate.toJSON();
      const key = `${candidate.candidate}:${candidate.sdpMid}:${candidate.sdpMLineIndex}`;
      if (addedCandidatesRef.current.has(key)) return;
      addedCandidatesRef.current.add(key);
      void signalingRef.current
        .addIceCandidate(callId, JSON.stringify(candidate))
        .catch(() => undefined);
    };
    peerRef.current = peer;
    return peer;
  }, []);

  const pollIceCandidates = useCallback(async () => {
    const callId = callIdRef.current;
    const peer = peerRef.current;
    if (callId === null || !peer) return;
    try {
      const candidates = await signalingRef.current.getIceCandidates(callId);
      for (const raw of candidates) {
        if (addedCandidatesRef.current.has(raw)) continue;
        addedCandidatesRef.current.add(raw);
        try {
          await peer.addIceCandidate(JSON.parse(raw) as RTCIceCandidateInit);
        } catch {
          // Ignore candidates that fail to apply.
        }
      }
    } catch {
      // Polling errors are transient; keep trying.
    }
  }, []);

  const startPolling = useCallback(
    (interval: () => void) => {
      stopPolling();
      pollRef.current = window.setInterval(() => {
        void interval();
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const startCall = useCallback(
    async (callId: CallId) => {
      const stream = await requestMicrophone();
      if (!stream) return false;
      setConnectionStatus("connecting");
      const peer = createPeer(stream);
      callIdRef.current = callId;
      roleRef.current = "caller";
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await signalingRef.current.setOffer(callId, JSON.stringify(offer));
      } catch {
        setConnectionStatus("error");
        return false;
      }
      // Poll for the callee's answer and ICE candidates.
      startPolling(async () => {
        const answer = await signalingRef.current.getAnswer(callId);
        if (answer && !remoteDescSetRef.current) {
          remoteDescSetRef.current = true;
          await peer.setRemoteDescription(
            JSON.parse(answer) as RTCSessionDescriptionInit,
          );
        }
        await pollIceCandidates();
      });
      return true;
    },
    [requestMicrophone, createPeer, startPolling, pollIceCandidates],
  );

  const acceptCall = useCallback(
    async (callId: CallId) => {
      const stream = await requestMicrophone();
      if (!stream) return false;
      setConnectionStatus("connecting");
      const peer = createPeer(stream);
      callIdRef.current = callId;
      roleRef.current = "callee";
      // Poll for the caller's offer, then answer.
      startPolling(async () => {
        const offer = await signalingRef.current.getOffer(callId);
        if (offer && !remoteDescSetRef.current) {
          remoteDescSetRef.current = true;
          await peer.setRemoteDescription(
            JSON.parse(offer) as RTCSessionDescriptionInit,
          );
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await signalingRef.current.setAnswer(callId, JSON.stringify(answer));
        }
        await pollIceCandidates();
      });
      return true;
    },
    [requestMicrophone, createPeer, startPolling, pollIceCandidates],
  );

  const endCall = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const declineCall = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      for (const track of localStreamRef.current?.getAudioTracks() ?? []) {
        track.enabled = !next;
      }
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      const audio = document.querySelector<HTMLAudioElement>(
        "audio[data-call-remote]",
      );
      if (audio && "setSinkId" in audio) {
        void (
          audio as HTMLAudioElement & {
            setSinkId(id: string): Promise<void>;
          }
        ).setSinkId(next ? "" : "default");
      }
      return next;
    });
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    isMuted,
    isSpeakerOn,
    permissionError,
    startCall,
    acceptCall,
    endCall,
    declineCall,
    toggleMute,
    toggleSpeaker,
  };
}
