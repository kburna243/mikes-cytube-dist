"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ItemDetail } from "@/lib/api";

const fields = [
  { key: "brand", label: "Marke", limit: 100 },
  { key: "model", label: "Modell", limit: 100 },
  { key: "estimated_year", label: "Jahrzehnt", limit: 4 },
  { key: "condition", label: "Zustand", limit: 30 },
] as const;

type Field = (typeof fields)[number]["key"];
type Values = Record<Field, string>;
type Updates = Pick<ItemDetail, Field> & { classification_status: string };

export default function CaptureSuggestions({
  item,
  onSave,
}: {
  item: ItemDetail;
  onSave: (updates: Updates) => Promise<void>;
}) {
  const suggestions: Values = {
    brand: item.brand ?? "",
    model: item.model ?? "",
    estimated_year: item.estimated_year == null ? "" : String(Math.floor(item.estimated_year / 10) * 10),
    condition: item.condition ?? "",
  };
  const [values, setValues] = useState(suggestions);
  const [reviewed, setReviewed] = useState<Partial<Record<Field, boolean>>>({});
  const [editing, setEditing] = useState<Partial<Record<Field, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirm(key: Field) {
    const value = values[key].trim();
    if (key === "estimated_year" && value && !/^[1-9]\d{2}0$/.test(value)) {
      setError("Gib den Beginn des Jahrzehnts ein, zum Beispiel 1990.");
      return;
    }
    setError(null);
    setEditing((previous) => ({ ...previous, [key]: false }));
    setReviewed((previous) => ({ ...previous, [key]: true }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        brand: values.brand.trim() || null,
        model: values.model.trim() || null,
        estimated_year: values.estimated_year.trim() ? Number(values.estimated_year.trim()) : null,
        condition: values.condition.trim() || null,
        classification_status: "verified",
      });
    } catch {
      setError("Das Stück konnte nicht gespeichert werden. Bitte versuche es erneut.");
      setSaving(false);
    }
  }

  return (
    <section aria-label="Vorschläge prüfen" className="space-y-md">
      <p role="status" className="text-on-surface-variant">Bestimmung fertig. Prüfe die Vorschläge für dein Stück.</p>
      {fields.map(({ key, label, limit }) => (
        <div key={key} className="bg-surface-container-low p-md space-y-xs">
          <label htmlFor={editing[key] ? `capture-${key}` : undefined} className="font-label-caps text-label-caps block">
            {label}
          </label>
          {editing[key] ? (
            <input
              autoFocus
              id={`capture-${key}`}
              inputMode={key === "estimated_year" ? "numeric" : "text"}
              className="w-full border border-outline bg-surface px-sm py-xs"
              value={values[key]}
              maxLength={limit}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
            />
          ) : (
            <p className="font-headline-sm text-headline-sm">
              {values[key] ? `${values[key]}${key === "estimated_year" ? "er" : ""}` : "Keine Angabe"}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-sm">
            {!editing[key] && (
              <span className="text-sm text-on-surface-variant">
                {reviewed[key] ? "Geprüft" : suggestions[key] ? "Vorschlag" : "Kein Vorschlag"}
              </span>
            )}
            {(!reviewed[key] || editing[key]) && (
              <Button variant="text" disabled={saving} onClick={() => confirm(key)}>
                {editing[key] ? "Bestätigen" : suggestions[key] ? "Übernehmen" : "Offen lassen"}
              </Button>
            )}
            {!editing[key] && (
              <Button variant="text" disabled={saving} onClick={() => setEditing({ ...editing, [key]: true })}>
                Ändern
              </Button>
            )}
          </div>
        </div>
      ))}
      {error && <p role="alert" className="text-error">{error}</p>}
      <Button disabled={saving || fields.some(({ key }) => !reviewed[key] || editing[key])} onClick={() => void save()}>
        {saving ? "Wird gespeichert …" : "Im Archiv speichern"}
      </Button>
    </section>
  );
}
