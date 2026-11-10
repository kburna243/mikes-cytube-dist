"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { AttributeEditor } from "@/components/identify/AttributeEditor";

import { API_BASE } from "@/lib/config";

interface ItemImage {
  id: number;
  url: string;
  thumbnail_url: string | null;
  view_type: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface ItemDetailProps {
  id: number;
  archive_id: string;
  title: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  estimated_year: number | null;
  origin: string | null;
  category: string | null;
  condition: string | null;
  condition_score: number | null;
  production_code: string | null;
  size: string | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  classification_status: string;
  images: ItemImage[];
}

export interface ItemUpdatePayload {
  brand?: string | null;
  model?: string | null;
  estimated_year?: number | null;
  origin?: string | null;
  size?: string | null;
  condition?: string | null;
  condition_score?: number | null;
  category?: string | null;
  estimated_value_min?: number | null;
  estimated_value_max?: number | null;
  description?: string | null;
}

interface ResultCardProps {
  item: ItemDetailProps;
  /** Called when the user saves edits (PATCH). Returns the updated item. */
  onSaveItem: (data: ItemUpdatePayload) => Promise<void>;
  /** Called when the user clicks "Save & Continue" after a successful save. */
  onContinue: () => void;
}

/** Maps classification_status to a colored left-border accent */
function statusToBorderColor(status: string): string {
  switch (status) {
    case "identified":
    case "verified":
    case "appraised":
      return "border-l-green-700";
    case "draft":
      return "border-l-amber-600";
    case "failed":
      return "border-l-red-700";
    default:
      return "border-l-amber-600";
  }
}

// Archiv-Palette statt Ampelfarben: Forest = gesichert, Burgundy = in Arbeit,
// Error-Rot nur fuer echten Fehlschlag.
function statusToLabelColor(status: string): string {
  switch (status) {
    case "identified":
    case "verified":
    case "appraised":
      return "text-tertiary";
    case "failed":
      return "text-error";
    default:
      return "text-secondary";
  }
}

function statusToDotColor(status: string): string {
  switch (status) {
    case "identified":
    case "verified":
    case "appraised":
      return "bg-tertiary";
    case "failed":
      return "bg-error";
    default:
      return "bg-secondary";
  }
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/* ─── Attribute Row (shared between display and shimmer) ─── */

function AttributeRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-label-caps mb-xs block">
        {label}
      </span>
      <span className="font-data-mono text-data-mono text-on-surface tabular-nums">
        {value}
      </span>
    </div>
  );
}

/* ─── Shimmer placeholder ─── */

function ShimmerRow() {
  return (
    <div className="space-y-xs">
      <div className="h-3 w-16 bg-outline-variant/30 animate-pulse rounded-sm" />
      <div className="h-4 w-24 bg-outline-variant/20 animate-pulse rounded-sm" />
    </div>
  );
}

