"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface GuidedPhoto {
  file: File;
  label: string;
  viewType: string;
}

type Motif = { id: string; label: string; viewType: string };
type Photo = GuidedPhoto & { motif: Motif };
type Step = "category" | "list" | "camera" | "review" | "filmstrip";
type CameraCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: { min: number; max: number };
};

const front: Motif = { id: "front", label: "Vorderseite", viewType: "front" };
const back: Motif = { id: "back", label: "Rückseite", viewType: "back" };
const flaw: Motif = { id: "flaw", label: "Makel", viewType: "detail" };
const label = (id: string, text: string): Motif => ({ id, label: text, viewType: "label" });
const detail = (text: string): Motif => ({ id: "detail", label: text, viewType: "detail" });

export const GUIDED_CATEGORIES = [
  { id: "clothing", label: "Kleidung", icon: "checkroom", details: [label("inner", "Etikett innen"), label("care", "Pflegeetikett")] },
  { id: "sneakers", label: "Sneaker", icon: "steps", details: [label("inner", "Größenetikett"), detail("Sohle")] },
  { id: "games", label: "Konsole & Spiel", icon: "sports_esports", details: [label("serial", "Typenschild"), detail("Anschlüsse oder Datenträger")] },
  { id: "cards", label: "Sammelkarte", icon: "style", details: [label("edition", "Set-Symbol"), detail("Kanten")] },
  { id: "vinyl", label: "Schallplatte", icon: "album", details: [label("record", "Plattenetikett"), detail("Auslaufrille")] },
  { id: "toys", label: "Spielzeug", icon: "toys", details: [label("maker", "Herstellerprägung"), detail("Zubehör")] },
];

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxUploadSize = 10 * 1024 * 1024;

function canvasFrame(source: CanvasImageSource, width: number, height: number, limit: number) {
  const scale = Math.min(1, limit / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function jpeg(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Das Foto konnte nicht gespeichert werden.");
  return new File([blob], "Aufnahme.jpg", { type: blob.type });
}

function looksSoft(image: HTMLImageElement) {
  const canvas = canvasFrame(image, image.naturalWidth, image.naturalHeight, 128);
  const { width, height } = canvas;
  const pixels = canvas.getContext("2d")?.getImageData(0, 0, width, height).data;
  if (!pixels || width < 4 || height < 4) return false;

  const luma = (i: number) => 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  let energy = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const edge = 4 * luma(i) - luma(i - 4) - luma(i + 4) - luma(i - width * 4) - luma(i + width * 4);
      energy += edge * edge;
    }
  }
  return energy / ((width - 2) * (height - 2)) < 35;
}

