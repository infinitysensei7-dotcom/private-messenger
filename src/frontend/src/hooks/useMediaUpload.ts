import type { Attachment } from "@/types";
import { loadConfig } from "@caffeineai/core-infrastructure";
import { ExternalBlob, StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";

export type MediaKind = "image" | "video" | "audio" | "pdf" | "document";

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ACCEPTED_TYPES =
  "image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";

export function detectMediaKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return "pdf";
  }
  return "document";
}

let storageClientPromise: Promise<StorageClient> | null = null;

function getStorageClient(): Promise<StorageClient> {
  if (!storageClientPromise) {
    storageClientPromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {
          // Local replica may not be running; the agent still works for remote.
        });
      }
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    })();
  }
  return storageClientPromise;
}

export function useMediaUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<Attachment> => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File is too large. The limit is 25 MB.");
    }
    setIsUploading(true);
    setError(null);
    setProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((pct) => setProgress(pct));
      const client = await getStorageClient();
      const { hash } = await client.putFile(
        await blob.getBytes(),
        blob.onProgress,
        blob.contentType,
        blob.filename,
      );
      const url = await client.getDirectURL(hash);
      return {
        id: BigInt(Date.now()),
        url,
        kind: detectMediaKind(file),
        name: file.name,
        size: BigInt(file.size),
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, progress, isUploading, error };
}
