"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/Button";
import { IS_NATIVE } from "@/lib/platform";
import { takePhoto, pickFromGallery } from "@/lib/native/camera";

// ─── UploadZone ───────────────────────────────────────────────────────────────
// Drag-and-drop zone for the Identify page. Accepts images via native HTML5
// drag-and-drop or a file-input fallback. Validates file type, count, and size
// client-side before forwarding to the parent.
//
// Props:
//   onFilesSelected: (files: File[]) => void — called when valid files are provided
//   disabled?: boolean — disables all interaction when true
// ───────────────────────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function UploadZone({
  onFilesSelected,
  disabled = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateFiles = useCallback((incoming: File[]): File[] => {
    setValidationError(null);

    if (incoming.length === 0) {
      setValidationError("No files selected.");
      return [];
    }

    if (incoming.length > MAX_FILES) {
      setValidationError(
        `A maximum of ${MAX_FILES} files is allowed. You selected ${incoming.length}.`,
      );
      return [];
    }

    const invalidType = incoming.find(
      (f) => !ACCEPTED_MIME_TYPES.includes(f.type),
    );
    if (invalidType) {
      setValidationError(
        `"${invalidType.name}" is not a supported format. Please use JPEG, PNG, or WebP.`,
      );
      return [];
    }

    const oversized = incoming.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setValidationError(
        `"${oversized.name}" (${formatFileSize(oversized.size)}) exceeds the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit.`,
      );
      return [];
    }

    return incoming;
  }, []);

  // ── Event Handlers ──────────────────────────────────────────────────────────

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        e.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const valid = validateFiles(files);
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [disabled, validateFiles, onFilesSelected],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const valid = validateFiles(files);
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
      // Reset so the same file can be re-selected after removal
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [validateFiles, onFilesSelected],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  const handleTakePhoto = useCallback(async () => {
    if (disabled) return;
    const photo = await takePhoto();
    if (photo) {
      const blob = await fetch(photo.dataUrl).then((r) => r.blob());
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const valid = validateFiles([file]);
      if (valid.length > 0) onFilesSelected(valid);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  const handlePickGallery = useCallback(async () => {
    if (disabled) return;
    const photo = await pickFromGallery();
    if (photo) {
      const blob = await fetch(photo.dataUrl).then((r) => r.blob());
      const file = new File([blob], `gallery_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const valid = validateFiles([file]);
      if (valid.length > 0) onFilesSelected(valid);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload images — click or drag and drop"
        aria-disabled={disabled}
        className={`
          group
          border p-xl text-center transition-all duration-300
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${
            isDragOver
              ? "border-2 border-solid border-primary bg-surface-container-high"
              : "border-2 border-dashed border-outline-variant hover:bg-surface-container"
          }
        `}
      >
        <div className="max-w-[28rem] mx-auto">
          {/* Status label */}
          <span className="font-label-caps text-label-caps text-secondary block mb-md select-none">
            {isDragOver ? "RELEASE TO UPLOAD" : "DROP IMAGES HERE"}
          </span>

          {/* Instructional copy */}
          <p className="font-body-md text-body-md text-on-surface-variant mb-sm select-none">
            Upload 5&ndash;10 photos per item for multi-view AI analysis
          </p>

          {/* Format constraints */}
          <p className="font-data-mono text-data-mono text-on-surface-variant/60 select-none">
            Accepted: JPG, PNG, WEBP &middot; Max 20MB each &middot; Up to{" "}
            {MAX_FILES} files
          </p>

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Visual button — clicks pass through to the drop zone */}
          <Button
            variant="secondary"
            className="mt-md pointer-events-none select-none"
          >
            SELECT FILES
          </Button>

          {/* Native camera buttons — only on mobile */}
          {IS_NATIVE && (
            <div className="flex gap-sm justify-center mt-md">
              <Button onClick={handleTakePhoto} variant="primary">
                Take Photo
              </Button>
              <Button onClick={handlePickGallery} variant="secondary">
                Gallery
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Validation feedback */}
      {validationError && (
        <p
          className="mt-sm font-data-mono text-data-mono text-error"
          role="alert"
        >
          {validationError}
        </p>
      )}
    </div>
  );
}
