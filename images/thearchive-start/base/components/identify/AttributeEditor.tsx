"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

interface ItemUpdatePayload {
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

interface AttributeEditorProps {
  /** Current item data — used to pre-populate the form */
  item: {
    brand: string | null;
    model: string | null;
    estimated_year: number | null;
    origin: string | null;
    size: string | null;
    condition: string | null;
    condition_score: number | null;
    category: string | null;
    estimated_value_min: number | null;
    estimated_value_max: number | null;
    description: string | null;
  };
  onSave: (data: ItemUpdatePayload) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  "Sneakers",
  "Workwear",
  "Denim",
  "Leather",
  "Sportswear",
  "Streetwear",
] as const;

/** Shared input styling */
const inputClass =
  "border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-on-surface w-full focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50";

const labelClass =
  "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-label-caps mb-xs block";

export function AttributeEditor({
  item,
  onSave,
  onCancel,
}: AttributeEditorProps) {
  const [brand, setBrand] = useState(item.brand ?? "");
  const [model, setModel] = useState(item.model ?? "");
  const [estimatedYear, setEstimatedYear] = useState(
    item.estimated_year != null ? String(item.estimated_year) : "",
  );
  const [origin, setOrigin] = useState(item.origin ?? "");
  const [size, setSize] = useState(item.size ?? "");
  const [condition, setCondition] = useState(item.condition ?? "");
  const [conditionScore, setConditionScore] = useState(
    item.condition_score != null ? String(item.condition_score) : "",
  );
  const [category, setCategory] = useState(item.category ?? "");
  const [estimatedValueMin, setEstimatedValueMin] = useState(
    item.estimated_value_min != null ? String(item.estimated_value_min) : "",
  );
  const [estimatedValueMax, setEstimatedValueMax] = useState(
    item.estimated_value_max != null ? String(item.estimated_value_max) : "",
  );
  const [description, setDescription] = useState(item.description ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    if (conditionScore !== "") {
      const score = Number(conditionScore);
      if (isNaN(score) || score < 1 || score > 10) {
        next.conditionScore = "Score must be between 1 and 10";
      }
    }

    if (estimatedYear !== "") {
      const year = Number(estimatedYear);
      if (isNaN(year) || year < 1900 || year > 2030) {
        next.estimatedYear = "Year must be between 1900 and 2030";
      }
    }

    if (estimatedValueMin !== "" && isNaN(Number(estimatedValueMin))) {
      next.estimatedValueMin = "Must be a valid number";
    }

    if (estimatedValueMax !== "" && isNaN(Number(estimatedValueMax))) {
      next.estimatedValueMax = "Must be a valid number";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [conditionScore, estimatedYear, estimatedValueMin, estimatedValueMax]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (isSaving) return;
      if (!validate()) return;

      const payload: ItemUpdatePayload = {};

      if (brand !== (item.brand ?? "")) payload.brand = brand || null;
      if (model !== (item.model ?? "")) payload.model = model || null;
      if (origin !== (item.origin ?? "")) payload.origin = origin || null;
      if (size !== (item.size ?? "")) payload.size = size || null;
      if (condition !== (item.condition ?? ""))
        payload.condition = condition || null;
      if (category !== (item.category ?? ""))
        payload.category = category || null;
      if (description !== (item.description ?? ""))
        payload.description = description || null;

      const prevYear = item.estimated_year;
      const nextYear = estimatedYear === "" ? null : Number(estimatedYear);
      if (nextYear !== prevYear) payload.estimated_year = nextYear;

      const prevScore = item.condition_score;
      const nextScore = conditionScore === "" ? null : Number(conditionScore);
      if (nextScore !== prevScore) payload.condition_score = nextScore;

      const prevMin = item.estimated_value_min;
      const nextMin =
        estimatedValueMin === "" ? null : Number(estimatedValueMin);
      if (nextMin !== prevMin) payload.estimated_value_min = nextMin;

      const prevMax = item.estimated_value_max;
      const nextMax =
        estimatedValueMax === "" ? null : Number(estimatedValueMax);
      if (nextMax !== prevMax) payload.estimated_value_max = nextMax;

      setIsSaving(true);
      try {
        await onSave(payload);
      } finally {
        setIsSaving(false);
      }
    },
    [
      brand,
      model,
      estimatedYear,
      origin,
      size,
      condition,
      conditionScore,
      category,
      estimatedValueMin,
      estimatedValueMax,
      description,
      item,
      validate,
      onSave,
      isSaving,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      {/* Row 1: Brand + Model */}
      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <label htmlFor="edit-brand" className={labelClass}>
            Brand
          </label>
          <input
            id="edit-brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
            placeholder="e.g. Levi's"
          />
        </div>
        <div>
          <label htmlFor="edit-model" className={labelClass}>
            Model
          </label>
          <input
            id="edit-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
            placeholder="e.g. 501"
          />
        </div>
      </div>

      {/* Row 2: Year + Origin */}
      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <label htmlFor="edit-year" className={labelClass}>
            Estimated Year
          </label>
          <input
            id="edit-year"
            type="number"
            value={estimatedYear}
            onChange={(e) => setEstimatedYear(e.target.value)}
            className={inputClass}
            placeholder="e.g. 1985"
            min={1900}
            max={2030}
          />
          {errors.estimatedYear && (
            <p className="font-data-mono text-data-mono text-error mt-xs">
              {errors.estimatedYear}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="edit-origin" className={labelClass}>
            Origin
          </label>
          <input
            id="edit-origin"
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={inputClass}
            placeholder="e.g. USA"
          />
        </div>
      </div>

      {/* Row 3: Size + Category */}
      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <label htmlFor="edit-size" className={labelClass}>
            Size
          </label>
          <input
            id="edit-size"
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={inputClass}
            placeholder="e.g. 32x32 / M / 9.5 US"
          />
        </div>
        <div>
          <label htmlFor="edit-category" className={labelClass}>
            Category
          </label>
          <select
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Select Category --</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Condition + Score */}
      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <label htmlFor="edit-condition" className={labelClass}>
            Condition
          </label>
          <input
            id="edit-condition"
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={inputClass}
            placeholder="e.g. Good / Deadstock"
          />
        </div>
        <div>
          <label htmlFor="edit-condition-score" className={labelClass}>
            Condition Score (1-10)
          </label>
          <input
            id="edit-condition-score"
            type="number"
            value={conditionScore}
            onChange={(e) => setConditionScore(e.target.value)}
            className={inputClass}
            placeholder="e.g. 8"
            min={1}
            max={10}
          />
          {errors.conditionScore && (
            <p className="font-data-mono text-data-mono text-error mt-xs">
              {errors.conditionScore}
            </p>
          )}
        </div>
      </div>

      {/* Row 5: Value Range */}
      <div className="grid grid-cols-2 gap-gutter">
        <div>
          <label htmlFor="edit-value-min" className={labelClass}>
            Est. Value (Min)
          </label>
          <input
            id="edit-value-min"
            type="number"
            value={estimatedValueMin}
            onChange={(e) => setEstimatedValueMin(e.target.value)}
            className={inputClass}
            placeholder="e.g. 250"
            min={0}
            step="0.01"
          />
          {errors.estimatedValueMin && (
            <p className="font-data-mono text-data-mono text-error mt-xs">
              {errors.estimatedValueMin}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="edit-value-max" className={labelClass}>
            Est. Value (Max)
          </label>
          <input
            id="edit-value-max"
            type="number"
            value={estimatedValueMax}
            onChange={(e) => setEstimatedValueMax(e.target.value)}
            className={inputClass}
            placeholder="e.g. 1200"
            min={0}
            step="0.01"
          />
          {errors.estimatedValueMax && (
            <p className="font-data-mono text-data-mono text-error mt-xs">
              {errors.estimatedValueMax}
            </p>
          )}
        </div>
      </div>

      {/* Row 6: Description (full width) */}
      <div>
        <label htmlFor="edit-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="Describe notable features, wear patterns, provenance..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-sm pt-md border-t border-outline-variant">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={undefined}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
