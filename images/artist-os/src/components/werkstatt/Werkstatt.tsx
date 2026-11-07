"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, KeyboardEvent, PointerEvent, ReactNode } from "react";
import {
  ArrowDown, ArrowRight, Check, ChevronDown, ChevronRight, Copy, Disc3, Download,
  Expand, ImagePlus, Images, Layers, LoaderCircle, LockKeyhole, Mic2, Move, Music2,
  Plus, RectangleHorizontal, RectangleVertical, RotateCcw, ScanLine, Share2,
  SlidersHorizontal, Square, Type, Upload, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { applyGem, applyGig, createDefaultData, TEMPLATES } from "./defaults";
import { correctName, fontFamily, loadImage } from "./draw";
import { FORMATS, getFormat } from "./formats";
import { THEMES, getTheme } from "./themes";
import { assetUrl, MEDIA_LIBRARY, STICKERS, TEXTURES } from "./library";
import { DEFAULT_FONTS, renderArtwork } from "./render";
import { canvasToBlob, downloadFile, exportFilename } from "./export";
import { copyText, displayDate, generateCaption } from "./captions";
import type { DesignData, FontFamilies, FormatId, LibraryAsset, LogoPosition, PhotoLook, RenderedArtwork, TemplateId, TextureId, ThemeId, WerkstattProps } from "./types";
import "./Werkstatt.css";

const TEMPLATE_ICONS: Record<TemplateId, LucideIcon> = { gig: Mic2, gem: Disc3, release: Music2, mix: SlidersHorizontal, statement: Type, studio: ImagePlus };
const GALLERY_THEMES: Record<TemplateId, ThemeId> = { gig: "paper", gem: "paper", release: "orange", mix: "night", statement: "orange", studio: "paper" };
const INPUT_CLASS = "min-h-11 w-full border border-fg/40 bg-paper px-3 py-2.5 text-base text-fg transition-colors hover:border-fg focus:border-vinyl focus:outline-none sm:text-sm";
const BUTTON_CLASS = "inline-flex min-h-11 items-center justify-center gap-2 border border-fg/45 px-4 py-2 text-xs font-semibold transition-colors hover:border-fg hover:bg-surface disabled:opacity-40";
const SECTION_CLASS = "mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.12em]";

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className={`wk-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto border-2 border-fg bg-page p-0 text-fg shadow-[6px_6px_0_#141311] ${wide ? "max-w-4xl" : "max-w-lg"}`}>
      <div className="flex items-center justify-between gap-4 border-b border-fg/25 px-5 py-4 sm:px-7">
        <h2 id={titleId} className="type-condensed text-3xl sm:text-4xl">{title}</h2>
        <button type="button" aria-label="Dialog schließen" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center hover:bg-surface"><X size={22} /></button>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </dialog>
  );
}

