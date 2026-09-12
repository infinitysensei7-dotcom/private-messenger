import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { timestampToDate, useSearchMessages } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Message, MessageId } from "@/types";
import { Search, X } from "lucide-react";
import { useState } from "react";

export function MessageSearch({
  onJump,
}: {
  onJump: (messageId: MessageId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const { data: results = [], isLoading } = useSearchMessages(term);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground"
          aria-label="Search messages"
          data-ocid="search_button"
        >
          <Search className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search messages</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search this conversation…"
            className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm outline-none transition-smooth placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
            data-ocid="search_input"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground"
              aria-label="Clear search"
              data-ocid="clear_search_button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          className="max-h-80 space-y-2 overflow-y-auto"
          data-ocid="search_results"
        >
          {isLoading ? (
            <div className="space-y-2" data-ocid="loading_state">
              {Array.from({ length: 3 }, (_, i) => `search-skeleton-${i}`).map(
                (id) => (
                  <div
                    key={id}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ),
              )}
            </div>
          ) : term.trim().length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Type to search across the conversation.
            </p>
          ) : results.length === 0 ? (
            <p
              className="py-6 text-center text-sm text-muted-foreground"
              data-ocid="empty_state"
            >
              No messages match “{term}”.
            </p>
          ) : (
            results.map((message) => (
              <SearchResultRow
                key={message.id}
                message={message}
                onJump={() => {
                  onJump(message.id);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultRow({
  message,
  onJump,
}: {
  message: Message;
  onJump: () => void;
}) {
  const date = timestampToDate(message.timestamp);
  const time = date
    ? date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const snippet = message.text || (message.attachment ? "Shared a file" : "");

  return (
    <button
      type="button"
      onClick={onJump}
      className={cn(
        "w-full rounded-xl border border-border bg-card p-3 text-left transition-smooth hover:bg-accent",
      )}
      data-ocid={`search_result_${message.id}`}
    >
      <p className="line-clamp-2 text-sm leading-relaxed">{snippet}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{time}</p>
    </button>
  );
}