function ShimmerCard({ item }: { item: ItemDetailProps }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant border-l-4 border-l-amber-600 grid grid-cols-1 md:grid-cols-12">
      {/* Left: image placeholder */}
      <div className="col-span-1 md:col-span-5 aspect-square bg-surface-container-highest flex items-center justify-center">
        {item.images.length > 0 && item.images[0].thumbnail_url ? (
          <img
            src={`${API_BASE}${item.images[0].thumbnail_url}`}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-outline-variant/10 animate-pulse" />
        )}
      </div>

      {/* Right: shimmer attribute grid */}
      <div className="col-span-1 md:col-span-7 p-lg flex flex-col justify-center">
        <div className="h-5 w-32 bg-outline-variant/30 animate-pulse rounded-sm mb-sm" />
        <div className="h-4 w-48 bg-outline-variant/20 animate-pulse rounded-sm mb-lg" />

        <div className="grid grid-cols-2 gap-md">
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
        </div>

        <div className="mt-lg space-y-sm">
          <div className="h-4 w-full bg-outline-variant/15 animate-pulse rounded-sm" />
          <div className="h-4 w-3/4 bg-outline-variant/15 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function ResultCard({ item, onSaveItem, onContinue }: ResultCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const primaryImage =
    item.images.find((img) => img.is_primary) ?? item.images[0];

  const isDraft = item.classification_status === "draft";

  const handleSave = useCallback(
    async (data: ItemUpdatePayload) => {
      setIsSaving(true);
      try {
        await onSaveItem(data);
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    },
    [onSaveItem],
  );

  const handleSaveAndContinue = useCallback(async () => {
    setIsSaving(true);
    try {
      onContinue();
    } finally {
      setIsSaving(false);
    }
  }, [onContinue]);

  const valueRange =
    item.estimated_value_min != null || item.estimated_value_max != null
      ? `${formatter.format(item.estimated_value_min ?? 0)} — ${formatter.format(item.estimated_value_max ?? 0)}`
      : "—";

  const conditionDisplay =
    item.condition_score != null
      ? `${item.condition ?? "—"} (${item.condition_score}/10)`
      : (item.condition ?? "—");

  // ── Draft / Shimmer State ──
  if (isDraft && !isEditing) {
    return <ShimmerCard item={item} />;
  }
  const userImages = item.images.map(
    (img) => `${API_BASE}${img.thumbnail_url || img.url}`,
  );

  const primaryImgUrl = primaryImage
    ? `${API_BASE}${primaryImage.thumbnail_url || primaryImage.url}`
    : null;

  const imageryCluster = [
    {
      title: "PLATE 01: HERO PERSPECTIVE",
      url:
        primaryImgUrl ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB9hsI0RkfYo7k0QiIy4l0mqgPIDgy0uOpvkJM-F1rIMTJsnkS9pEnO4rcWL6fd5fxm-Pp_9VdGvqVsGOf5s18Ej6_RwZRzjECSb0cXPEd_KD-R7QIXleFpWwoibVmIJ8drIU5k7EpDB5T8CCWN9qB-_4fwp8I_fcLev7TvvfHmgWR6KQvxBYvZoexB1YhIVaZv9sfaOtgza7h1w4K0NdjsIgWlrbHw3e0lm3BRG22dQaIJs90EhUH2lrl28xqJC6WOE1Hv7DDcKT1H",
    },
    {
      title: "PLATE 02: TAG ARCHIVE",
      url:
        userImages[1] ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAtVzl6IlY7Frh92YgeRXH7akJ986LrC_mlnM41woysQO9soZsv1mEa5bMRd5cXA-2EG5WXKNqF9tZpBqMHHR5htNQ4lQ4oqxT2ZAPxp8XJMj5tFgxaNX3BYTlkVADPDOcBVhboBhNVwDPuL0eiteosC-QrMVUKPktNprMDazuurkJFpvEjUd09xRgtUB_K2_wm8eqQWtPfxynYBZSl6ZWAktSWE0SYfUuuFLLnQ8T4oAtmURsi74fL84WjMm1MwjVQXMIibbMnMIfm",
    },
    {
      title: "PLATE 03: OUTSOLE SCAN",
      url:
        userImages[2] ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDEZ2wAnqPgA5a7tHv7WHI9BUeY40Q5M7B10jxrzNSrbRcZyzn-4m1Ky6rX10W_IIK06KfIaJt3bSbYRLShdHcrN7xi-6zoWWs3GgwQfZCaXiZ2LwHn5-i9zjjK5EgJ91iaHPzCEapQCWWI2GybQmHsPnIR3lE7udylfcr4QBgWxbvdfI-yuk7QeWHF5VRKG9_y4TPRibIbGcJnI1Y6x4dbLw_9_0kqk136kCn4acJMJ-milp35ieIhRwe8ChqMDC3ijL62lt8dhFai",
    },
    {
      title: "PLATE 04: REAR QUARTER",
      url:
        userImages[3] ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuABXcyVVBJJsI2eJIUTYf_e1pgZA9cLQyCfy8eY3GD9eMroHss2nd1d-VqtA7LGZ3wVKR4QxdRTQAhq1bEGhBfSGgvslxvqFwn_Ef-rm69aJFiOLJk8i-K3nbHvzPDqvG8AYVRSeIDlSfneCE-vbPlgjRNuIi_HVOuxQ4nUqSHJgKeLpnN4vXeO-RWL6xwYIEu0AHxXqbeb8GWwlYIouIPf2xFgldB_uIfvzXJeuWqFgrwHBuJ31PWoTkDbvxFxJxcSTWUX1nls-o2R",
    },
    {
      title: "PLATE 05: TOEBOX RADIUS",
      url:
        userImages[4] ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDOHZzmP-z3r1u3V_Aa4ZsM4u3J1_oA8T1Kq0j9cgUQUF11yHi9iKSccaQtIrnX2lE9RWqu9zQFlS_FoBhZTWsxMdUqMEptv2f-MalSjw6792g_7qiKAAyUmZ3TdwCz9hEnQgTrix7bVOvQfsK7u9lBwhG3Zr6C8Ch9STjWuQlx4SHRhYulR3tC-K-V4SuoQK4gq6oJ1nnlcjI5xjmyKKR0sDtJWh2I2OZMGeZFvcri7bj8gr1LG-1aDuairwGhN8N_U8-13G8Bo8n2",
    },
  ];

  return (
    <div
      className={`bg-surface-container-low border border-outline-variant border-l-4 ${statusToBorderColor(item.classification_status)} grid grid-cols-1 md:grid-cols-12 p-sm gap-sm`}
    >
      {/* ─── Left: Forensic Imagery Cluster ─── */}
      <div className="col-span-12 md:col-span-7 lg:col-span-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
          {/* Photo 1: Hero Side (col-span-2 row-span-2) */}
          <div className="col-span-2 row-span-2 border border-outline-variant/30 bg-surface-container p-1 flex flex-col">
            <div className="w-full h-[380px] overflow-hidden relative">
              <img
                src={imageryCluster[0].url}
                alt={item.title}
                className="w-full h-full object-cover filter grayscale-[0.2] contrast-[1.1]"
              />
            </div>
            <div className="p-2 bg-background mt-1">
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                {imageryCluster[0].title}
              </span>
            </div>
          </div>

          {/* Plates 2-5 */}
          {imageryCluster.slice(1).map((plate, index) => (
            <div
              key={index}
              className="border border-outline-variant/30 bg-surface-container p-1 flex flex-col justify-between h-[214px]"
            >
              <div className="w-full h-36 overflow-hidden relative bg-surface-container-highest flex items-center justify-center">
                <img
                  src={plate.url}
                  alt={plate.title}
                  className="w-full h-full object-cover filter grayscale-[0.3]"
                />
              </div>
              <div className="p-1.5 bg-background mt-1 flex-1 flex items-center">
                <span className="font-label-caps text-[9px] text-on-surface-variant block truncate w-full">
                  {plate.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right: Attributes / Editor ─── */}
      <div className="col-span-12 md:col-span-5 lg:col-span-4 p-md flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-sm mb-md pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary italic">
              {item.title}
            </h2>
            {item.brand && (
              <p className="font-label-caps text-label-caps text-secondary mt-xs">
                {item.brand}
                {item.model ? ` • ${item.model}` : ""}
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-xs flex-shrink-0">
            <span
              className={`inline-block w-2 h-2 rounded-full ${statusToDotColor(item.classification_status)}`}
            />
            <span
              className={`font-label-caps text-label-caps uppercase ${statusToLabelColor(item.classification_status)}`}
            >
              {item.classification_status}
            </span>
          </div>
        </div>

        {/* Content area: either display or editor */}
        {isEditing ? (
          <div className="flex-1">
            <AttributeEditor
              item={item}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            {/* Attribute Grid */}
            <div className="grid grid-cols-2 gap-x-sm gap-y-md mb-lg">
              <AttributeRow label="Brand" value={item.brand ?? "—"} />
              <AttributeRow label="Model" value={item.model ?? "—"} />
              <AttributeRow
                label="Year"
                value={
                  item.estimated_year != null
                    ? String(item.estimated_year)
                    : "—"
                }
              />
              <AttributeRow label="Category" value={item.category ?? "—"} />
              <AttributeRow label="Size" value={item.size ?? "—"} />
              <AttributeRow label="Condition" value={conditionDisplay} />
              <AttributeRow label="Origin" value={item.origin ?? "—"} />
              <AttributeRow label="Est. Value" value={valueRange} />
            </div>

            {/* Live Processing Log */}
            <div className="border border-outline-variant/40 p-4 bg-surface-container-low font-data-mono text-[11px] text-on-surface/80 space-y-1 mb-md">
              <div className="flex items-center gap-2 mb-2 border-b border-outline-variant/20 pb-1">
                <span className="material-symbols-outlined text-[14px]">
                  terminal
                </span>
                <span className="font-label-caps text-[10px] uppercase">
                  Live Processing Log
                </span>
              </div>
              <p className="opacity-80">_ EXEC_SYSTEM_CHECK...</p>
              <p>&gt; OK: GPU ACCELERATION ACTIVE</p>
              <p>&gt; SCANNING INGESTED IMAGERY... COMPARING [VINTAGE_DB_v4]</p>
              <p>&gt; MATCH PROBABILITY: 98.4% CONFIDENCE</p>
              <p>&gt; TEXTILE STRUCTURE ANALYSIS: [VERIFIED]</p>
              <p className="text-secondary italic">
                _ PENDING_MANUAL_VERIFICATION...
              </p>
            </div>

            {/* Metadata Summary */}
            <div className="border-t border-outline-variant/40 pt-4 mb-lg">
              <h3 className="font-label-caps text-label-caps uppercase mb-2">
                Metadata Summary
              </h3>
              <div className="space-y-1.5 font-data-mono text-[11px] text-on-surface-variant">
                <div className="flex justify-between border-b border-primary/5 pb-1">
                  <span>Image Quality</span>
                  <span className="text-on-surface font-sans font-medium">
                    A+ High-Res
                  </span>
                </div>
                <div className="flex justify-between border-b border-primary/5 pb-1">
                  <span>Material Analysis</span>
                  <span className="text-on-surface font-sans font-medium">
                    {item.category === "Sneakers"
                      ? "Leather, Mesh"
                      : item.category === "Denim"
                        ? "Cotton Twill"
                        : "Organic Fiber"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pipeline ID</span>
                  <span className="text-on-surface">
                    AI-PROC-{item.archive_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="mb-lg border-t border-outline-variant/20 pt-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-label-caps mb-xs block">
                  Notes
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-sm mt-auto pt-md border-t border-outline-variant">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
              <Button variant="primary" onClick={handleSaveAndContinue}>
                {isSaving ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