function TextField({ label, value, onChange, limit = 60, multiline = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; limit?: number; multiline?: boolean; type?: string }) {
  const id = useId();
  const tooLong = value.length > limit;
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold">{label}</label>
        {type !== "date" && <span className={`font-mono text-[9px] ${tooLong ? "text-vinyl-deep" : "text-fg-muted"}`}>{value.length}/{limit}</span>}
      </div>
      {multiline
        ? <textarea id={id} value={value} maxLength={1200} rows={3} onChange={(event) => onChange(event.target.value)} aria-describedby={tooLong ? `${id}-hint` : undefined} className={`${INPUT_CLASS} resize-y`} />
        : <input id={id} type={type} value={value} maxLength={500} onChange={(event) => onChange(event.target.value)} aria-describedby={tooLong ? `${id}-hint` : undefined} className={INPUT_CLASS} />}
      {tooLong && <p id={`${id}-hint`} className="mt-1.5 text-[11px] leading-relaxed text-vinyl-deep">Etwas viel auf der Platte. Der Text passt sich an; kürzer wirkt lauter.</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT_CLASS} appearance-none pr-9`}>{children}</select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3.5" />
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1">
      <span><span className="block text-xs font-semibold">{label}</span>{description && <span className="mt-1 block text-[11px] text-fg-muted">{description}</span>}</span>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className={`relative h-[23px] w-10 shrink-0 border border-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-vinyl ${checked ? "bg-ink" : "bg-surface"}`}>
        <span className={`wk-switch-thumb absolute left-[3px] top-[3px] h-[15px] w-[15px] ${checked ? "translate-x-[17px] bg-vinyl" : "bg-fg-muted"}`} />
      </span>
    </label>
  );
}

function GalleryArtwork({ data, themeId, assetBase, fonts }: { data: DesignData; themeId: ThemeId; assetBase: string; fonts: FontFamilies }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    renderArtwork(data, getFormat("post"), getTheme(themeId), assetBase, fonts).then(({ canvas }) => {
      if (!active) return;
      ref.current?.replaceChildren(canvas);
      setStatus("ready");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [data, themeId, assetBase, fonts]);
  return <div className="relative aspect-square bg-surface" aria-hidden="true">
    <div ref={ref} className="wk-gallery-canvas" />
    {status === "loading" && <div className="absolute inset-0 flex items-center justify-center"><LoaderCircle size={20} className="animate-spin text-fg-muted" /></div>}
    {status === "error" && <div className="absolute inset-0 flex items-center justify-center p-3 text-xs">Vorschau beim Öffnen laden</div>}
  </div>;
}

type DragState = { pointerId: number; x: number; y: number; crop: DesignData["crop"]; overflowX: number; overflowY: number; scale: number };

// Drafts survive a reload or a switch to Instagram. Only this browser, never sent anywhere.
const STORAGE_KEY = "noizy-werkstatt-v1";
type Saved = { data?: DesignData; drafts?: Partial<Record<TemplateId, DesignData>>; formatId?: FormatId; themeId?: ThemeId };

function loadSaved(): Saved {
  try { return typeof window === "undefined" ? {} : JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Saved; } catch { return {}; }
}

function restoreDraft(saved: DesignData | undefined, content: Pick<WerkstattProps, "gigs" | "gems" | "release">): DesignData | undefined {
  if (!saved || !TEMPLATES.some((item) => item.id === saved.template)) return undefined;
  const base = createDefaultData(saved.template, content);
  const draft = { ...base, ...saved };
  // Own photos are blob: URLs that die with the tab.
  if (draft.image.startsWith("blob:")) { draft.image = base.image; draft.crop = base.crop; }
  return draft;
}

export default function Werkstatt({ assetBase, gigs, gems, release, fonts: fontProps }: WerkstattProps) {
  const fonts = useMemo(() => fontProps ?? DEFAULT_FONTS, [fontProps]);
  const content = useMemo(() => ({ gigs, gems, release }), [gigs, gems, release]);
  const [saved] = useState(loadSaved);
  const [data, setData] = useState<DesignData>(() => restoreDraft(saved.data, content) ?? createDefaultData("gig", content));
  const [formatId, setFormatId] = useState<FormatId>(() => FORMATS.some((item) => item.id === saved.formatId) ? saved.formatId! : "post");
  const [themeId, setThemeId] = useState<ThemeId>(() => THEMES.some((item) => item.id === saved.themeId) ? saved.themeId! : "paper");
  const [tab, setTab] = useState<"template" | "content" | "look">("template");
  const [safeZone, setSafeZone] = useState(true);
  const [artwork, setArtwork] = useState<RenderedArtwork | null>(null);
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState("");
  const [notice, setNotice] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [librarySearch, setLibrarySearch] = useState("");
  const [uploads, setUploads] = useState<LibraryAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [fullPreview, setFullPreview] = useState("");
  const [captionOpen, setCaptionOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canvasHost = useRef<HTMLDivElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const uploadedUrls = useRef<string[]>([]);
  const drafts = useRef<Partial<Record<TemplateId, DesignData>>>(Object.fromEntries(
    TEMPLATES.flatMap((item) => { const draft = restoreDraft(saved.drafts?.[item.id], content); return draft ? [[item.id, draft]] : []; }),
  ));
  const instanceId = useId();
  const format = getFormat(formatId);
  const theme = getTheme(themeId);
  const template = TEMPLATES.find((item) => item.id === data.template)!;
  const hasPhoto = data.template !== "statement" && !data.image.includes("pattern-");
  const caption = useMemo(() => generateCaption(data), [data]);
  const galleryData = useMemo(() => TEMPLATES.map((item) => createDefaultData(item.id, content)), [content]);
  const media = useMemo(() => {
    const items: LibraryAsset[] = [...uploads, ...MEDIA_LIBRARY];
    for (const gem of gems ?? []) if (!items.some((item) => item.path === gem.img)) items.push({ path: gem.img, role: "gem-cover", name: gem.title, width: 1080, height: 1080 });
    if (release && !items.some((item) => item.path === release.cover)) items.push({ path: release.cover, role: "release-cover", name: release.title, width: 1080, height: 1080 });
    return items;
  }, [gems, release, uploads]);
  const currentImage = media.find((item) => item.path === data.image);
  const filteredMedia = media.filter((item) => {
    const category = libraryFilter === "all" || (libraryFilter === "photos" && ["photo", "upload"].includes(item.role)) || (libraryFilter === "covers" && item.role.includes("cover")) || (libraryFilter === "patterns" && item.path.includes("pattern-"));
    return category && item.name.toLocaleLowerCase("de").includes(librarySearch.toLocaleLowerCase("de"));
  });

  // A finished render only counts for the exact inputs it was started with.
  const renderKey = useMemo(() => ({ data, format, theme, assetBase, fonts, retry }), [data, format, theme, assetBase, fonts, retry]);
  const [done, setDone] = useState<{ key: object; file: File | null; error: string } | null>(null);
  const current = done?.key === renderKey ? done : null;
  const rendering = !current;
  const preparedFile = current?.file ?? null;
  const renderError = current?.error ?? "";

  useEffect(() => {
    let active = true;
    renderArtwork(data, format, theme, assetBase, fonts).then(async (result) => {
      if (!active) return;
      result.canvas.setAttribute("role", "img");
      result.canvas.setAttribute("aria-label", `${template.name}, ${format.name}, ${format.width} mal ${format.height} Pixel`);
      canvasHost.current?.replaceChildren(result.canvas);
      setArtwork(result);
      const blob = await canvasToBlob(result.canvas, format);
      if (!active) return;
      setDone({ key: renderKey, file: new File([blob], exportFilename(data.template, format), { type: "image/png" }), error: "" });
    }).catch((error: unknown) => {
      if (!active) return;
      setDone({ key: renderKey, file: null, error: error instanceof Error && error.message.startsWith("Dein Browser") ? error.message : "Das Bild konnte nicht geladen werden. Prüfe deine Verbindung und versuch es noch einmal." });
    });
    return () => { active = false; };
  }, [renderKey, data, format, theme, assetBase, fonts, template.name]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, drafts: drafts.current, formatId, themeId } satisfies Saved)); } catch { /* storage is optional */ }
  }, [data, formatId, themeId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const urls = uploadedUrls.current;
    return () => { for (const url of urls) URL.revokeObjectURL(url); };
  }, []);

  function update<K extends keyof DesignData>(key: K, value: DesignData[K]) {
    const corrected = typeof value === "string" && key !== "image" ? correctName(value) : value;
    if (corrected !== value) setNotice('Kleiner Marken-Check: Es heißt "Neighbor", ohne u. Schon korrigiert.');
    setData((previous) => ({ ...previous, [key]: corrected }));
  }

  function selectTemplate(id: TemplateId, fromGallery = false) {
    drafts.current[data.template] = data;
    setData(fromGallery ? createDefaultData(id, content) : drafts.current[id] ?? createDefaultData(id, content));
    if (fromGallery) {
      setFormatId("post");
      setThemeId(GALLERY_THEMES[id]);
      setTab("content");
      scrollToElement(editorRef.current);
      window.requestAnimationFrame(() => document.getElementById(`${instanceId}-tab-content`)?.focus({ preventScroll: true }));
      setNotice("Vorlage geladen. Jetzt dein Ding draus machen.");
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setNotice("Bitte eine Bilddatei auswählen."); return; }
    if (file.size > 30 * 1024 * 1024) { setNotice("Die Datei ist etwas groß. Bitte ein Foto mit höchstens 30 MB wählen."); return; }
    setUploading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      uploadedUrls.current.push(url);
      setUploads((previous) => [{ path: url, role: "upload", name: file.name, width: image.naturalWidth, height: image.naturalHeight }, ...previous]);
      setData((previous) => ({ ...previous, image: url, crop: { x: 0, y: 0, zoom: 1 } }));
      setLibraryOpen(false);
      setNotice("Dein Foto ist drin. Es bleibt nur in diesem Browser.");
    } catch {
      URL.revokeObjectURL(url);
      setNotice("Dieses Bildformat lässt sich nicht öffnen. Versuche JPG, PNG oder WebP.");
    } finally { setUploading(false); }
  }

  function chooseImage(item: LibraryAsset) {
    setData((previous) => ({ ...previous, image: item.path, photoLook: item.role.includes("cover") ? "original" : previous.photoLook, crop: { x: 0, y: 0, zoom: 1 } }));
    setLibraryOpen(false);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasPhoto || !artwork?.photoRect || !artwork.imageSize || event.button !== 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = format.width / bounds.width;
    const x = (event.clientX - bounds.left) * scale;
    const y = (event.clientY - bounds.top) * scale;
    const photo = artwork.photoRect;
    if (x < photo.x || x > photo.x + photo.width || y < photo.y || y > photo.y + photo.height) return;
    const coverScale = Math.max(photo.width / artwork.imageSize.width, photo.height / artwork.imageSize.height) * data.crop.zoom;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, crop: data.crop, scale, overflowX: artwork.imageSize.width * coverScale - photo.width, overflowY: artwork.imageSize.height * coverScale - photo.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = (event.clientX - start.x) * start.scale;
    const dy = (event.clientY - start.y) * start.scale;
    const x = Math.max(-1, Math.min(1, start.crop.x - (start.overflowX > 1 ? 2 * dx / start.overflowX : 0)));
    const y = Math.max(-1, Math.min(1, start.crop.y - (start.overflowY > 1 ? 2 * dy / start.overflowY : 0)));
    setData((previous) => ({ ...previous, crop: { ...previous.crop, x, y } }));
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);
  }

  function cropKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasPhoto || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.2 : 0.05;
    if (event.key === "Home") { update("crop", { x: 0, y: 0, zoom: 1 }); return; }
    update("crop", { ...data.crop,
      x: Math.max(-1, Math.min(1, data.crop.x + (event.key === "ArrowLeft" ? step : event.key === "ArrowRight" ? -step : 0))),
      y: Math.max(-1, Math.min(1, data.crop.y + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0))),
    });
  }

  function downloadCurrent() {
    if (!preparedFile || rendering) return;
    downloadFile(preparedFile, exportFilename(data.template, format));
    setNotice(`Dein ${format.shortName}-PNG ist bereit. ${format.width} × ${format.height} Pixel, voller Noizy-Look.`);
  }

  async function exportAll() {
    if (exporting) return;
    const snapshot = data;
    try {
      for (let index = 0; index < FORMATS.length; index++) {
        const target = FORMATS[index];
        setExporting(`${index + 1}/6 · ${target.shortName}`);
        const result = await renderArtwork(snapshot, target, theme, assetBase, fonts);
        const blob = await canvasToBlob(result.canvas, target);
        downloadFile(blob, exportFilename(snapshot.template, target));
        await new Promise((resolve) => window.setTimeout(resolve, 450));
      }
      setNotice("Alle 6 PNGs sind bereit. Erlaube mehrere Downloads, falls dein Browser nachfragt.");
    } catch { setNotice("Nicht alle Formate konnten exportiert werden. Bitte erneut versuchen."); }
    finally { setExporting(""); }
  }

  async function shareCurrent() {
    if (!preparedFile) return;
    // Prepare before the click to preserve iOS transient user activation.
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [preparedFile] })) {
      try {
        await navigator.share({ files: [preparedFile], title: "DJ Noizy Neighbor", text: caption });
        setNotice("Weitergegeben. Ab in den Feed.");
      } catch (error) {
        if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") return;
        downloadCurrent();
      }
    } else downloadCurrent();
  }

  async function copyCaption() {
    try {
      await copyText(caption);
      setCopied(true);
      setNotice("Caption kopiert. Bereit für deinen Post.");
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Bitte den Text manuell kopieren."); }
  }

  function tabKeyboard(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const tabs = ["template", "content", "look"] as const;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === "Home" ? 0 : event.key === "End" ? 2 : (current + (event.key === "ArrowRight" ? 1 : 2)) % 3;
    setTab(tabs[index]);
    document.getElementById(`${instanceId}-tab-${tabs[index]}`)?.focus();
  }

  const rootStyle = { "--wk-display": fontFamily(fonts.display), "--wk-mono": fontFamily(fonts.mono), "--wk-texture": `url("${assetUrl(assetBase, "/assets/ui/ui-vintage-paper-texture.webp")}")` } as CSSProperties;

  return (
    <div className="noizy-werkstatt min-h-screen bg-page text-fg" style={rootStyle}>
      <header className="border-b-2 border-fg">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-6">
            <img src={assetUrl(assetBase, "/assets/brandkit/wordmark-ink.png")} alt="DJ Noizy Neighbor" width={986} height={525} className="h-[47px] w-[93px] object-contain" />
            <span className="hidden h-7 border-l border-fg/30 sm:block" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] sm:block">Independent sound.<br /><span className="mt-1 inline-block">Independent design.</span></span>
          </div>
          <nav aria-label="Werkstatt-Navigation" className="flex items-center gap-3 sm:gap-7">
            <button type="button" onClick={() => setHelpOpen(true)} className="min-h-11 text-xs font-medium transition-colors hover:text-vinyl-deep sm:text-[13px]">So funktioniert’s</button>
            <button type="button" onClick={() => scrollToElement(galleryRef.current)} className="flex min-h-11 items-center gap-2 border-l border-fg/25 pl-4 text-xs font-bold sm:pl-7 sm:text-[13px]">Alle Vorlagen <ArrowDown size={15} /></button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <section className="wk-enter flex flex-col justify-between gap-4 pb-6 pt-8 lg:flex-row lg:items-end lg:pb-6">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.17em] text-fg-muted sm:text-[10px]">DJ Noizy Neighbor <span className="px-2 text-vinyl">/</span> Dein kreativer Werkzeugkasten</p>
            <h1 className="type-condensed text-[46px] sm:text-[62px] xl:text-[70px]">Marken<span className="text-vinyl">-</span>Werkstatt<span className="text-vinyl">.</span></h1>
          </div>
          <p className="max-w-[285px] text-[13px] leading-relaxed text-fg-muted lg:pb-0.5">Dein Sound hat einen Look.<br />Vorlage wählen. Text rein. Raus damit.</p>
        </section>

        <div ref={editorRef} className="wk-enter-delayed grid scroll-mt-6 gap-7 lg:grid-cols-[minmax(0,1fr)_365px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <section aria-label="Live-Vorschau" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="border border-fg/35">
              <div className="flex min-h-[49px] items-center justify-between gap-2 border-b border-fg/25 bg-page px-4 sm:px-5">
                <div className="flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em]"><span className="h-1.5 w-1.5 bg-vinyl" />Live-Vorschau</div>
                <div className="flex items-center gap-1">
                  {formatId === "story" && <button type="button" onClick={() => setSafeZone(!safeZone)} aria-pressed={safeZone} title="Story-Safe-Zone anzeigen" className={`flex min-h-11 items-center gap-1.5 px-2 text-[10px] ${safeZone ? "text-vinyl-deep" : "text-fg-muted"}`}><ScanLine size={15} /><span className="hidden sm:inline">Safe-Zone</span></button>}
                  <button type="button" aria-label="Entwurf zurücksetzen" title="Entwurf zurücksetzen" onClick={() => setResetOpen(true)} className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted hover:text-fg"><RotateCcw size={16} /></button>
                  <button type="button" aria-label="Vorschau vergrößern" title="Vorschau vergrößern" disabled={!artwork || rendering} onClick={() => artwork && setFullPreview(artwork.canvas.toDataURL("image/png"))} className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted hover:text-fg disabled:opacity-40"><Expand size={17} /></button>
                </div>
              </div>
              <div className="wk-paper flex min-h-[320px] items-center justify-center overflow-hidden bg-surface p-5 sm:p-7 lg:h-[550px] xl:h-[568px]">
                <div className="relative border border-fg bg-page shadow-[6px_6px_0_#141311]" style={{ width: `min(100%, ${Math.min(760, 500 * format.width / format.height)}px)`, aspectRatio: `${format.width} / ${format.height}`, touchAction: hasPhoto ? "none" : "auto", cursor: hasPhoto ? dragging ? "grabbing" : "grab" : "default" }}
                  tabIndex={hasPhoto ? 0 : -1} role="group" aria-label={hasPhoto ? "Bildausschnitt. Foto ziehen oder mit den Pfeiltasten verschieben. Pos1 setzt zurück." : "Deine Grafik"}
                  onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onKeyDown={cropKeyboard}>
                  <div ref={canvasHost} className="wk-canvas" />
                  {!artwork && !renderError && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-page"><LoaderCircle size={26} className="animate-spin text-vinyl" /><span className="font-mono text-[10px] uppercase">Dein Look wird geladen</span></div>}
                  {formatId === "story" && safeZone && <div className="pointer-events-none absolute inset-0 font-mono text-[8px] uppercase tracking-wide text-paper" aria-hidden="true"><div className="wk-safe-zone absolute inset-x-0 top-0 flex items-center justify-center border-b border-dashed border-paper" style={{ height: `${250 / 1920 * 100}%` }}>250 px / frei halten</div><div className="wk-safe-zone absolute inset-x-0 bottom-0 flex items-center justify-center border-t border-dashed border-paper" style={{ height: `${340 / 1920 * 100}%` }}>340 px / frei halten</div></div>}
                  {renderError && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-page p-6 text-center"><p className="max-w-xs text-sm">{renderError}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className={BUTTON_CLASS}><RotateCcw size={16} />Erneut versuchen</button></div>}
                </div>
              </div>
              <div className="flex min-h-[47px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-fg/25 bg-page px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-fg-muted sm:px-5">
                <span>{format.name}</span><span>{format.width} × {format.height} px{formatId === "flyer" ? " / 150 dpi" : " / PNG"}</span>
              </div>
            </div>
            <div className="flex min-h-[57px] items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[11px] text-fg-muted">{hasPhoto ? <><Move size={14} /><span>Dein Foto. Dein Ausschnitt.<span className="hidden xl:inline"> Einfach ziehen.</span></span></> : <><Check size={14} /><span>{data.template === "statement" ? "Worte, die für sich stehen." : "Originalmuster. Original Noizy."}</span></>}</p>
              {hasPhoto && <div className="flex items-center gap-2">
                <label htmlFor={`${instanceId}-zoom`} className="sr-only">Foto-Zoom</label>
                <input id={`${instanceId}-zoom`} type="range" min="100" max="300" value={Math.round(data.crop.zoom * 100)} onChange={(event) => update("crop", { ...data.crop, zoom: Number(event.target.value) / 100 })} className="h-11 w-20 sm:w-24" />
                <span className="w-8 text-right font-mono text-[9px]">{Math.round(data.crop.zoom * 100)}%</span>
              </div>}
            </div>
          </section>

          <section aria-label="Dein Design bearbeiten" className="min-w-0">
            <div role="tablist" aria-label="Bearbeitungsschritte" className="flex border-b border-fg/35">
              {([{ id: "template", name: "Vorlage" }, { id: "content", name: "Inhalt" }, { id: "look", name: "Look" }] as const).map((item, index) => <button key={item.id} type="button" role="tab" id={`${instanceId}-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`${instanceId}-panel`} tabIndex={tab === item.id ? 0 : -1} onKeyDown={(event) => tabKeyboard(event, index)} onClick={() => setTab(item.id)} className={`relative flex min-h-[49px] flex-1 items-center justify-center gap-2 text-[13px] transition-colors ${tab === item.id ? "font-bold text-fg after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-vinyl" : "text-fg-muted hover:bg-surface/50"}`}><span className={`font-mono text-[9px] ${tab === item.id ? "text-vinyl-deep" : "opacity-60"}`}>0{index + 1}</span>{item.name}</button>)}
            </div>

            <div id={`${instanceId}-panel`} role="tabpanel" aria-labelledby={`${instanceId}-tab-${tab}`} className="pt-5">
              {tab === "template" && <div key="template" className="wk-tab-content space-y-5">
                <div>
                  <div className={SECTION_CLASS}><span>Was liegt an?</span><span className="font-normal tracking-normal text-fg-muted">6 Vorlagen. Ein Look.</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map((item) => { const Icon = TEMPLATE_ICONS[item.id]; const active = data.template === item.id; return <button key={item.id} type="button" aria-pressed={active} onClick={() => selectTemplate(item.id)} className={`wk-template-button relative flex min-h-[68px] flex-col items-center justify-center gap-2 border text-[10px] font-semibold sm:text-[11px] ${active ? "border-vinyl bg-vinyl/10 text-ink shadow-[inset_0_0_0_1px_#e85c0d]" : "border-fg/25 bg-paper/35 hover:border-fg"}`}><Icon size={21} strokeWidth={1.6} className={active ? "text-vinyl-deep" : ""} /><span>{item.shortName}</span>{active && <span className="absolute right-1.5 top-1.5 h-1 w-1 bg-vinyl" />}</button>; })}
                  </div>
                </div>
                <div>
                  <h3 className={SECTION_CLASS}>Wohin damit?</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((item) => { const Icon = item.width === item.height ? Square : item.width > item.height ? RectangleHorizontal : RectangleVertical; return <button key={item.id} type="button" aria-pressed={formatId === item.id} aria-label={`${item.name}, ${item.width} mal ${item.height} Pixel`} onClick={() => setFormatId(item.id)} className={`flex min-h-[49px] items-center justify-start gap-2 border px-2.5 py-2 transition-colors ${formatId === item.id ? "border-fg bg-ink text-paper" : "border-fg/25 hover:border-fg"}`}><Icon size={17} strokeWidth={1.5} className="shrink-0" /><span className="text-left"><span className="block text-[10px] font-semibold">{item.shortName}</span><span className={`mt-0.5 block font-mono text-[9px] ${formatId === item.id ? "text-paper/65" : "text-fg-muted"}`}>{item.ratio}</span></span></button>; })}
                  </div>
                  {format.note && <p className="mt-2 text-[10px] leading-relaxed text-fg-muted">{format.note}</p>}
                </div>
                <div>
                  <h3 className={SECTION_CLASS}>Deine Farbwelt</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map((item) => <button key={item.id} type="button" aria-pressed={themeId === item.id} onClick={() => setThemeId(item.id)} className={`flex min-h-[52px] flex-col items-center justify-center gap-1.5 border transition-colors ${themeId === item.id ? "border-fg bg-paper/60" : "border-transparent hover:border-fg/25"}`}><span className="flex h-6 w-9 items-center justify-center border border-fg/50" style={{ background: item.background, color: item.text }}>{themeId === item.id ? <Check size={14} strokeWidth={2.5} /> : <span className="h-2 w-2" style={{ background: item.accent }} />}</span><span className="text-[10px] font-medium">{item.name}</span></button>)}
                  </div>
                </div>
                <button type="button" onClick={() => setTab("content")} className="flex min-h-11 w-full items-center justify-between border-t border-fg/20 text-xs font-semibold"><span>Jetzt deinen Inhalt rein.</span><ArrowRight size={16} /></button>
              </div>}

              {tab === "content" && <div key="content" className="wk-tab-content space-y-4">
                <div className={SECTION_CLASS}><span>{template.name}</span><Type size={15} strokeWidth={1.5} /></div>
                {data.template === "gig" && <>
                  {!!gigs?.length && <SelectField label="Aus deinen Terminen übernehmen" value="" onChange={(value) => { if (value !== "") setData(applyGig(data, gigs[Number(value)])); }}><option value="">Termin auswählen ...</option>{gigs.map((gig, index) => <option key={`${gig.date}-${index}`} value={index}>{displayDate(gig.date)} / {gig.venue}</option>)}</SelectField>}
                  <div className="grid grid-cols-2 gap-3"><TextField label="Datum" type="date" value={data.date} onChange={(value) => update("date", value)} /><SelectField label="Status" value={data.status} onChange={(value) => update("status", value as DesignData["status"])}><option value="TICKETS">Tickets</option><option value="CONFIRMED">Bestätigt</option><option value="SOLD OUT">Sold out</option></SelectField></div>
                  <TextField label="Location" value={data.venue} onChange={(value) => update("venue", value)} limit={28} />
                  <TextField label="Stadt" value={data.city} onChange={(value) => update("city", value)} limit={24} />
                  <TextField label="Deine Notiz" value={data.note} onChange={(value) => update("note", value)} limit={55} />
                </>}
                {data.template === "gem" && <>
                  {!!gems?.length && <SelectField label="Aus deiner Plattenkiste übernehmen" value="" onChange={(value) => { if (value !== "") setData(applyGem(data, gems[Number(value)])); }}><option value="">Gem auswählen ...</option>{gems.map((gem, index) => <option key={`${gem.img}-${index}`} value={index}>{gem.title}</option>)}</SelectField>}
                  <TextField label="Titel" value={data.title} onChange={(value) => update("title", value)} limit={64} />
                  <TextField label="Artist (optional)" value={data.artist} onChange={(value) => update("artist", value)} limit={35} />
                  <div className="grid grid-cols-2 gap-3"><TextField label="Label / Katalognummer" value={data.label} onChange={(value) => update("label", value)} limit={30} /><TextField label="Land" value={data.country} onChange={(value) => update("country", value)} limit={20} /></div>
                  <TextField label="Badge" value={data.badge} onChange={(value) => update("badge", value)} limit={28} />
                  <TextField label="Die Geschichte in einer Zeile" value={data.story} onChange={(value) => update("story", value)} limit={70} />
                </>}
                {data.template === "release" && <>
                  {release && <button type="button" onClick={() => setData((previous) => ({ ...previous, title: correctName(release.title), year: release.year, label: correctName(release.label), image: release.cover, photoLook: "original", crop: { x: 0, y: 0, zoom: 1 } }))} className={`${BUTTON_CLASS} w-full justify-between`}><span>Aktuellen Release übernehmen</span><ArrowDown size={15} /></button>}
                  <TextField label="Release- / Track-Titel" value={data.title} onChange={(value) => update("title", value)} limit={45} />
                  <div className="grid grid-cols-[90px_1fr] gap-3"><TextField label="Jahr" value={data.year} onChange={(value) => update("year", value)} limit={4} /><TextField label="Label" value={data.label} onChange={(value) => update("label", value)} limit={40} /></div>
                  <p className="border-l-2 border-vinyl pl-3 text-xs leading-relaxed text-fg-muted">Mit dabei: JETZT ÜBERALL und die Streaming-Namen Spotify, Apple Music und YouTube. Keine fremden Logos.</p>
                </>}
                {data.template === "mix" && <>
                  <TextField label="Titel deines Sets" value={data.title} onChange={(value) => update("title", value)} limit={30} />
                  <TextField label="Untertitel" value={data.subtitle} onChange={(value) => update("subtitle", value)} limit={80} multiline />
                  <TextField label="Plattform" value={data.platform} onChange={(value) => update("platform", value)} limit={25} />
                  <button type="button" onClick={() => { setLibraryFilter("patterns"); setLibraryOpen(true); }} className={`${BUTTON_CLASS} w-full`}><Images size={16} />Foto oder Originalmuster wählen</button>
                </>}
                {data.template === "statement" && <>
                  <TextField label="Dein Statement" value={data.statement} onChange={(value) => update("statement", value)} limit={85} multiline />
                  <fieldset><legend className="mb-2 text-xs font-semibold">Welches Wort soll laut werden?</legend><p className="mb-3 text-[11px] text-fg-muted">Ein Wort antippen. Deine Akzentfarbe erledigt den Rest.</p><div className="flex flex-wrap gap-2">{data.statement.trim().split(/\s+/).filter(Boolean).map((word, index) => <button key={`${index}-${word}`} type="button" aria-pressed={data.accentWord === index} onClick={() => update("accentWord", index)} className={`min-h-11 border px-3 text-xs font-bold uppercase ${data.accentWord === index ? "border-fg bg-vinyl text-ink" : "border-fg/30 hover:border-fg"}`}>{word}</button>)}</div></fieldset>
                </>}
                {data.template === "studio" && <>
                  <TextField label="Eine Zeile aus dem Studio" value={data.title} onChange={(value) => update("title", value)} limit={50} />
                  <TextField label="Mono-Label" value={data.label} onChange={(value) => update("label", value)} limit={55} />
                  <p className="border-l-2 border-vinyl pl-3 text-xs leading-relaxed text-fg-muted">Foto groß. Eine Zeile drunter. Der gerade Papierstreifen macht den Look.</p>
                </>}
                <button type="button" onClick={() => setTab("look")} className="flex min-h-11 w-full items-center justify-between border-t border-fg/20 text-xs font-semibold"><span>Weiter zum Feinschliff.</span><ArrowRight size={16} /></button>
              </div>}

              {tab === "look" && <div key="look" className="wk-tab-content space-y-5">
                {data.template !== "statement" && <>
                  <div><h3 className={SECTION_CLASS}>Dein Bildmaterial</h3><div className="flex gap-3"><img src={assetUrl(assetBase, data.image)} crossOrigin="anonymous" alt={currentImage?.name ?? "Ausgewähltes Foto"} className="h-[85px] w-[85px] shrink-0 border border-fg/30 object-cover" /><div className="flex min-w-0 flex-1 flex-col justify-between"><p className="truncate text-xs font-semibold">{currentImage?.name ?? "Dein Foto"}</p><button type="button" onClick={() => { setLibraryFilter("all"); setLibraryOpen(true); }} className={`${BUTTON_CLASS} justify-start px-3`}><Images size={16} />Bibliothek öffnen</button></div></div><button type="button" disabled={uploading} onClick={() => uploadInput.current?.click()} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 border border-dashed border-fg/40 text-[11px] font-semibold hover:border-fg">{uploading ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}Eigenes Foto vom Gerät</button><p className="mt-2 flex items-center gap-1.5 text-[10px] text-fg-muted"><LockKeyhole size={11} />Bleibt im Browser. Kein Upload ins Netz.</p></div>
                  {!data.image.includes("pattern-") && <div><h3 className={SECTION_CLASS}>Fotolook</h3><div className="grid grid-cols-3">{([{ id: "duotone", label: "Duotone" }, { id: "bw", label: "Schwarzweiß" }, { id: "original", label: "Original" }] as { id: PhotoLook; label: string }[]).map((look) => <button key={look.id} type="button" aria-pressed={data.photoLook === look.id} onClick={() => update("photoLook", look.id)} className={`min-h-11 border-y border-l last:border-r text-[10px] font-medium ${data.photoLook === look.id ? "border-fg bg-ink text-paper" : "border-fg/35 hover:bg-surface"}`}>{look.label}</button>)}</div></div>}
                </>}
                <div><h3 className={SECTION_CLASS}>Dein Absender</h3><div className="grid grid-cols-2 gap-3"><SelectField label="Logo-Position" value={data.logoPosition} onChange={(value) => update("logoPosition", value as LogoPosition)}><option value="top-left">Oben links</option><option value="top-right">Oben rechts</option><option value="bottom-left">Unten links</option><option value="bottom-right">Unten rechts</option><option value="off">Ohne Logo</option></SelectField><SelectField label="Logo-Variante" value={data.logoVariant} onChange={(value) => update("logoVariant", value as DesignData["logoVariant"])}><option value="badge">Badge</option><option value="wordmark">Schriftzug</option></SelectField><SelectField label="Sticker neben dem Logo" value={data.sticker} onChange={(value) => update("sticker", value)}><option value="">Ohne Sticker</option>{STICKERS.map((item) => <option key={item.path} value={item.path}>{item.name}</option>)}</SelectField><SelectField label="Struktur" value={data.texture} onChange={(value) => update("texture", value as TextureId)}><option value="off">Glatt</option>{TEXTURES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></div></div>
                {formatId === "story" && <div className="space-y-2 border-t border-fg/20 pt-3"><Toggle label="Story-Safe-Zone anzeigen" description="Nur zur Orientierung. Nicht im Export." checked={safeZone} onChange={setSafeZone} /></div>}
                {hasPhoto && <button type="button" onClick={() => update("crop", { x: 0, y: 0, zoom: 1 })} className="flex min-h-11 items-center gap-2 text-[11px] font-medium text-fg-muted hover:text-fg"><RotateCcw size={14} />Bildausschnitt zurücksetzen</button>}
              </div>}
            </div>

            <div className="mt-4 border-t border-fg/30 pt-4">
              <button type="button" disabled={rendering || !preparedFile || !!exporting} onClick={downloadCurrent} className="wk-export sticker flex min-h-[51px] w-full items-center justify-center gap-3 bg-vinyl px-4 text-[13px] font-bold text-ink disabled:opacity-50">{rendering || exporting ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}<span>{exporting ? `Export ${exporting}` : rendering ? "Dein PNG wird vorbereitet" : "PNG herunterladen"}</span><span className="ml-auto font-mono text-[9px] font-normal">{format.ratio}</span></button>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-3"><button type="button" disabled={!!exporting || rendering || !!renderError} onClick={() => void exportAll()} className="flex min-h-11 items-center justify-center gap-2 text-[11px] font-medium text-fg-muted hover:text-fg disabled:opacity-40"><Layers size={14} />Alle Formate <span className="font-mono text-[9px]">(6)</span></button><button type="button" disabled={!preparedFile || rendering || !!exporting} onClick={() => void shareCurrent()} className="flex min-h-11 items-center gap-2 pl-3 text-[11px] font-medium text-fg-muted hover:text-fg disabled:opacity-40"><Share2 size={14} />Teilen</button></div>
              <div className="border-t border-fg/20"><button type="button" aria-expanded={captionOpen} aria-controls={`${instanceId}-caption-panel`} onClick={() => setCaptionOpen(!captionOpen)} className="flex min-h-[49px] w-full items-center justify-between gap-3 text-xs font-semibold"><span className="flex items-center gap-2"><Copy size={14} />Die Caption kommt mit.</span><Plus size={16} className={`transition-transform ${captionOpen ? "rotate-45" : ""}`} /></button>{captionOpen && <div id={`${instanceId}-caption-panel`} className="wk-tab-content pb-3"><label htmlFor={`${instanceId}-caption`} className="mb-2 block text-[10px] text-fg-muted">Dein Instagram-Text, ganz ohne KI.</label><textarea id={`${instanceId}-caption`} value={caption} readOnly rows={9} className={`${INPUT_CLASS} font-mono text-[10px] leading-relaxed`} /><button type="button" onClick={() => void copyCaption()} className={`${BUTTON_CLASS} mt-2 w-full`}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Kopiert" : "Caption kopieren"}</button></div>}</div>
            </div>
          </section>
        </div>

        <section ref={galleryRef} aria-labelledby={`${instanceId}-gallery-heading`} className="scroll-mt-8 border-t-2 border-fg pb-10 pt-7 lg:mt-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-fg-muted">Die Vorlagen-Sammlung</p><h2 id={`${instanceId}-gallery-heading`} className="type-condensed text-[32px] sm:text-[38px]">Sechs Vorlagen. <span className="text-vinyl-deep">Dein Stil.</span></h2></div><p className="flex items-center gap-2 text-[11px] text-fg-muted">Nimm eine. Mach sie zu deiner.<ArrowDown size={14} /></p></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {galleryData.map((item, index) => <button key={item.template} type="button" onClick={() => selectTemplate(item.template, true)} className="group min-h-11 text-left" aria-label={`${TEMPLATES[index].name} als Post verwenden`}><div className="overflow-hidden border border-fg/60 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[3px_3px_0_#141311]"><GalleryArtwork data={item} themeId={GALLERY_THEMES[item.template]} assetBase={assetBase} fonts={fonts} /></div><span className="mt-3 flex items-center justify-between gap-1 text-[11px] font-semibold"><span>{TEMPLATES[index].shortName}</span><ChevronRight size={13} className="transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block font-mono text-[8px] uppercase tracking-wide text-fg-muted">0{index + 1} / 1080 × 1080</span></button>)}
          </div>
        </section>
      </main>

      <footer className="border-t border-fg/25"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 px-5 py-6 font-mono text-[9px] uppercase tracking-[0.08em] text-fg-muted sm:flex-row sm:items-center sm:px-8 lg:px-12"><span>DJ Noizy Neighbor <span className="px-2 text-vinyl">/</span> Made of records. Not templates.</span><span className="flex items-center gap-2"><LockKeyhole size={12} />Deine Dateien bleiben bei dir.</span></div></footer>

      <label htmlFor={`${instanceId}-upload`} className="sr-only">Eigenes Foto auswählen</label><input ref={uploadInput} id={`${instanceId}-upload`} type="file" accept="image/*" onChange={(event) => void handleUpload(event)} className="sr-only" tabIndex={-1} />
      <div role="status" aria-live="polite" aria-atomic="true" className={`pointer-events-none fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 transition-all duration-200 ${notice ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>{notice && <div className="flex items-start gap-3 border-2 border-fg bg-ink px-4 py-3 text-xs leading-relaxed text-paper shadow-[4px_4px_0_#e85c0d]"><Check size={17} className="mt-0.5 shrink-0 text-vinyl" /><span>{notice}</span></div>}</div>

      {libraryOpen && <Modal title="Deine Plattenkiste" wide onClose={() => setLibraryOpen(false)}>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-fg-muted">Originale Bilder. Original Noizy.</p><button type="button" disabled={uploading} onClick={() => uploadInput.current?.click()} className={`${BUTTON_CLASS} bg-vinyl text-ink`}><Upload size={15} />Eigenes Foto wählen</button></div>
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-fg/25 pb-4 sm:flex-row"><div className="flex flex-wrap gap-1">{[{ id: "all", name: "Alle" }, { id: "photos", name: "Fotos" }, { id: "covers", name: "Cover" }, { id: "patterns", name: "Muster" }].map((item) => <button key={item.id} type="button" aria-pressed={libraryFilter === item.id} onClick={() => setLibraryFilter(item.id)} className={`min-h-11 border px-3 text-xs ${libraryFilter === item.id ? "border-fg bg-ink text-paper" : "border-transparent hover:border-fg/30"}`}>{item.name}</button>)}</div><div><label htmlFor={`${instanceId}-search`} className="sr-only">Bildbibliothek durchsuchen</label><input id={`${instanceId}-search`} type="search" placeholder="In der Kiste suchen ..." value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} className={INPUT_CLASS} /></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{filteredMedia.map((item) => <button key={item.path} type="button" onClick={() => chooseImage(item)} className={`group min-h-11 text-left ${data.image === item.path ? "outline-2 outline-offset-4 outline-vinyl" : ""}`}><div className="relative aspect-square overflow-hidden bg-surface"><img crossOrigin="anonymous" src={assetUrl(assetBase, item.path)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />{data.image === item.path && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-vinyl text-ink"><Check size={15} /></span>}</div><span className="mt-2 block min-h-8 text-[11px] font-medium">{item.name}</span></button>)}</div>
        {!filteredMedia.length && <p className="py-10 text-center text-sm text-fg-muted">In dieser Kiste liegt noch nichts. Versuch einen anderen Suchbegriff.</p>}
        <p className="mt-5 flex items-center gap-2 border-t border-fg/25 pt-4 text-[11px] text-fg-muted"><LockKeyhole size={13} />Eigene Fotos bleiben auf deinem Gerät. Maximal 30 MB pro Bild.</p>
      </Modal>}

      {helpOpen && <Modal title="In drei Tracks zum Post." onClose={() => setHelpOpen(false)}><div className="space-y-6">{[{ title: "Vorlage auflegen.", text: "Gig, Gem, Release oder ein bisschen Haltung. Wähle deine Vorlage, das Format und eine der vier Farbwelten." }, { title: "Dein Ding draus machen.", text: "Text anpassen, ein Originalfoto oder dein eigenes Bild wählen. Mit Ziehen und Zoom sitzt der Ausschnitt." }, { title: "Ab in den Feed.", text: "Das PNG kommt in voller Größe. Auf dem Handy kannst du direkt teilen. Eine fertige Caption gibt es dazu." }].map((step, index) => <div key={step.title} className="flex gap-5"><span className="type-condensed text-5xl text-vinyl-deep">0{index + 1}</span><div><h3 className="mb-1 text-sm font-bold">{step.title}</h3><p className="text-xs leading-relaxed text-fg-muted">{step.text}</p></div></div>)}</div><p className="mt-7 border-t border-fg/25 pt-5 text-[11px] leading-relaxed text-fg-muted">Kein Login. Keine KI. Kein Upload auf einen Server. Deine Entwürfe merkt sich nur dieser Browser, eigene Fotos bleiben nur in dieser Sitzung.</p><button type="button" onClick={() => setHelpOpen(false)} className={`${BUTTON_CLASS} mt-5 w-full border-fg bg-vinyl`}>Los geht’s <ArrowRight size={16} /></button></Modal>}

      {resetOpen && <Modal title="Zurück auf Anfang?" onClose={() => setResetOpen(false)}><p className="text-sm leading-relaxed text-fg-muted">Deine Änderungen an dieser Vorlage werden durch die Beispieldaten ersetzt. Format und Farbwelt bleiben erhalten.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => setResetOpen(false)} className={`${BUTTON_CLASS} flex-1`}>Doch nicht</button><button type="button" onClick={() => { setData(createDefaultData(data.template, content)); delete drafts.current[data.template]; setResetOpen(false); setNotice("Zurück auf Anfang. Frische Platte, frischer Entwurf."); }} className={`${BUTTON_CLASS} flex-1 border-fg bg-vinyl`}>Zurücksetzen <RotateCcw size={15} /></button></div></Modal>}

      {fullPreview && <Modal title="Dein Look. Ganz groß." wide onClose={() => setFullPreview("")}><img src={fullPreview} alt={`${template.name}: deine fertige Grafik`} className="mx-auto max-h-[65dvh] w-auto max-w-full border border-fg object-contain" /><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase text-fg-muted">{format.width} × {format.height} px / Ohne Hilfslinien</span><button type="button" onClick={downloadCurrent} className={`${BUTTON_CLASS} border-fg bg-vinyl`}><Download size={16} />PNG herunterladen</button></div></Modal>}
    </div>
  );
}