async function preparePhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const readyFile = supportedTypes.has(file.type) && file.size <= maxUploadSize
      ? file
      : await jpeg(canvasFrame(image, image.naturalWidth, image.naturalHeight, 2400));
    return { file: readyFile, soft: looksSoft(image) };
  } catch {
    throw new Error("Das Foto konnte nicht geöffnet werden. Wähle ein Bild im JPEG-, PNG- oder WebP-Format.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function PhotoPreview({ file, alt, className }: { file: File; alt: string; className: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  return url ? <img src={url} alt={alt} className={className} draggable={false} /> : null;
}

function CaptureCamera({ motif, onPhoto, onClose }: {
  motif: Motif;
  onPhoto: (file: File) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<MediaStreamTrack | null>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const systemCamera = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    let closed = false;
    let stream: MediaStream | undefined;

    async function open() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        });
        if (closed) {
          stream.getTracks().forEach((source) => source.stop());
          return;
        }
        track.current = stream.getVideoTracks()[0];
        setCapabilities(track.current.getCapabilities?.() ?? {});
        if (video.current) video.current.srcObject = stream;
      } catch {
        if (!closed) setError("Kamera nicht verfügbar. Öffne die Gerätekamera oder wähle ein Bild.");
      }
    }
    void open();
    return () => {
      closed = true;
      modal?.close();
      stream?.getTracks().forEach((source) => source.stop());
      track.current = null;
    };
  }, []);

  async function adjust(settings: { zoom: number } | { torch: boolean }) {
    if (!track.current) return;
    try {
      await track.current.applyConstraints({ advanced: [settings as MediaTrackConstraintSet] });
      const applied = track.current?.getSettings() as (MediaTrackSettings & { zoom?: number; torch?: boolean }) | undefined;
      if ("torch" in settings) setTorch(applied?.torch ?? settings.torch);
      if ("zoom" in settings) setZoom(applied?.zoom ?? settings.zoom);
    } catch {
      setError("Die Kamera konnte die Einstellung nicht ändern.");
    }
  }

  async function accept(getFile: () => Promise<File>) {
    setBusy(true);
    try {
      await onPhoto(await getFile());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Das Foto konnte nicht geöffnet werden.");
    } finally {
      setBusy(false);
    }
  }

  function capture() {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) return;
    void accept(() => jpeg(canvasFrame(source, source.videoWidth, source.videoHeight, 2400)));
  }

  const framing = motif.viewType === "label"
    ? "Etikett flach und scharf, ohne Blitz"
    : "Motiv im Rahmen ausrichten";
  const canZoom = capabilities.zoom && capabilities.zoom.min <= 1 && capabilities.zoom.max >= 2;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="camera-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col bg-primary text-on-primary open:flex pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <header className="flex items-center justify-between gap-2 px-4">
        <button type="button" autoFocus disabled={busy} onClick={onClose} className="min-h-11 px-2 underline">Zurück</button>
        <h2 id="camera-title" className="font-display text-headline-sm">{motif.label}</h2>
        {capabilities.torch && (
          <button type="button" aria-label="Taschenlampe" aria-pressed={torch} onClick={() => void adjust({ torch: !torch })} className="min-h-11 px-2">
            <span className="material-symbols-outlined" aria-hidden="true">{torch ? "flashlight_on" : "flashlight_off"}</span>
          </button>
        )}
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={video} autoPlay muted playsInline onPlaying={() => setReady(true)} className="h-full w-full object-contain" />
        {ready && <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] border border-on-primary" />}
      </div>
      <div className="grid justify-items-center gap-3 px-4 pt-3 text-center">
        {error && <p role="alert" className="text-sm">{error}</p>}
        {ready && <p className="text-sm">{framing}</p>}
        {ready && canZoom && (
          <div role="group" aria-label="Zoom" className="flex gap-2">
            {[1, 2].map((level) => (
              <button key={level} type="button" aria-pressed={Math.abs(zoom - level) < 0.1}
                onClick={() => void adjust({ zoom: level })} className="min-h-11 min-w-11 rounded-full border aria-pressed:bg-surface aria-pressed:text-primary">
                {level}×
              </button>
            ))}
          </div>
        )}
        {ready && (
          <button type="button" disabled={busy} aria-label="Foto aufnehmen" onClick={capture}
            className="size-16 rounded-full border-4 border-on-primary bg-surface bg-clip-content p-1 disabled:opacity-50" />
        )}
        <div className="flex flex-wrap justify-center gap-x-4">
          {!ready && <button type="button" disabled={busy} onClick={() => systemCamera.current?.click()} className="min-h-11 underline">Gerätekamera öffnen</button>}
          <button type="button" disabled={busy} onClick={() => gallery.current?.click()} className="min-h-11 underline">Aus Galerie wählen</button>
        </div>
        {[gallery, systemCamera].map((input, index) => (
          <input key={index} ref={input} type="file" accept="image/*" capture={index === 1 ? "environment" : undefined} hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void accept(async () => file);
            }} />
        ))}
      </div>
    </dialog>
  );
}

