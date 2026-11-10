"use client";

import { useCallback, useState } from "react";

// ─── useUpload ────────────────────────────────────────────────────────────────
// Custom hook for multi-file upload with per-file progress tracking via
// XMLHttpRequest (fetch does not expose upload-progress events).
//
// Usage:
//   const { uploadFiles, progress, isUploading, error } = useUpload();
//   await uploadFiles(itemId, files);
//
// ───────────────────────────────────────────────────────────────────────────────

import { API_BASE } from "../config";
import { getToken } from "../token-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadProgress {
  fileName: string;
  progress: number; // 0–100
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export interface UploadResult {
  id: number;
  url: string;
  thumbnail_url: string | null;
  view_type: string;
  is_primary: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUpload() {
  const [progressMap, setProgressMap] = useState<Map<string, UploadProgress>>(
    () => new Map(),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Upload a single file via XMLHttpRequest ─────────────────────────────────

  const uploadSingleFile = useCallback(
    async (
      itemId: number,
      file: File,
      viewType: string = "front",
      isPrimary: boolean = false,
      capturePosition?: number,
    ): Promise<UploadResult> => {
      const token = await getToken("access_token");
      return new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", file);
        formData.append("view_type", viewType);
        formData.append("is_primary", String(isPrimary));

        if (capturePosition !== undefined) {
          formData.append("capture_position", String(capturePosition));
        }
        const fileName = file.name;

        // Mark as uploading
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(fileName, {
            fileName,
            progress: 0,
            status: "uploading",
          });
          return next;
        });

        // ── Progress event ──────────────────────────────────────────────────

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(fileName, {
                fileName,
                progress: percent,
                status: "uploading",
              });
              return next;
            });
          }
        });

        // ── Completion ──────────────────────────────────────────────────────

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result: UploadResult = JSON.parse(xhr.responseText);
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(fileName, {
                fileName,
                progress: 100,
                status: "done",
              });
              return next;
            });
            resolve(result);
          } else {
            const message = `Upload failed with status ${xhr.status}`;
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(fileName, {
                fileName,
                progress: 0,
                status: "error",
                error: message,
              });
              return next;
            });
            reject(new Error(message));
          }
        });

        // ── Network error ───────────────────────────────────────────────────

        xhr.addEventListener("error", () => {
          const message = "A network error occurred during upload.";
          setProgressMap((prev) => {
            const next = new Map(prev);
            next.set(fileName, {
              fileName,
              progress: 0,
              status: "error",
              error: message,
            });
            return next;
          });
          reject(new Error(message));
        });

        // ── Abort ───────────────────────────────────────────────────────────

        xhr.addEventListener("abort", () => {
          const message = "Upload was cancelled.";
          setProgressMap((prev) => {
            const next = new Map(prev);
            next.set(fileName, {
              fileName,
              progress: 0,
              status: "error",
              error: message,
            });
            return next;
          });
          reject(new Error(message));
        });

        // ── Send ────────────────────────────────────────────────────────────

        xhr.open("POST", `${API_BASE}/api/items/${itemId}/images`);

        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    },
    [],
  );

  // ── Batch upload (parallel) ─────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (itemId: number, files: File[]): Promise<UploadResult[]> => {
      setIsUploading(true);
      setError(null);

      // Set all files to "pending" initially
      setProgressMap(() => {
        const initial = new Map<string, UploadProgress>();
        files.forEach((f) =>
          initial.set(f.name, {
            fileName: f.name,
            progress: 0,
            status: "pending",
          }),
        );
        return initial;
      });

      try {
        // Upload in parallel — the first file is marked as primary
        const results = await Promise.all(
          files.map((file, i) =>
            uploadSingleFile(itemId, file, "front", i === 0),
          ),
        );
        return results;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "One or more uploads failed.";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadSingleFile],
  );

  // ── Derived progress array (stable order) ───────────────────────────────────

  const progress: UploadProgress[] = Array.from(progressMap.values());

  return {
    uploadFiles,
    uploadSingleFile,
    progress,
    isUploading,
    error,
  } as const;
}
