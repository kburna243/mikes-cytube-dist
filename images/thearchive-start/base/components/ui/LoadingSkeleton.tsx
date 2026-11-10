"use client";

interface LoadingSkeletonProps {
  variant: "card" | "list" | "detail";
  count?: number;
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse border border-outline-variant bg-surface-container-highest"
          >
            <div className="aspect-[3/4] bg-surface-container-high" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded-sm bg-surface-container-high" />
              <div className="h-3 w-1/2 rounded-sm bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="animate-pulse space-y-[1px] border border-outline-variant bg-surface-container-highest p-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-outline-variant py-4 last:border-b-0"
          >
            {/* Thumbnail placeholder */}
            <div className="h-16 w-16 shrink-0 bg-surface-container-high" />
            {/* Text lines with varying widths */}
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded-sm bg-surface-container-high"
                style={{ width: `${60 + ((i * 23) % 35)}%` }}
              />
              <div
                className="h-3 rounded-sm bg-surface-container-high"
                style={{ width: `${35 + ((i * 17) % 30)}%` }}
              />
            </div>
            {/* Metadata column */}
            <div className="hidden shrink-0 space-y-2 sm:block">
              <div
                className="h-3 rounded-sm bg-surface-container-high"
                style={{ width: `${48 + ((i * 13) % 20)}px` }}
              />
              <div className="h-3 w-16 rounded-sm bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // variant === "detail"
  return (
    <div className="animate-pulse border border-outline-variant bg-surface-container-highest">
      <div className="flex flex-col lg:flex-row">
        {/* Large image placeholder */}
        <div className="w-full bg-surface-container-high lg:w-3/5">
          <div className="aspect-[4/5] lg:aspect-[3/4]" />
        </div>

        {/* Detail panel */}
        <div className="flex flex-1 flex-col gap-8 p-8 lg:p-12">
          {/* Category label */}
          <div className="h-3 w-24 rounded-sm bg-surface-container-high" />

          {/* Title — two lines */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded-sm bg-surface-container-high" />
            <div className="h-8 w-1/2 rounded-sm bg-surface-container-high" />
          </div>

          {/* Metadata row — 3 short lines */}
          <div className="flex gap-4">
            <div className="h-5 w-20 rounded-sm bg-surface-container-high" />
            <div className="h-5 w-16 rounded-sm bg-surface-container-high" />
            <div className="h-5 w-24 rounded-sm bg-surface-container-high" />
          </div>

          {/* Technical divider */}
          <div className="technical-line" />

          {/* Description — 4 text lines */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-sm bg-surface-container-high" />
            <div className="h-4 w-full rounded-sm bg-surface-container-high" />
            <div className="h-4 w-4/5 rounded-sm bg-surface-container-high" />
            <div className="h-4 w-3/5 rounded-sm bg-surface-container-high" />
          </div>

          {/* Technical data table — 3 rows */}
          <div className="space-y-1 border border-outline-variant p-4">
            {[80, 50, 65].map((width, i) => (
              <div key={i} className="flex items-center gap-4 py-1">
                <div className="h-3 w-24 rounded-sm bg-surface-container-high" />
                <div
                  className="h-3 rounded-sm bg-surface-container-high"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>

          {/* Button placeholder */}
          <div className="h-12 w-48 rounded-sm bg-surface-container-high" />
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
