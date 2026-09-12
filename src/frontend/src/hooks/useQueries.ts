import { createActor } from "@/backend";
import type { Attachment, CallId, MessageId, UserId } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useListMessages() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMessages();
    },
    enabled: !!actor && !isFetching,
    // Poll so a message sent by one user appears on the other device.
    refetchInterval: 3000,
  });
}

export function useGetMessage(id: MessageId) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMessage(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchMessages(term: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["messages", "search", term],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchMessages(term);
    },
    enabled: !!actor && !isFetching && term.trim().length > 0,
  });
}

export function useListCalls() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["calls"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCalls();
    },
    enabled: !!actor && !isFetching,
    // Poll so an incoming call is detected on the other device.
    refetchInterval: 3000,
  });
}

export function useGetCall(id: CallId) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["calls", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCall(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    refetchInterval: 3000,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPartner() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["partner"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPartner();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAuthorizedUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["authorizedUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuthorizedUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPresence(userId: UserId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["presence", userId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getPresence(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 3000,
  });
}

export function useGetTyping(userId: UserId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["typing", userId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getTyping(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 2000,
  });
}

export function useSendMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      text: string;
      replyTo: MessageId | null;
      attachment: Attachment | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.sendMessage(args.text, args.replyTo, args.attachment);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: MessageId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteMessage(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useReactToMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: MessageId; emoji: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.reactToMessage(args.id, args.emoji);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useMarkRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.markRead();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useSetPresence() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (online: boolean) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setPresence(online);
    },
  });
}

export function useSetTyping() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setTyping(isTyping);
    },
  });
}

export function useStartCall() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (callee: UserId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.startCall(callee);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useAcceptCall() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: CallId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.acceptCall(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useEndCall() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: CallId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.endCall(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useSetOffer() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (args: { callId: CallId; sdp: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setOffer(args.callId, args.sdp);
    },
  });
}

export function useGetOffer(callId: CallId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["offer", callId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || callId === null) return null;
      return actor.getOffer(callId);
    },
    enabled: !!actor && !isFetching && callId !== null,
    refetchInterval: 2000,
  });
}

export function useSetAnswer() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (args: { callId: CallId; sdp: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAnswer(args.callId, args.sdp);
    },
  });
}

export function useGetAnswer(callId: CallId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["answer", callId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || callId === null) return null;
      return actor.getAnswer(callId);
    },
    enabled: !!actor && !isFetching && callId !== null,
    refetchInterval: 2000,
  });
}

export function useAddIceCandidate() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (args: { callId: CallId; candidate: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addIceCandidate(args.callId, args.candidate);
    },
  });
}

export function useGetIceCandidates(callId: CallId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["iceCandidates", callId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || callId === null) return [];
      return actor.getIceCandidates(callId);
    },
    enabled: !!actor && !isFetching && callId !== null,
    refetchInterval: 2000,
  });
}
