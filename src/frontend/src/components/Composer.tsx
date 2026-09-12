import { AttachmentPicker } from "@/components/AttachmentPicker";
import { cn } from "@/lib/utils";
import type { Attachment, Message } from "@/types";
import { FileText, Send, X } from "lucide-react";

function formatSize(size: bigint): string {
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Composer({
  draft,
  onDraftChange,
  onSend,
  isSending,
  replyTo,
  onCancelReply,
  pendingAttachment,
  onRemoveAttachment,
  onAttachment,
  isUploading,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  isSending: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
  pendingAttachment: Attachment | null;
  onRemoveAttachment: () => void;
  onAttachment: (attachment: Attachment) => void;
  isUploading: boolean;
}) {
  const canSend =
    (draft.trim().length > 0 || pendingAttachment !== null) &&
    !isSending &&
    !isUploading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend(draft);
    }
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {replyTo && (
        <div
          className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
          data-ocid="reply_preview"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">
              Replying to {replyTo.attachment ? "a file" : "a message"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {replyTo.text || replyTo.attachment?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground"
            aria-label="Cancel reply"
            data-ocid="cancel_reply_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pendingAttachment && (
        <div
          className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
          data-ocid="attachment_preview"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {pendingAttachment.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {pendingAttachment.kind} · {formatSize(pendingAttachment.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemoveAttachment}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground"
            aria-label="Remove attachment"
            data-ocid="remove_attachment_button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <AttachmentPicker onAttachment={onAttachment} disabled={isSending} />
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message…"
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-[15px] outline-none transition-smooth placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          data-ocid="composer_input"
        />
        <button
          type="button"
          onClick={() => onSend(draft)}
          disabled={!canSend}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-bubble transition-smooth hover:brightness-105 disabled:opacity-50",
          )}
          aria-label="Send message"
          data-ocid="send_button"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
