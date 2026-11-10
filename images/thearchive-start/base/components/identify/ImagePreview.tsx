"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

// ─── ImagePreview ─────────────────────────────────────────────────────────────
// Responsive grid of thumbnail previews with drag-to-reorder and per-image
// removal. Manages object-URL lifecycle internally to prevent memory leaks.
//
// Props:
//   images: File[] — the files selected by the user
//   onRemove: (index: number) => void — called when the × button is clicked
//   onReorder: (from: number, to: number) => void — called after a drag-and-drop
// ───────────────────────────────────────────────────────────────────────────────

interface ImagePreviewProps {
  images: File[];
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

export function ImagePreview({
  images,
  onRemove,
  onReorder,
}: ImagePreviewProps) {
  // ── Drag State ──────────────────────────────────────────────────────────────

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  // ── Object-URL Lifecycle ────────────────────────────────────────────────────

  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const urlsCleanupRef = useRef<string[]>([]);

  useEffect(() => {
    // Revoke all previously created object URLs
    urlsCleanupRef.current.forEach((url) => URL.revokeObjectURL(url));

    const fresh = images.map((file) => URL.createObjectURL(file));
    setObjectUrls(fresh);
    urlsCleanupRef.current = fresh;

    return () => {
      // Cleanup on unmount
      fresh.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // ── Empty State ─────────────────────────────────────────────────────────────

  if (images.length === 0) return null;

  // ── Drag Handlers ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, toIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(null);

      if (dragIndex !== null && dragIndex !== toIndex) {
        onReorder(dragIndex, toIndex);
      }
      setDragIndex(null);
    },
    [dragIndex, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropTarget(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {images.map((file, index) => (
        <div
          key={`preview-${index}-${file.name}`}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            relative aspect-square overflow-hidden
            border transition-all duration-200
            group
            ${
              dropTarget === index
                ? "border-2 border-primary"
                : "border border-outline-variant"
            }
            ${
              dragIndex === index
                ? "opacity-40 scale-95"
                : "hover:border-outline cursor-grab active:cursor-grabbing"
            }
          `}
          aria-label={`Image ${index + 1}: ${file.name}`}
          aria-grabbed={dragIndex === index}
        >
          {/* Thumbnail */}
          <img
            src={objectUrls[index]}
            alt={`Preview ${index + 1}: ${file.name}`}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />

          {/* Remove button — absolute top-right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="
              absolute top-2 right-2
              w-7 h-7 flex items-center justify-center leading-none
              bg-surface-container-highest border border-outline-variant
              text-on-surface-variant text-sm font-medium
              transition-colors duration-200
              opacity-0 group-hover:opacity-100
              hover:bg-error hover:text-on-error hover:border-error
              focus-visible:opacity-100
            "
            aria-label={`Remove ${file.name}`}
          >
            &times;
          </button>

          {/* Sort-order badge — bottom-left */}
          <span
            className="
              absolute bottom-2 left-2
              px-1.5 py-px
              bg-surface-container-highest/90 border border-outline-variant
              font-data-mono text-data-mono text-on-surface-variant
              select-none pointer-events-none
            "
          >
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
