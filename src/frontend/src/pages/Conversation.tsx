import { AccessDenied } from "@/components/AccessDenied";
import { Composer } from "@/components/Composer";
import { LockScreen } from "@/components/LockScreen";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageSearch } from "@/components/MessageSearch";
import { usePrivacyLock } from "@/hooks/usePrivacyLock";
import {
  timestampToDate,
  useDeleteMessage,
  useGetAuthorizedUsers,
  useGetCallerUserRole,
  useGetPartner,
  useGetPresence,
  useGetTyping,
  useListMessages,
  useMarkRead,
  useReactToMessage,
  useSendMessage,
  useSetPresence,
  useSetTyping,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { type UserId, UserRole } from "@/types";
import type { Attachment, Message, MessageId } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import {
  CloudOff,
  Fingerprint,
  Lock,
  LockOpen,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DRAFT_KEY = "haven.draft";

function IdentityLockScreen({
  onUnlock,
  isInitializing,
  isLoggingIn,
}: {
  onUnlock: () => void;
  isInitializing: boolean;
  isLoggingIn: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div
        className="frosted w-full max-w-sm rounded-3xl border border-border p-8 text-center shadow-elevated animate-slide-up"
        data-ocid="lock_screen"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Private Channel
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This conversation is locked. Unlock with your Internet Identity to
          prove you are one of the two authorized accounts.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Fingerprint className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Biometric unlock
          </span>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          disabled={isInitializing || isLoggingIn}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-bubble transition-smooth hover:brightness-105 disabled:opacity-60"
          data-ocid="unlock_button"
        >
          {isInitializing
            ? "Preparing…"
            : isLoggingIn
              ? "Authenticating…"
              : "Unlock"}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Your identity is verified by Internet Identity. Nothing is stored on
          this device.
        </p>
      </div>
    </div>
  );
}

type PendingSend = {
  text: string;
  replyTo: MessageId | null;
  attachment: Attachment | null;
};

function Thread({ onLock }: { onLock: () => void }) {
  const { identity } = useInternetIdentity();
  const { data: messages = [], isLoading } = useListMessages();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const reactToMessage = useReactToMessage();
  const markRead = useMarkRead();
  const setPresence = useSetPresence();
  const setTyping = useSetTyping();

  const myPrincipal = identity?.getPrincipal();

  const { data: partner } = useGetPartner();
  const { data: authorizedUsers = [] } = useGetAuthorizedUsers();

  // The other participant is the partner reported by the backend, falling back
  // to the authorized user that isn't us — so presence and typing work even
  // before the partner has sent a message.
  const otherUser = useMemo<UserId | null>(() => {
    if (!myPrincipal) return null;
    if (partner) return partner;
    return (
      authorizedUsers.find(
        (user) => user.toString() !== myPrincipal.toString(),
      ) ?? null
    );
  }, [partner, authorizedUsers, myPrincipal]);

  const { data: otherPresence } = useGetPresence(otherUser);
  const { data: otherTyping } = useGetTyping(otherUser);

  const [draft, setDraft] = useState<string>(
    () => localStorage.getItem(DRAFT_KEY) ?? "",
  );
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(
    null,
  );
  const [pendingQueue, setPendingQueue] = useState<PendingSend[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isAtBottomRef = useRef(isAtBottom);
  isAtBottomRef.current = isAtBottom;

  // Persist draft across reloads.
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, draft);
  }, [draft]);

  // Presence + mark read on mount.
  const presenceRef = useRef(setPresence);
  presenceRef.current = setPresence;
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    void presenceRef.current.mutate(true);
    void markReadRef.current.mutate();
    return () => {
      void presenceRef.current.mutate(false);
    };
  }, []);

  // Track online/offline for the queue.
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Flush the offline queue when back online.
  useEffect(() => {
    if (isOffline || pendingQueue.length === 0) return;
    const queue = [...pendingQueue];
    setPendingQueue([]);
    for (const item of queue) {
      sendMessageRef.current.mutate(item);
    }
  }, [isOffline, pendingQueue]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed && !pendingAttachment) return;
      const item: PendingSend = {
        text: trimmed,
        replyTo: replyTo?.id ?? null,
        attachment: pendingAttachment,
      };
      setDraft("");
      setReplyTo(null);
      setPendingAttachment(null);
      sendMessage.mutate(item, {
        onError: () => {
          // Queue for retry when the connection is restored.
          setPendingQueue((current) => [...current, item]);
        },
      });
    },
    [pendingAttachment, replyTo, sendMessage],
  );

  const handleTyping = (value: string) => {
    setDraft(value);
    void setTyping.mutate(value.trim().length > 0);
  };

  const handleAttachment = (attachment: Attachment) => {
    setPendingAttachment(attachment);
  };

  const handleJump = useCallback((messageId: MessageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Scroll to bottom when new messages arrive and we're at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    if (isAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  // Track unread when new messages arrive while scrolled up.
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (messages.length > prev && !isAtBottomRef.current) {
      setUnreadCount((count) => count + (messages.length - prev));
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
    if (atBottom && unreadCount > 0) {
      setUnreadCount(0);
      void markReadRef.current.mutate();
    }
  };

  const messageById = useMemo(() => {
    const map = new Map<MessageId, Message>();
    for (const message of messages) map.set(message.id, message);
    return map;
  }, [messages]);

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    for (const message of messages) {
      const date = timestampToDate(message.timestamp);
      const label = date
        ? date.toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "Unknown";
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(message);
      } else {
        groups.push({ label, items: [message] });
      }
    }
    return groups;
  }, [messages]);

  const otherIsOnline = otherPresence?.online ?? false;
  const otherIsTyping = otherTyping?.isTyping ?? false;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary">
          H
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold tracking-tight">
            Private Channel
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {otherIsTyping ? (
              <span className="flex items-center gap-1 text-primary">
                typing
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary" />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.3s" }}
                  />
                </span>
              </span>
            ) : (
              <>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    otherIsOnline ? "bg-primary" : "bg-muted-foreground/50",
                  )}
                />
                {otherIsOnline ? "Online" : "Offline"}
              </>
            )}
          </p>
        </div>
        <MessageSearch onJump={handleJump} />
        <button
          type="button"
          onClick={onLock}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground"
          aria-label="Lock the private channel now"
          data-ocid="lock_now_button"
        >
          <LockOpen className="h-5 w-5" />
        </button>
        <Link
          to="/call"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground"
          aria-label="Open call screen"
          data-ocid="call_link"
        >
          <Phone className="h-5 w-5" />
        </Link>
      </div>

      {isOffline && (
        <div
          className="flex items-center gap-2 border-b border-border bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive"
          data-ocid="offline_banner"
        >
          <CloudOff className="h-4 w-4" />
          You're offline. Messages will send when you reconnect.
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto px-4 py-4"
        data-ocid="message_list"
      >
        {isLoading ? (
          <div className="space-y-3" data-ocid="loading_state">
            {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
              <div
                key={id}
                className={cn(
                  "h-12 w-2/3 animate-pulse rounded-2xl bg-muted",
                  id.endsWith("0") || id.endsWith("2") || id.endsWith("4")
                    ? "ml-auto"
                    : "",
                )}
              />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div
            className="flex h-full flex-col items-center justify-center text-center"
            data-ocid="empty_state"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold tracking-tight">
              No messages yet
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Say hello to start the private conversation.
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <div className="flex justify-center py-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </span>
              </div>
              {group.items.map((message) => (
                <div key={message.id} id={`msg-${message.id}`}>
                  <MessageBubble
                    message={message}
                    isMine={
                      myPrincipal?.toString() === message.sender.toString()
                    }
                    replyMessage={
                      message.replyTo
                        ? (messageById.get(message.replyTo) ?? null)
                        : null
                    }
                    onDelete={(id) => deleteMessage.mutate(id)}
                    onReact={(id, emoji) =>
                      reactToMessage.mutate({ id, emoji })
                    }
                    onReply={(msg) => setReplyTo(msg)}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-bubble transition-smooth hover:brightness-105"
          data-ocid="unread_badge"
        >
          {unreadCount} new
        </button>
      )}

      <Composer
        draft={draft}
        onDraftChange={handleTyping}
        onSend={handleSend}
        isSending={sendMessage.isPending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        pendingAttachment={pendingAttachment}
        onRemoveAttachment={() => setPendingAttachment(null)}
        onAttachment={handleAttachment}
        isUploading={false}
      />

      {sendMessage.isError && (
        <p
          className="border-t border-border bg-card px-4 py-2 text-xs text-destructive"
          data-ocid="error_state"
        >
          Could not send your message. It's queued and will retry when you're
          back online.
        </p>
      )}
    </div>
  );
}

export function ConversationPage() {
  const { isAuthenticated, identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { data: role, isLoading: roleLoading } = useGetCallerUserRole();
  const { data: authorizedUsers = [], isLoading: usersLoading } =
    useGetAuthorizedUsers();
  const privacyLock = usePrivacyLock();

  if (!isAuthenticated) {
    return (
      <IdentityLockScreen
        onUnlock={login}
        isInitializing={isInitializing}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  if (roleLoading || !role || usersLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        data-ocid="loading_state"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // The private channel is restricted to the two pre-authorized accounts. A
  // registered user who is not on the allow-list must not see the private UI,
  // even though the backend grants them the #user role.
  const myPrincipal = identity?.getPrincipal();
  const isAuthorized =
    !!myPrincipal &&
    authorizedUsers.some((user) => user.toString() === myPrincipal.toString());

  if (role === UserRole.guest || !isAuthorized) {
    return <AccessDenied />;
  }

  // The private conversation is gated behind the PIN/biometric privacy lock.
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

  return <Thread onLock={privacyLock.lock} />;
}