export default function GuidedCapture({ onSubmit, initialFiles = [] }: {
  onSubmit: (category: string, photos: GuidedPhoto[]) => void;
  initialFiles?: File[];
}) {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<(typeof GUIDED_CATEGORIES)[number]>();
  const [motif, setMotif] = useState<Motif>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [review, setReview] = useState<{ file: File; soft: boolean }>();
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState<number>();
  const [dropTarget, setDropTarget] = useState<number>();
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [step]);

  async function chooseCategory(choice: (typeof GUIDED_CATEGORIES)[number]) {
    setError("");
    if (category) {
      const slots = [front, back, ...choice.details, flaw];
      setPhotos((current) => current.map((photo) => {
        if (slots.some((slot) => slot.id === photo.motif.id && slot.label === photo.label) || photo.motif.id.startsWith("extra-")) return photo;
        return {
          ...photo,
          motif: { ...photo.motif, id: "extra-" + category.id + "-" + photo.motif.id },
        };
      }));
      setCategory(choice);
      setStep("list");
      return;
    }

    setCategory(choice);
    setImporting(true);
    try {
      const slots = [front, back, ...choice.details, flaw];
      const imports = await Promise.allSettled(initialFiles.map(preparePhoto));
      setPhotos(imports.flatMap((result, index) => {
        if (result.status === "rejected") return [];
        const imported = slots[index] ?? {
          id: "extra-" + index,
          label: "Zusatzfoto " + (index - slots.length + 1),
          viewType: "other",
        };
        return [{ file: result.value.file, motif: imported, label: imported.label, viewType: imported.viewType }];
      }));
      if (imports.some((result) => result.status === "rejected")) setError("Einige geteilte Bilder konnten nicht geöffnet werden.");
      setStep("list");
    } finally {
      setImporting(false);
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  if (step === "camera" && motif) {
    return <CaptureCamera motif={motif} onClose={() => setStep("list")} onPhoto={async (file) => {
      setReview(await preparePhoto(file));
      setStep("review");
    }} />;
  }

  const slots = category ? [front, back, ...category.details, flaw] : [];
  const completed = slots.filter((slot) => photos.some((photo) => photo.motif.id === slot.id)).length;
  const heading = {
    category: "Kategorie wählen",
    list: "Aufnahmeliste",
    camera: "Kamera",
    review: "Foto prüfen",
    filmstrip: "Fotos sortieren",
  }[step];

  return (
    <section className="mx-auto max-w-[44rem] space-y-5">
      <header className="flex items-center justify-between gap-4 border-b border-outline-variant pb-3">
        <h2 ref={title} tabIndex={-1} className="font-display text-headline-md outline-none">{heading}</h2>
        {step === "list" && <span aria-live="polite" className="shrink-0 font-data-mono text-secondary">{completed} von {slots.length}</span>}
      </header>
      {error && <p role="alert" className="border border-outline-variant bg-surface-container-low p-3">{error}</p>}
      {step === "category" && (
        <div className="grid grid-cols-2 gap-3">
          {GUIDED_CATEGORIES.map((choice) => (
            <button key={choice.id} type="button" disabled={importing} onClick={() => void chooseCategory(choice)}
              className="flex min-h-24 flex-col items-start justify-center gap-2 border border-outline-variant bg-surface-container-low p-3 text-left hover:border-secondary hover:text-secondary disabled:opacity-50 sm:p-4">
              <span className="material-symbols-outlined" aria-hidden="true">{choice.icon}</span>
              <span className="font-display text-headline-sm">{choice.label}</span>
            </button>
          ))}
        </div>
      )}
      {step === "list" && (
        <>
          <ol className="divide-y divide-outline-variant border-y border-outline-variant">
            {slots.map((slot) => {
              const photo = photos.find((entry) => entry.motif.id === slot.id);
              return (
                <li key={slot.id}>
                  <button type="button" onClick={() => { setMotif(slot); setStep("camera"); }}
                    className="flex min-h-14 w-full items-center gap-3 px-2 py-2 text-left hover:bg-surface-container-low">
                    {photo ? <PhotoPreview file={photo.file} alt="" className="size-10 object-cover" /> :
                      <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">add_a_photo</span>}
                    <span className="flex-1">{slot.label}</span>
                    <span className="shrink-0 text-sm text-secondary">{photo ? "Ersetzen" : "Aufnehmen"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="text" onClick={() => setStep("category")}>Kategorie ändern</Button>
            <Button disabled={photos.length === 0} onClick={() => setStep("filmstrip")} className="!px-5">Fotos prüfen</Button>
          </div>
        </>
      )}
      {step === "review" && review && motif && (
        <>
          <PhotoPreview file={review.file} alt={motif.label} className="mx-auto max-h-[55dvh] w-full bg-surface-container-low object-contain" />
          {review.soft && <p role="status" className="border-l-2 border-secondary bg-surface-container-low p-3 font-medium">Etwas unscharf</p>}
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => { setReview(undefined); setStep("camera"); }} className="!px-4">Neu aufnehmen</Button>
            <Button onClick={() => {
              const accepted: Photo = { file: review.file, label: motif.label, viewType: motif.viewType, motif };
              setPhotos((previous) => previous.some((entry) => entry.motif.id === motif.id)
                ? previous.map((entry) => entry.motif.id === motif.id ? accepted : entry)
                : [...previous, accepted]);
              setReview(undefined);
              setStep("list");
            }} className="!px-4">{review.soft ? "Trotzdem verwenden" : "Foto verwenden"}</Button>
            <Button variant="text" onClick={() => { setReview(undefined); setStep("list"); }}>Abbrechen</Button>
          </div>
        </>
      )}
      {step === "filmstrip" && (
        <>
          <p className="text-sm text-on-surface-variant">Ziehe die Fotos in die gewünschte Reihenfolge. Das erste Foto wird zum Titelbild.</p>
          <ol className="flex gap-2 overflow-x-auto pb-2" aria-label="Reihenfolge der Fotos">
            {photos.map((photo, index) => (
              <li key={photo.motif.id} data-photo-index={index}
                className={"w-32 shrink-0 border bg-surface-container-low p-2 " + (dropTarget === index ? "border-secondary" : "border-outline-variant")}>
                <PhotoPreview file={photo.file} alt={photo.label} className="aspect-square w-full object-cover" />
                <p className="min-h-10 pt-2 text-sm">{photo.label}</p>
                <div className="flex items-center justify-between">
                  <button type="button" disabled={index === 0} onClick={() => reorder(index, index - 1)} aria-label={photo.label + " nach links"} className="min-h-10 w-8 disabled:opacity-30">←</button>
                  <button type="button" aria-label={photo.label + " ziehen"} className="touch-none cursor-grab px-1 active:cursor-grabbing"
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDragging(index);
                      setDropTarget(index);
                    }}
                    onPointerMove={(event) => {
                      if (dragging === undefined) return;
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-photo-index]");
                      setDropTarget(target ? Number(target.dataset.photoIndex) : undefined);
                    }}
                    onPointerUp={() => {
                      if (dragging !== undefined && dropTarget !== undefined) reorder(dragging, dropTarget);
                      setDragging(undefined);
                      setDropTarget(undefined);
                    }}
                    onPointerCancel={() => { setDragging(undefined); setDropTarget(undefined); }}>
                    <span className="material-symbols-outlined" aria-hidden="true">drag_indicator</span>
                  </button>
                  <button type="button" disabled={index === photos.length - 1} onClick={() => reorder(index, index + 1)} aria-label={photo.label + " nach rechts"} className="min-h-10 w-8 disabled:opacity-30">→</button>
                </div>
                <button type="button" onClick={() => setPhotos((current) => current.filter((entry) => entry.motif.id !== photo.motif.id))}
                  className="min-h-10 text-sm underline" aria-label={photo.label + " entfernen"}>Entfernen</button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="text" onClick={() => setStep("list")}>Aufnahmeliste</Button>
            <Button disabled={photos.length === 0} className="!px-5" onClick={() => {
              if (!category) return;
              onSubmit(category.id, photos.map(({ file, label: photoLabel, viewType }, index) => {
                const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
                return { file: new File([file], (index + 1) + "-" + photoLabel + "." + extension, { type: file.type }), label: photoLabel, viewType };
              }));
            }}>Bestimmen lassen</Button>
          </div>
        </>
      )}
    </section>
  );
}
