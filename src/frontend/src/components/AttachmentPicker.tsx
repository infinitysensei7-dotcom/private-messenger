import { ACCEPTED_TYPES, useMediaUpload } from "@/hooks/useMediaUpload";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types";
import { Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

export function AttachmentPicker({
  onAttachment,
  disabled,
}: {
  onAttachment: (attachment: Attachment) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, isUploading } = useMediaUpload();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    try {
      const attachment = await upload(file);
      onAttachment(attachment);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        data-ocid="attachment_input"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        aria-label="Attach a file"
        data-ocid="attachment_button"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </button>

      {(isUploading || localError) && (
        <div
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs"
          data-ocid="upload_state"
        >
          {isUploading ? (
            <>
              <span className="font-medium text-muted-foreground">
                Uploading {Math.round(progress)}%
              </span>
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </>
          ) : (
            <>
              <span className="text-destructive">{localError}</span>
              <button
                type="button"
                onClick={() => setLocalError(null)}
                className="text-muted-foreground transition-smooth hover:text-foreground"
                aria-label="Dismiss upload error"
                data-ocid="dismiss_upload_error_button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
