import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { timestampToDate } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Attachment, Message, MessageId } from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  MessageSquareQuote,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatSize(size: bigint): string {
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function downloadAttachment(attachment: Attachment) {
  const blob = ExternalBlob.fromURL(attachment.url);
  const bytes = await blob.getBytes();
  const url = URL.createObjectURL(new Blob([bytes]));
  const a = document.createElement("a");
  a.href = url;
  a.download = attachment.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.kind === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl"
        data-ocid="attachment_image"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-72 w-full object-cover"
        />
      </a>
    );
  }

  if (attachment.kind === "video") {
    return (
      <video
        src={attachment.url}
        controls
        className="max-h-72 w-full rounded-xl bg-black/20"
        data-ocid="attachment_video"
      >
        <track kind="captions" />
      </video>
    );
  }

  if (attachment.kind === "audio") {
    return (
      <audio
        src={attachment.url}
        controls
        className="w-full"
        data-ocid="attachment_audio"
      >
        <track kind="captions" />
      </audio>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
      data-ocid="attachment_file"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {attachment.kind === "pdf" ? "PDF" : "Document"} ·{" "}
          {formatSize(attachment.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void downloadAttachment(attachment)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground"
        aria-label={`Download ${attachment.name}`}
        data-ocid="attachment_download_button"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  replyMessage,
  onDelete,
  onReact,
  onReply,
}: {
  message: Message;
  isMine: boolean;
  replyMessage?: Message | null;
  onDelete: (id: MessageId) => void;
  onReact: (id: MessageId, emoji: string) => void;
  onReply: (message: Message) => void;
}) {
  const [copied, setCopied] = useState(false);
  const date = timestampToDate(message.timestamp);
  const time = date
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable; ignore.
    }
  };

  return (
    <div
      className={cn("group flex", isMine ? "justify-end" : "justify-start")}
      data-ocid={`message_item_${message.id}`}
    >
      <div
        className={cn(
          "bubble-tail max-w-[82%] rounded-2xl px-4 py-2.5 shadow-bubble",
          isMine
            ? "bubble-tail-sent bg-primary text-primary-foreground"
            : "bubble-tail-received bg-card text-foreground",
        )}
      >
        {replyMessage && (
          <button
            type="button"
            onClick={() => onReply(replyMessage)}
            className={cn(
              "mb-2 flex w-full items-start gap-2 rounded-lg border-l-2 px-2.5 py-1.5 text-left",
              isMine
                ? "border-primary-foreground/50 bg-primary-foreground/10"
                : "border-primary bg-muted",
            )}
            data-ocid="reply_quote"
          >
            <MessageSquareQuote
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                isMine ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-xs font-semibold",
                  isMine ? "text-primary-foreground/80" : "text-foreground",
                )}
              >
                {replyMessage.attachment
                  ? replyMessage.attachment.name
                  : "Reply"}
              </p>
              <p
                className={cn(
                  "line-clamp-1 text-xs",
                  isMine
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {replyMessage.text || "Shared a file"}
              </p>
            </div>
          </button>
        )}

        {message.attachment && (
          <div className="mb-2">
            <AttachmentPreview attachment={message.attachment} />
          </div>
        )}

        {message.text && (
          <p className="text-[15px] leading-relaxed break-words">
            {message.text}
          </p>
        )}

        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1.5 text-[11px]",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          <span className="font-mono">{time}</span>
          {isMine && (
            <span className="flex items-center gap-0.5">
              {message.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              <span className="font-mono">{message.status}</span>
            </span>
          )}
        </div>

        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.reactions.map((reaction, i) => (
              <span
                key={`${message.id}-${i}`}
                className="rounded-full bg-black/10 px-2 py-0.5 text-xs"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "mt-1.5 flex items-center gap-0.5",
            isMine ? "justify-end" : "justify-start",
          )}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-full p-1.5 transition-smooth hover:bg-black/10"
                aria-label="React to message"
                data-ocid={`react_button_${message.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align={isMine ? "end" : "start"}
              className="w-auto border-border bg-card p-2"
            >
              <div className="flex gap-1">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(message.id, emoji)}
                    className="rounded-full p-1.5 text-lg transition-smooth hover:bg-accent"
                    aria-label={`React with ${emoji}`}
                    data-ocid={`reaction_${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={() => onReply(message)}
            className="rounded-full p-1.5 transition-smooth hover:bg-black/10"
            aria-label="Reply to message"
            data-ocid={`reply_button_${message.id}`}
          >
            <MessageSquareQuote className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-full p-1.5 transition-smooth hover:bg-black/10"
            aria-label="Copy message"
            data-ocid={`copy_button_${message.id}`}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {isMine && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="rounded-full p-1.5 transition-smooth hover:bg-black/10"
              aria-label="Delete message"
              data-ocid={`delete_button_${message.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
