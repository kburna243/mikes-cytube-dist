"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import "./ContentSchleuder.css";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleAlert, Clock3, Copy, Disc3, ExternalLink, FileImage,
  FileVideo, LoaderCircle, Pencil, Plus, RefreshCw, Share2, SlidersHorizontal, Trash2, Upload, X,
} from "lucide-react";
import type { Campaign, ContentSchleuderProps, Placement, PlatformId, Post, RenderRequest, Slot } from "./types";
import { captionFor, captionForEn, correctName, fullPostText, instagramText } from "./captions";
import { PLATFORMS, STATUS_LABELS, placementName, postWarnings } from "./platforms";
import { addCalendarDays, buildPlan, calendarDifference, dayLabel, longDate, makeId, makePost, reconcileCampaign, shortDate, todayISO, weekday } from "./plan";
import { assetUrl, copyText, downloadBlob, fileName, sharePrepared } from "./share";
import { downloadCalendar } from "./ics";

type LibraryItem = { path: string; name: string; role: string };
type Notice = (message: string) => void;
type PostUpdate = (slotId: string, postId: string, update: (post: Post) => Post) => void;
type Media = { blob: Blob; url: string };
type SaveStatus = "saved" | "saving" | "error";
type MediaCache = {
  available: boolean;
  get: (request: RenderRequest) => Promise<Media>;
  retain: (keys: Set<string>) => void;
  clear: () => void;
};

function createMediaCache(renderer?: (request: RenderRequest) => Promise<Blob>): MediaCache {
  const entries = new Map<string, { alive: boolean; url?: string; promise: Promise<Media> }>();
  const discard = (key: string) => {
    const entry = entries.get(key);
    if (!entry) return;
    entry.alive = false;
    if (entry.url) URL.revokeObjectURL(entry.url);
    entries.delete(key);
  };
  return {
    available: Boolean(renderer),
    get(request) {
      const key = JSON.stringify(request);
      const existing = entries.get(key);
      if (existing) return existing.promise;
      if (!renderer) return Promise.reject(new Error("Kein Renderer verbunden"));
      const entry = { alive: true, promise: Promise.resolve({ blob: new Blob(), url: "" }) } as { alive: boolean; url?: string; promise: Promise<Media> };
      entry.promise = renderer(request).then((blob) => {
        const url = entry.alive ? URL.createObjectURL(blob) : "";
        entry.url = url;
        return { blob, url };
      }).catch((error: unknown) => {
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
      entries.set(key, entry);
      return entry.promise;
    },
    retain(keys) { for (const key of entries.keys()) if (!keys.has(key)) discard(key); },
    clear() { for (const key of entries.keys()) discard(key); },
  };
}

function safeCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    title: correctName(campaign.title), label: campaign.label && correctName(campaign.label),
    message: correctName(campaign.message), messageEn: campaign.messageEn && correctName(campaign.messageEn),
    hashtags: campaign.hashtags.map(correctName), tracks: campaign.tracks?.map(correctName),
    slots: campaign.slots.map((slot) => ({
      ...slot, title: correctName(slot.title), posts: slot.posts.map((post) => ({
        ...post, text: correctName(post.text), textEn: post.textEn && correctName(post.textEn),
        headline: post.headline && correctName(post.headline), hashtags: post.hashtags.map(correctName),
        render: post.render ? { ...post.render, fields: Object.fromEntries(Object.entries(post.render.fields).map(([key, value]) => [key, typeof value === "string" ? correctName(value) : value])) } : undefined,
      })),
    })),
  };
}

function parseTags(value: string): string[] {
  return value.split(/[\s,;]+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => correctName(tag.startsWith("#") ? tag : `#${tag}`));
}

function usePreparedMedia(campaign: Campaign, slot: Slot, post: Post, cache: MediaCache, base: string) {
  const [state, setState] = useState<{ file?: File; preview?: string; loading: boolean; error?: boolean }>({ loading: false });
  const renderKey = post.render ? JSON.stringify(post.render) : "";
  const attachmentUrl = post.attachment?.url;
  const attachmentName = post.attachment?.name;
  const attachmentType = post.attachment?.type;
  useEffect(() => {
    let active = true;
    let timer = 0;
    if (attachmentUrl) {
      setState({ loading: true, preview: assetUrl(base, attachmentUrl) });
      fetch(assetUrl(base, attachmentUrl)).then((response) => {
        if (!response.ok) throw new Error("Datei nicht verfügbar");
        return response.blob();
      }).then((blob) => {
        const extension = attachmentName?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
        if (active) setState({ loading: false, preview: assetUrl(base, attachmentUrl), file: new File([blob], fileName(campaign, slot, post, extension), { type: attachmentType || blob.type }) });
      }).catch(() => { if (active) setState({ loading: false, preview: assetUrl(base, attachmentUrl), error: true }); });
    } else if (post.render && cache.available) {
      setState({ loading: true });
      timer = window.setTimeout(() => {
        cache.get(post.render as RenderRequest).then(({ blob, url }) => {
          if (active) setState({ loading: false, preview: url, file: new File([blob], fileName(campaign, slot, post), { type: "image/png" }) });
        }).catch(() => { if (active) setState({ loading: false, error: true }); });
      }, 180);
    } else setState({ loading: false });
    return () => { active = false; window.clearTimeout(timer); };
    // The JSON key deliberately compares render requests by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderKey, attachmentUrl, attachmentName, attachmentType, campaign.title, slot.day, post.platform, cache, base]);
  return state;
}

function Preview({ post, preview, loading, error, large = false }: { post: Post; preview?: string; loading: boolean; error?: boolean; large?: boolean }) {
  const isVideo = Boolean(post.attachment?.type.startsWith("video/"));
  if (preview && isVideo) return large ? <video className="media-preview" src={preview} controls playsInline /> : <div className="preview-fallback"><FileVideo size={25} /><span>VIDEO</span></div>;
  if (preview && post.attachment && !post.attachment.type.startsWith("image/")) return <div className="preview-fallback"><FileImage size={large ? 35 : 23} /><span>DATEI</span><small>{post.attachment.name}</small></div>;
  if (preview) return <img className="media-preview" src={preview} alt={`Grafik für ${PLATFORMS[post.platform].name}`} />;
  if (post.platform === "spotify") return <div className="preview-fallback preview-task"><Disc3 size={large ? 44 : 25} /><span>AUFGABE</span></div>;
  return <div className="preview-fallback"><FileImage size={large ? 35 : 23} /><span>{loading ? "LÄDT" : error ? "NICHT VERFÜGBAR" : (post.render?.template || "GRAFIK").toUpperCase()}</span>{!loading && !error && post.render && <small>{post.render.format.toUpperCase()} / {post.render.fields.title}</small>}</div>;
}

function SaveIndicator({ status, retry }: { status: SaveStatus; retry: () => void }) {
  const label = status === "saving" ? "Speichert..." : status === "error" ? "Nicht gespeichert, erneut versuchen" : "Gespeichert";
  return <button type="button" className={`save-indicator ${status === "error" ? "save-error" : ""}`} onClick={() => { if (status === "error") retry(); }} aria-label={label} aria-live="polite">{status === "saving" ? <LoaderCircle size={15} className="spin" /> : status === "error" ? <CircleAlert size={15} /> : <CheckCircle2 size={15} />}<span>{label}</span></button>;
}

function Modal({ title, eyebrow, onClose, children, wide = false, saveControl }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode; wide?: boolean; saveControl?: ReactNode }) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="schleuder-dialog-title" className={`modal-panel ${wide ? "modal-wide" : ""}`}>
      <div className="modal-heading">
        <div><p className="eyebrow">{eyebrow}</p><h2 id="schleuder-dialog-title" className="type-condensed">{title}</h2></div>
        <div className="modal-heading-actions">{saveControl}<button type="button" className="icon-button" onClick={onClose} aria-label="Schließen"><X size={21} /></button></div>
      </div>
      {children}
    </section>
  </div>;
}

function shareNotice(result: Awaited<ReturnType<typeof sharePrepared>>, post: Post): string {
  if (!result.copied) return "Kopieren nicht möglich. Bitte den Text im Editor markieren.";
  if (result.outcome === "no-file" && post.platform !== "spotify") return "Text ist kopiert. Es liegt keine Grafik zum Teilen vor.";
  if (post.platform === "instagram") return result.outcome === "downloaded" ? "Text ist kopiert, Grafik heruntergeladen. In Instagram einfach einfügen." : "Text ist kopiert, in Instagram einfach einfügen.";
  if (result.outcome === "downloaded") return "Text kopiert und Datei heruntergeladen.";
  return "Text ist kopiert.";
}

function PostRow({ campaign, slot, post, cache, base, onEdit, onMark, notice }: {
  campaign: Campaign; slot: Slot; post: Post; cache: MediaCache; base: string;
  onEdit: () => void; onMark: () => void; notice: Notice;
}) {
  const media = usePreparedMedia(campaign, slot, post, cache, base);
  const task = post.platform === "spotify";
  const isDone = post.status === "posted";
  const handleShare = async () => {
    const result = await sharePrepared(post, media.file);
    if (result.outcome !== "cancelled") notice(shareNotice(result, post));
  };
  return <article className={`post-row ${isDone ? "post-row-done" : ""}`}>
    <button type="button" className="post-thumbnail" onClick={onEdit} aria-label={`${slot.title} bearbeiten`}>
      <Preview post={post} {...media} />
    </button>
    <div className="post-copy">
      <div className="post-platform"><span className="platform-mark">{PLATFORMS[post.platform].short}</span><span>{PLATFORMS[post.platform].name} <span className="muted-slash">/</span> {placementName(post)}</span></div>
      <button type="button" className="post-title" onClick={onEdit}>{slot.title}<ArrowUpRight size={15} /></button>
      <p className="post-excerpt">{post.text.split("\n")[0]}</p>
      <div className="post-meta font-mono text-fg-muted"><Clock3 size={13} /> {slot.time} UHR <span className="meta-dot">·</span> <span className={isDone ? "done-text" : ""}>{STATUS_LABELS[post.status].toUpperCase()}</span></div>
    </div>
    <div className="post-actions">
      <button type="button" className="button button-dark share-button" onClick={handleShare} disabled={media.loading}>
        {media.loading ? <LoaderCircle size={17} className="spin" /> : task ? <Copy size={17} /> : <Share2 size={17} />} {task ? "Pitch kopieren" : "Teilen"}
      </button>
      <button type="button" className={`button button-check ${isDone ? "is-checked" : ""}`} onClick={onMark} aria-pressed={isDone}>
        <Check size={18} strokeWidth={2.5} /> <span>{task ? (isDone ? "Erledigt" : "Erledigt?") : "Gepostet"}</span>
      </button>
    </div>
  </article>;
}

function PostEditor({ campaign, slot, post, cache, base, library, socials, saveControl, onUpdate, onClose, onDelete, onDuplicate, onOpenWerkstatt, onFile, clean, notice }: {
  campaign: Campaign; slot: Slot; post: Post; cache: MediaCache; base: string; library: LibraryItem[];
  socials?: ContentSchleuderProps["socials"];
  saveControl: ReactNode;
  onUpdate: PostUpdate; onClose: () => void; onDelete: () => void; onDuplicate: () => void;
  onOpenWerkstatt?: (request: RenderRequest) => void; onFile: (file: File) => Promise<string>;
  clean: (text: string) => string; notice: Notice;
}) {
  const media = usePreparedMedia(campaign, slot, post, cache, base);
  const [uploading, setUploading] = useState(false);
  const [hashtagsText, setHashtagsText] = useState(post.hashtags.join(" "));
  const warnings = postWarnings(post, campaign);
  const rule = PLATFORMS[post.platform];
  useEffect(() => setHashtagsText(post.hashtags.join(" ")), [post.platform]);
  const update = (fn: (current: Post) => Post) => onUpdate(slot.id, post.id, fn);
  const updateRender = (fn: (render: RenderRequest) => RenderRequest) => update((current) => current.render ? { ...current, render: fn(current.render) } : current);
  const setField = (field: keyof RenderRequest["fields"], value: string) => updateRender((render) => ({ ...render, fields: { ...render.fields, [field]: clean(value) } }));
  const copy = async () => notice(await copyText(fullPostText(post)) ? "Text und Hashtags sind kopiert." : "Kopieren nicht möglich. Bitte den Text markieren.");
  const share = async () => { const result = await sharePrepared(post, media.file); if (result.outcome !== "cancelled") notice(shareNotice(result, post)); };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onFile(file);
      update((current) => ({ ...current, attachment: { name: clean(file.name), type: file.type, url } }));
      notice("Datei angehängt.");
    } catch { notice("Datei konnte nicht hochgeladen werden."); }
    finally { setUploading(false); event.target.value = ""; }
  };
  return <Modal title="POST BEARBEITEN." eyebrow={`${dayLabel(slot.day)} / ${slot.title}`} onClose={onClose} saveControl={saveControl} wide>
    <div className="editor-layout">
      <div className="editor-visual">
        <div className="editor-preview"><Preview post={post} {...media} large /></div>
        {post.platform !== "spotify" && <>
          <div className="visual-caption"><span>GRAFIKVORSCHAU</span><span>{post.attachment ? "EIGENE DATEI" : post.render?.format.toUpperCase()}</span></div>
          {!cache.available && !post.attachment && <p className="helper-text">Die Grafik entsteht in der Marken-Werkstatt, sobald ein Renderer verbunden ist.</p>}
          {media.error && <p className="warning-line"><CircleAlert size={15} /> Die Datei konnte nicht geladen werden.</p>}
          {post.attachment && <div className="attachment-line"><span>{post.attachment.name}</span><button type="button" className="text-button" onClick={() => update((current) => ({ ...current, attachment: undefined }))}>Entfernen</button></div>}
          {post.attachment?.url.startsWith("blob:") && <p className="helper-text">Ohne Upload ist die Datei nur in diesem Browser-Tab verfügbar.</p>}
          <label className="button button-outline upload-button"><Upload size={16} /> {uploading ? "Wird hochgeladen" : "Eigene Datei anhängen"}<input type="file" onChange={upload} disabled={uploading} /></label>
          {post.render && onOpenWerkstatt && <button type="button" className="button button-outline full-width" onClick={() => onOpenWerkstatt(post.render as RenderRequest)}><ExternalLink size={16} /> In der Werkstatt anpassen</button>}
        </>}
        {post.render && <details className="settings-details" open>
          <summary><SlidersHorizontal size={17} /> Grafik-Parameter <ChevronDown size={16} /></summary>
          <div className="field-grid two-col">
            <label>Vorlage<select value={post.render.template} onChange={(event) => updateRender((render) => ({ ...render, template: event.target.value as RenderRequest["template"] }))}>{["gig", "gem", "release", "mix", "statement", "studio"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Format<select value={post.render.format} onChange={(event) => updateRender((render) => ({ ...render, format: event.target.value as RenderRequest["format"] }))}>{["post", "portrait", "story", "youtube", "event", "flyer"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Farbwelt<select value={post.render.theme} onChange={(event) => updateRender((render) => ({ ...render, theme: event.target.value as RenderRequest["theme"] }))}>{["paper", "night", "orange", "olive"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Bild aus Bibliothek<select value={library.some((item) => item.path === post.render?.image) ? post.render.image : ""} onChange={(event) => updateRender((render) => ({ ...render, image: event.target.value }))}><option value="">Bild wählen</option>{library.map((item) => <option value={item.path} key={item.path}>{item.name}</option>)}</select></label>
          </div>
          <label>Bildpfad<input value={post.render.image || ""} onChange={(event) => updateRender((render) => ({ ...render, image: event.target.value }))} placeholder="/assets/..." /></label>
          <div className="field-grid two-col">
            <label>Titel<input value={post.render.fields.title || ""} onChange={(event) => setField("title", event.target.value)} /></label>
            <label>Statement<input value={post.render.fields.statement || ""} onChange={(event) => setField("statement", event.target.value)} /></label>
            <label>Unterzeile<input value={post.render.fields.subtitle || ""} onChange={(event) => setField("subtitle", event.target.value)} /></label>
            <label>Label<input value={post.render.fields.label || ""} onChange={(event) => setField("label", event.target.value)} /></label>
            <label>Jahr<input value={post.render.fields.year || ""} onChange={(event) => setField("year", event.target.value)} /></label>
            <label>Plattform-Text<input value={post.render.fields.platform || ""} onChange={(event) => setField("platform", event.target.value)} /></label>
            <label>Story-Text<input value={post.render.fields.story || ""} onChange={(event) => setField("story", event.target.value)} /></label>
            <label>Badge<input value={post.render.fields.badge || ""} onChange={(event) => setField("badge", event.target.value)} /></label>
          </div>
        </details>}
      </div>
      <div className="editor-copy">
        <div className="field-grid two-col">
          <label>Plattform<select value={post.platform} onChange={(event) => {
            const platform = event.target.value as PlatformId;
            const placement = PLATFORMS[platform].placements[0];
            const fresh = makePost(campaign, slot.type, slot.day, platform, placement.id, platform === "spotify" ? undefined : "statement", placement.formats[0]);
            update((current) => ({ ...current, platform, placement: placement.id, render: fresh.render, attachment: platform === "spotify" ? undefined : current.attachment, hashtags: fresh.hashtags, text: current.text === captionFor(campaign, slot.type, current.platform, slot.day, current.variant || 0) ? captionFor(campaign, slot.type, platform, slot.day, current.variant || 0) : current.text, textEn: campaign.messageEn?.trim() && current.textEn === captionForEn(campaign, slot.type, current.platform, slot.day, current.variant || 0) ? captionForEn(campaign, slot.type, platform, slot.day, current.variant || 0) : current.textEn }));
          }}>{(Object.keys(PLATFORMS) as PlatformId[]).filter((id) => (campaign.platforms.includes(id) || id === post.platform) && (id !== "mixcloud" || campaign.kind === "mix") && (id !== "spotify" || campaign.kind !== "mix")).map((id) => <option value={id} key={id}>{PLATFORMS[id].name}</option>)}</select></label>
          <label>Platzierung<select value={post.placement} onChange={(event) => { const placement = event.target.value as Placement; const formats = rule.placements.find((item) => item.id === placement)?.formats || []; update((current) => ({ ...current, placement, render: current.render && formats.length && !formats.includes(current.render.format) ? { ...current.render, format: formats[0] } : current.render })); }}>{rule.placements.map((placement) => <option value={placement.id} key={placement.id}>{placement.name}</option>)}</select></label>
        </div>
        {(post.platform === "youtube" || post.platform === "newsletter") && <label>{post.platform === "youtube" ? "Video-Titel" : "Betreff"}<input value={post.headline || ""} onChange={(event) => update((current) => ({ ...current, headline: clean(event.target.value) }))} /><span className="field-count">{(post.headline || "").length} / {post.platform === "youtube" ? "100" : "60 empfohlen"}</span></label>}
        <div className="label-heading"><label htmlFor="post-text-de">Text auf Deutsch</label><button type="button" className="text-button" onClick={() => update((current) => { const variant = ((current.variant || 0) + 1) % 3; return { ...current, variant, text: captionFor(campaign, slot.type, current.platform, slot.day, variant), textEn: campaign.messageEn?.trim() ? captionForEn(campaign, slot.type, current.platform, slot.day, variant) : current.textEn }; })}><RefreshCw size={14} /> Andere Variante</button></div>
        <textarea id="post-text-de" rows={7} value={post.text} onChange={(event) => update((current) => ({ ...current, text: clean(event.target.value) }))} onBlur={() => { if (post.platform === "instagram") update((current) => ({ ...current, text: instagramText(current.text) })); }} />
        <div className="field-count">{fullPostText(post).length} {rule.textLimit ? `/ ${rule.textLimit}` : ""} Zeichen inkl. Hashtags</div>
        <label>Text auf Englisch <span className="optional">(optional)</span><textarea rows={3} value={post.textEn || ""} onChange={(event) => update((current) => ({ ...current, textEn: clean(event.target.value) }))} onBlur={() => { if (post.platform === "instagram" && post.textEn?.trim()) update((current) => ({ ...current, textEn: instagramText(current.textEn || "") })); }} /><span className="field-count">{(post.textEn || "").length} Zeichen</span></label>
        {post.textEn?.trim() && <button type="button" className="text-button" onClick={async () => notice(await copyText(fullPostText({ ...post, text: post.textEn || "" })) ? "Englischer Text und Hashtags sind kopiert." : "Kopieren nicht möglich. Bitte den Text markieren.")}><Copy size={14} /> Englisch kopieren</button>}
        <label>Hashtags<textarea rows={2} value={hashtagsText} onChange={(event) => { const value = clean(event.target.value); setHashtagsText(value); update((current) => ({ ...current, hashtags: parseTags(value) })); }} /><span className="field-count">{post.hashtags.length} Hashtags {rule.hashtagLimit !== undefined ? `/ ${rule.hashtagLimit} maximal` : rule.hashtagRecommended ? `/ ${rule.hashtagRecommended[0]}–${rule.hashtagRecommended[1]} empfohlen` : ""}</span></label>
        <div className="platform-note"><CircleAlert size={17} /><p>{rule.note}{post.platform === "instagram" && post.placement === "story" ? " Setze den Link als Sticker in die Story." : ""}{post.platform === "instagram" && socials?.find((social) => social.id === "instagram")?.handle ? ` Dein Profil: ${socials.find((social) => social.id === "instagram")?.handle}.` : ""}</p></div>
        {warnings.map((warning) => <p className="warning-line" key={warning}><CircleAlert size={15} /> {warning}</p>)}
        <div className="field-grid two-col status-fields">
          <label>Status<select value={post.status} onChange={(event) => update((current) => ({ ...current, status: event.target.value as Post["status"], postedAt: event.target.value === "posted" ? current.postedAt || new Date().toISOString() : undefined }))}>{(Object.keys(STATUS_LABELS) as Post["status"][]).map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select></label>
          <label>Link zum Post <span className="optional">(optional)</span><input type="url" value={post.postUrl || ""} onChange={(event) => update((current) => ({ ...current, postUrl: event.target.value }))} placeholder="https://..." /></label>
        </div>
        <div className="editor-actions"><button type="button" className="button button-outline" onClick={copy}><Copy size={16} /> Text kopieren</button>{post.platform !== "spotify" && <button type="button" className="button button-outline" disabled={!media.file} onClick={() => { if (media.file) downloadBlob(media.file, media.file.name); }}><ArrowDownToLine size={16} /> Herunterladen</button>}<button type="button" className="button button-dark" disabled={media.loading} onClick={share}><Share2 size={16} /> {post.platform === "spotify" ? "Pitch kopieren" : "Teilen"}</button></div>
        <div className="editor-footer"><button type="button" className="text-button" onClick={onDuplicate}><Copy size={15} /> Duplizieren</button><button type="button" className="text-button danger-text" onClick={onDelete}><Trash2 size={15} /> Post löschen</button></div>
      </div>
    </div>
  </Modal>;
}

type WizardState = { mode: "new" | "edit"; step: number; draft: Campaign };
const WIZARD_STEPS = ["Veröffentlichung", "Links", "Botschaft", "Plattformen"];
const LINK_FIELDS: { id: keyof Campaign["links"]; name: string; hint?: string }[] = [
  { id: "presave", name: "Pre-Save", hint: "Schaltet den Pre-Save-Tag frei." },
  { id: "smartlink", name: "Smartlink" }, { id: "spotify", name: "Spotify" },
  { id: "applemusic", name: "Apple Music" }, { id: "youtube", name: "YouTube" },
  { id: "bandcamp", name: "Bandcamp" }, { id: "mixcloud", name: "Mixcloud" },
];

function CampaignWizard({ wizard, setWizard, change, finish, onClose, onDelete, library, base, onFile, clean, notice, saveControl }: {
  wizard: WizardState; setWizard: (wizard: WizardState) => void; change: (draft: Campaign) => void;
  finish: () => void; onClose: () => void; onDelete?: () => Promise<void>; library: LibraryItem[]; base: string;
  onFile: (file: File) => Promise<string>; clean: (text: string) => string; notice: Notice; saveControl?: ReactNode;
}) {
  const { draft, step } = wizard;
  const [tags, setTags] = useState(draft.hashtags.join(" "));
  const [tracks, setTracks] = useState((draft.tracks || []).join("\n"));
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const patch = (fields: Partial<Campaign>) => change({ ...draft, ...fields });
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { patch({ cover: await onFile(file) }); notice("Cover ausgewählt."); }
    catch { notice("Cover konnte nicht hochgeladen werden."); }
    finally { setUploading(false); event.target.value = ""; }
  };
  return <Modal title={wizard.mode === "new" ? "NEUE KAMPAGNE." : "KAMPAGNE BEARBEITEN."} eyebrow="IN VIER SCHRITTEN ZUM PLAN" onClose={onClose} saveControl={saveControl} wide>
    <div className="wizard-steps">{WIZARD_STEPS.map((name, index) => <button type="button" className={step === index ? "wizard-step active" : "wizard-step"} key={name} aria-label={`Schritt ${index + 1}: ${name}`} aria-current={step === index ? "step" : undefined} onClick={() => setWizard({ ...wizard, step: index })}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong></button>)}</div>
    <div className="wizard-content">
      {step === 0 && <>
        <div className="wizard-intro"><p className="eyebrow">SEITE A / DER RELEASE</p><h3 className="type-condensed">WAS KOMMT RAUS?</h3><p>Die Basis für deinen Fahrplan. Du kannst alles später ändern.</p></div>
        <fieldset className="kind-selector"><legend>Art der Veröffentlichung</legend>{(["single", "ep", "album", "mix"] as Campaign["kind"][]).map((kind) => <label key={kind}><input type="radio" name="release-kind" value={kind} checked={draft.kind === kind} onChange={() => {
          const platforms = kind === "mix" ? [...new Set([...draft.platforms.filter((item) => item !== "spotify"), "mixcloud" as PlatformId])] : draft.kind === "mix" ? [...new Set([...draft.platforms.filter((item) => item !== "mixcloud"), "spotify" as PlatformId])] : draft.platforms;
          patch({ kind, platforms });
        }} /><span>{kind.toUpperCase()}</span></label>)}</fieldset>
        <div className="field-grid two-col">
          <label>Titel <span className="required">*</span><input autoFocus value={draft.title} onChange={(event) => patch({ title: clean(event.target.value) })} placeholder="Name des Releases" /></label>
          <label>Release-Datum <span className="required">*</span><input type="date" value={draft.releaseDate} onChange={(event) => patch({ releaseDate: event.target.value })} /></label>
          <label>Label <span className="optional">(optional)</span><input value={draft.label || ""} onChange={(event) => patch({ label: clean(event.target.value) })} placeholder="z. B. NoizyNeighborProductions" /></label>
          <label>Cover aus der Bibliothek<select value={library.some((item) => item.path === draft.cover) ? draft.cover : ""} onChange={(event) => patch({ cover: event.target.value })}><option value="">Cover auswählen</option>{library.map((item) => <option key={item.path} value={item.path}>{item.name}</option>)}</select></label>
        </div>
        <div className="cover-picker">{draft.cover ? <img src={assetUrl(base, draft.cover)} alt="Ausgewähltes Cover" /> : <div className="empty-cover"><FileImage size={25} /></div>}<div><strong>{draft.cover ? "Cover ist ausgewählt" : "Noch kein Cover"}</strong><p>Aus der Bibliothek wählen oder eigene Datei hochladen.</p><label className="text-button upload-link"><Upload size={15} /> {uploading ? "Wird hochgeladen" : "Cover hochladen"}<input type="file" accept="image/*" onChange={upload} disabled={uploading} /></label></div></div>
        {draft.cover.startsWith("blob:") && <p className="helper-text">Ohne Upload ist das Cover nur in diesem Browser-Tab verfügbar.</p>}
        <label>Trackliste <span className="optional">(optional, ein Track pro Zeile)</span><textarea rows={3} value={tracks} onChange={(event) => { const value = clean(event.target.value); setTracks(value); patch({ tracks: value.split("\n").map((track) => track.trim()).filter(Boolean) }); }} /></label>
        {onDelete && <button type="button" className="text-button danger-text" disabled={deleting} onClick={async () => { setDeleting(true); try { await onDelete(); } finally { setDeleting(false); } }}><Trash2 size={15} /> Kampagne löschen</button>}
      </>}
      {step === 1 && <>
        <div className="wizard-intro"><p className="eyebrow">SEITE B / DIE LINKS</p><h3 className="type-condensed">WO FINDET MAN’S?</h3><p>Nur ausgefüllte Links landen in deinen Texten.</p></div>
        <div className="field-grid two-col">{LINK_FIELDS.map(({ id, name, hint }) => <label key={id}>{name}<input type="url" value={draft.links[id] || ""} onChange={(event) => patch({ links: { ...draft.links, [id]: event.target.value } })} placeholder="https://..." />{hint && <span className="field-hint">{hint}</span>}</label>)}</div>
      </>}
      {step === 2 && <>
        <div className="wizard-intro"><p className="eyebrow">SEITE C / DEINE WORTE</p><h3 className="type-condensed">WAS IST DIE STORY?</h3><p>Ein bis zwei ehrliche Sätze reichen. Der Rest kommt aus der Kiste.</p></div>
        <label>Kernbotschaft auf Deutsch <span className="required">*</span><textarea rows={5} value={draft.message} onChange={(event) => patch({ message: clean(event.target.value) })} placeholder="Was steckt hinter dem Release?" /></label>
        <label>Kernbotschaft auf Englisch <span className="optional">(optional)</span><textarea rows={4} value={draft.messageEn || ""} onChange={(event) => patch({ messageEn: clean(event.target.value) })} /></label>
        <label>Hashtag-Pool<textarea rows={3} value={tags} onChange={(event) => { const value = clean(event.target.value); setTags(value); patch({ hashtags: parseTags(value) }); }} /><span className="field-hint">Mit Leerzeichen trennen. Der Plan wählt passende Mengen pro Plattform.</span></label>
      </>}
      {step === 3 && <>
        <div className="wizard-intro"><p className="eyebrow">SEITE D / DIE KANÄLE</p><h3 className="type-condensed">WO GEHT’S HIN?</h3><p>Dein Plan enthält nur die Plattformen, die du einschaltest.</p></div>
        <div className="platform-list">{(Object.keys(PLATFORMS) as PlatformId[]).map((id) => {
          const disabled = (id === "mixcloud" && draft.kind !== "mix") || (id === "spotify" && draft.kind === "mix");
          return <label className={disabled ? "platform-option is-disabled" : "platform-option"} key={id}><span className="platform-mark">{PLATFORMS[id].short}</span><span><strong>{PLATFORMS[id].name}</strong><small>{id === "spotify" ? "Pitch-Aufgabe, kein Post" : id === "mixcloud" ? "Nur für Mixe" : id === "tiktok" ? "Optional" : "Im Fahrplan"}</small></span><input type="checkbox" checked={draft.platforms.includes(id) && !disabled} disabled={disabled} onChange={(event) => patch({ platforms: event.target.checked ? [...draft.platforms, id] : draft.platforms.filter((platform) => platform !== id) })} /></label>;
        })}</div>
      </>}
    </div>
    <div className="wizard-footer">
      <span className="wizard-counter">SCHRITT {step + 1} / 4</span>
      <div>{step > 0 && <button type="button" className="button button-outline" onClick={() => setWizard({ ...wizard, step: step - 1 })}><ArrowLeft size={16} /> Zurück</button>}{step < 3 ? <button type="button" className="button button-dark" onClick={() => setWizard({ ...wizard, step: step + 1 })}>Weiter <ArrowRight size={16} /></button> : <button type="button" className="button button-orange" onClick={finish}>{wizard.mode === "new" ? "Fahrplan erstellen" : "Fertig"} <ArrowRight size={16} /></button>}</div>
    </div>
  </Modal>;
}

function SlotForm({ campaign, initial, onSave, onClose, clean, saveControl }: { campaign: Campaign; initial?: Slot; onSave: (slot: Slot) => void; onClose: () => void; clean: (text: string) => string; saveControl: ReactNode }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial ? addCalendarDays(campaign.releaseDate, initial.day) : todayISO());
  const [time, setTime] = useState(initial?.time || "18:00");
  const [platform, setPlatform] = useState<PlatformId>(campaign.platforms.find((id) => id !== "spotify") || campaign.platforms[0] || "instagram");
  const [placement, setPlacement] = useState<Placement>(PLATFORMS[platform].placements[0].id);
  const submit = () => {
    if (!title.trim() || !date || !time) return;
    const day = calendarDifference(campaign.releaseDate, date);
    if (initial) onSave({ ...initial, title: clean(title.trim()), day, time });
    else {
      const rule = PLATFORMS[platform].placements.find((item) => item.id === placement) || PLATFORMS[platform].placements[0];
      const post = makePost(campaign, "custom", day, platform, placement, platform === "spotify" ? undefined : "statement", rule.formats[0]);
      onSave({ id: makeId(), day, time, title: clean(title.trim()), type: "custom", posts: [post] });
    }
  };
  return <Modal title={initial ? "EINTRAG VERSCHIEBEN." : "NEUER EINTRAG."} eyebrow="FAHRPLAN / BEARBEITEN" onClose={onClose} saveControl={saveControl}>
    <div className="slot-form">
      <label>Titel<input autoFocus value={title} onChange={(event) => setTitle(clean(event.target.value))} placeholder="Was steht an?" /></label>
      <div className="field-grid two-col"><label>Tag<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Uhrzeit<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
      {!initial && <div className="field-grid two-col"><label>Plattform<select value={platform} onChange={(event) => { const id = event.target.value as PlatformId; setPlatform(id); setPlacement(PLATFORMS[id].placements[0].id); }}>{campaign.platforms.map((id) => <option value={id} key={id}>{PLATFORMS[id].name}</option>)}</select></label><label>Platzierung<select value={placement} onChange={(event) => setPlacement(event.target.value as Placement)}>{PLATFORMS[platform].placements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>}
      <p className="helper-text">{date ? `${dayLabel(calendarDifference(campaign.releaseDate, date))} relativ zum Release.` : "Wähle ein Datum."}</p>
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Abbrechen</button><button type="button" className="button button-orange" disabled={!title.trim() || !date || !time} onClick={submit}>Eintrag speichern <ArrowRight size={16} /></button></div>
    </div>
  </Modal>;
}

function Timeline({ campaign, todayDay, cache, base, notice, onEditPost, onMark, onEditSlot, onDuplicateSlot, onDeleteSlot }: {
  campaign: Campaign; todayDay: number; cache: MediaCache; base: string; notice: Notice;
  onEditPost: (slotId: string, postId: string) => void; onMark: (slotId: string, postId: string) => void;
  onEditSlot: (slot: Slot) => void; onDuplicateSlot: (slot: Slot) => void; onDeleteSlot: (slot: Slot) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>(campaign.slots.filter((slot) => slot.day === todayDay).map((slot) => slot.id));
  const sorted = [...campaign.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  return <div className="timeline">
    <div className="tracklist-head"><span>TAG / DATUM</span><span>EINTRAG / PLATTFORMEN</span><span>BEARBEITEN</span></div>
    {sorted.map((slot, index) => {
      const open = expanded.includes(slot.id);
      const past = slot.day < todayDay;
      return <section key={slot.id} className={`timeline-slot ${past ? "timeline-past" : ""} ${slot.day === todayDay ? "timeline-today" : ""}`}>
        <div className="timeline-row">
          <div className="timeline-date"><strong>{dayLabel(slot.day)}</strong><span>{shortDate(addCalendarDays(campaign.releaseDate, slot.day))}</span>{slot.day === todayDay && <em>HEUTE</em>}</div>
          <button type="button" className="timeline-title" aria-expanded={open} onClick={() => setExpanded(open ? expanded.filter((id) => id !== slot.id) : [...expanded, slot.id])}>
            <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
            <span><strong>{slot.title}</strong><small>{slot.time} UHR <span>·</span> {slot.posts.map((post) => `${PLATFORMS[post.platform].name} ${placementName(post)}`).join(" / ")}</small></span>
          </button>
          <div className="timeline-tools">
            <button type="button" className="icon-button" onClick={() => onEditSlot(slot)} aria-label={`${slot.title} verschieben`} title="Verschieben"><Pencil size={16} /></button>
            <button type="button" className="icon-button" onClick={() => onDuplicateSlot(slot)} aria-label={`${slot.title} duplizieren`} title="Duplizieren"><Copy size={16} /></button>
            <button type="button" className="icon-button" onClick={() => onDeleteSlot(slot)} aria-label={`${slot.title} löschen`} title="Löschen"><Trash2 size={16} /></button>
            <button type="button" className="icon-button timeline-expand" onClick={() => setExpanded(open ? expanded.filter((id) => id !== slot.id) : [...expanded, slot.id])} aria-label={open ? "Eintrag einklappen" : "Eintrag öffnen"} aria-expanded={open}>{open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</button>
          </div>
        </div>
        {open && <div className="timeline-posts">{slot.posts.map((post) => <PostRow key={post.id} campaign={campaign} slot={slot} post={post} cache={cache} base={base} notice={notice} onEdit={() => onEditPost(slot.id, post.id)} onMark={() => onMark(slot.id, post.id)} />)}</div>}
      </section>;
    })}
    {!sorted.length && <p className="empty-message">Noch keine Einträge. Leg deinen ersten Post an.</p>}
  </div>;
}

function newCampaign(): Campaign {
  const now = new Date().toISOString();
  return {
    id: makeId(), kind: "single", title: "", releaseDate: addCalendarDays(todayISO(), 21), label: "", cover: "",
    message: "", links: {}, hashtags: ["#djnoizyneighbor", "#berlin", "#rarefunk", "#boombap", "#beats", "#vinyl", "#cratedigging", "#mpc"],
    platforms: ["instagram", "facebook", "youtube", "newsletter", "spotify"], slots: [], createdAt: now, updatedAt: now,
  };
}

export default function ContentSchleuder({ assetBase, store, renderImage, onOpenWerkstatt, uploadFile, library: suppliedLibrary, socials, fonts }: ContentSchleuderProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const campaignsRef = useRef<Campaign[]>([]);
  const [activeId, setActiveId] = useState("");
  const [view, setView] = useState<"today" | "plan">("today");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [noticeText, setNoticeText] = useState("");
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [editor, setEditor] = useState<{ slotId: string; postId: string } | null>(null);
  const [slotForm, setSlotForm] = useState<{ slot?: Slot } | null>(null);
  const [today, setToday] = useState(todayISO);
  const [library, setLibrary] = useState<LibraryItem[]>(suppliedLibrary || []);
  const pending = useRef(new Map<string, Campaign>());
  const versions = useRef(new Map<string, number>());
  const timers = useRef(new Map<string, number>());
  const queues = useRef(new Map<string, Promise<void>>());
  const deletingIds = useRef(new Set<string>());
  const ownedBlobUrls = useRef(new Set<string>());
  const cache = useMemo(() => createMediaCache(renderImage), [renderImage]);
  const campaign = campaigns.find((item) => item.id === activeId);

  const notice = useCallback((message: string) => setNoticeText(message), []);
  const clean = useCallback((text: string) => {
    const result = correctName(text);
    if (result !== text) notice("Schreibweise korrigiert: Neighbor ohne u.");
    return result;
  }, [notice]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    store.list().then((items) => {
      if (!mounted) return;
      const sanitized = items.map(safeCampaign);
      campaignsRef.current = sanitized;
      setCampaigns(sanitized);
      const running = sanitized.find((item) => {
        const day = calendarDifference(item.releaseDate, todayISO());
        return item.slots.length > 0 && day >= Math.min(...item.slots.map((slot) => slot.day)) && day <= Math.max(...item.slots.map((slot) => slot.day));
      });
      setActiveId((running || sanitized[0])?.id || "");
      setView(running ? "today" : "plan");
      setLoadError(false);
    }).catch(() => { if (mounted) setLoadError(true); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [store]);

  useEffect(() => {
    if (suppliedLibrary) { setLibrary(suppliedLibrary); return; }
    const controller = new AbortController();
    fetch(assetUrl(assetBase, "/manifest.json"), { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error("Bibliothek nicht verfügbar");
      return response.json() as Promise<{ files: { path: string; role: string; name?: string }[] }>;
    }).then((manifest) => setLibrary(manifest.files.filter((item) => ["photo", "release-cover", "gem-cover"].includes(item.role)).map((item) => ({ ...item, name: item.name || item.path.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || item.path })))).catch(() => {});
    return () => controller.abort();
  }, [assetBase, suppliedLibrary]);

  useEffect(() => { const timer = window.setInterval(() => setToday(todayISO()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (!noticeText) return; const timer = window.setTimeout(() => setNoticeText(""), 4200); return () => window.clearTimeout(timer); }, [noticeText]);
  useEffect(() => () => cache.clear(), [cache]);
  useEffect(() => {
    const keys = new Set(campaigns.flatMap((item) => item.slots.flatMap((slot) => slot.posts.flatMap((post) => post.render ? [JSON.stringify(post.render)] : []))));
    cache.retain(keys);
  }, [campaigns, cache]);
  useEffect(() => {
    const used = new Set(campaigns.flatMap((item) => [item.cover, ...item.slots.flatMap((slot) => slot.posts.flatMap((post) => [post.attachment?.url || "", post.render?.image || ""]))]));
    if (wizard?.draft.cover) used.add(wizard.draft.cover);
    for (const url of ownedBlobUrls.current) if (!used.has(url)) { URL.revokeObjectURL(url); ownedBlobUrls.current.delete(url); }
  }, [campaigns, wizard]);
  useEffect(() => () => { for (const url of ownedBlobUrls.current) URL.revokeObjectURL(url); }, []);

  const flush = useCallback((id: string) => {
    const snapshot = pending.current.get(id);
    if (!snapshot) return;
    const revision = versions.current.get(id);
    const previous = queues.current.get(id) || Promise.resolve();
    const write = previous.catch(() => {}).then(async () => { await store.save(snapshot); }).then(() => {
      if (versions.current.get(id) === revision) {
        pending.current.delete(id);
        setSaveStatus(pending.current.size ? "saving" : "saved");
      }
    }).catch(() => { if (versions.current.get(id) === revision) setSaveStatus("error"); });
    queues.current.set(id, write);
  }, [store]);

  const persist = useCallback((next: Campaign) => {
    if (deletingIds.current.has(next.id)) return;
    const normalized = { ...safeCampaign(next), updatedAt: new Date().toISOString() };
    const exists = campaignsRef.current.some((item) => item.id === normalized.id);
    const items = exists ? campaignsRef.current.map((item) => item.id === normalized.id ? normalized : item) : [normalized, ...campaignsRef.current];
    campaignsRef.current = items;
    setCampaigns(items);
    pending.current.set(normalized.id, normalized);
    versions.current.set(normalized.id, (versions.current.get(normalized.id) || 0) + 1);
    setSaveStatus("saving");
    const previous = timers.current.get(normalized.id);
    if (previous) window.clearTimeout(previous);
    timers.current.set(normalized.id, window.setTimeout(() => { timers.current.delete(normalized.id); flush(normalized.id); }, 650));
  }, [flush]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer);
    for (const item of pending.current.values()) {
      const previous = queues.current.get(item.id) || Promise.resolve();
      void previous.then(() => store.save(item)).catch(() => {});
    }
  }, [store]);

  const onFile = useCallback(async (file: File) => {
    if (uploadFile) return uploadFile(file);
    const url = URL.createObjectURL(file);
    ownedBlobUrls.current.add(url);
    return url;
  }, [uploadFile]);

  const modifyCampaign = (update: (current: Campaign) => Campaign) => {
    const current = campaignsRef.current.find((item) => item.id === activeId);
    if (current) persist(update(current));
  };
  const updatePost: PostUpdate = (slotId, postId, update) => modifyCampaign((current) => ({ ...current, slots: current.slots.map((slot) => slot.id === slotId ? { ...slot, posts: slot.posts.map((post) => post.id === postId ? update(post) : post) } : slot) }));
  const markPost = (slotId: string, postId: string) => updatePost(slotId, postId, (post) => post.status === "posted" ? { ...post, status: "ready", postedAt: undefined } : { ...post, status: "posted", postedAt: new Date().toISOString() });

  const changeWizard = (draft: Campaign) => {
    if (!wizard) return;
    if (wizard.mode === "edit" && draft.releaseDate) {
      const updated = reconcileCampaign(wizard.draft, draft);
      persist(updated);
      setWizard({ ...wizard, draft: updated });
    } else setWizard({ ...wizard, draft });
  };
  const finishWizard = () => {
    if (!wizard) return;
    if (!wizard.draft.title.trim() || !wizard.draft.releaseDate || !wizard.draft.cover) { setWizard({ ...wizard, step: 0 }); notice("Bitte Titel, Release-Datum und Cover ergänzen."); return; }
    if (!wizard.draft.message.trim()) { setWizard({ ...wizard, step: 2 }); notice("Bitte eine kurze Kernbotschaft ergänzen."); return; }
    if (!wizard.draft.platforms.length) { setWizard({ ...wizard, step: 3 }); notice("Wähle mindestens eine Plattform."); return; }
    if (wizard.mode === "new") {
      const created = { ...wizard.draft, slots: buildPlan(wizard.draft) };
      persist(created);
      setActiveId(created.id);
      const relative = calendarDifference(created.releaseDate, today);
      setView(created.slots.some((slot) => slot.day === relative) ? "today" : "plan");
      notice("Dein Fahrplan steht.");
    } else notice("Kampagne aktualisiert.");
    setWizard(null);
  };

  const duplicateSlot = (slot: Slot) => {
    const copy = { ...slot, id: makeId(), title: `${slot.title} (Kopie)`, posts: slot.posts.map((post) => ({ ...post, id: makeId(), status: "draft" as const, postedAt: undefined, postUrl: undefined })) };
    modifyCampaign((current) => ({ ...current, slots: [...current.slots, copy] }));
    notice("Eintrag dupliziert.");
  };
  const deleteSlot = (slot: Slot) => {
    if (!window.confirm(`„${slot.title}“ und alle Posts darin löschen?`)) return;
    modifyCampaign((current) => ({ ...current, slots: current.slots.filter((item) => item.id !== slot.id) }));
    notice("Eintrag gelöscht.");
  };
  const deleteCampaign = async (target: Campaign) => {
    if (!window.confirm(`Kampagne „${target.title}“ und ihren Fahrplan löschen?`)) return;
    deletingIds.current.add(target.id);
    const timer = timers.current.get(target.id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(target.id);
    try {
      await queues.current.get(target.id);
      await store.remove(target.id);
      pending.current.delete(target.id);
      versions.current.delete(target.id);
      queues.current.delete(target.id);
      const remaining = campaignsRef.current.filter((item) => item.id !== target.id);
      campaignsRef.current = remaining;
      setCampaigns(remaining);
      setActiveId(remaining[0]?.id || "");
      setView("today");
      setSaveStatus(pending.current.size ? "saving" : "saved");
      setWizard(null);
      notice("Kampagne gelöscht.");
    } catch {
      if (pending.current.has(target.id)) flush(target.id);
      notice("Kampagne konnte nicht gelöscht werden. Bitte erneut versuchen.");
    } finally { deletingIds.current.delete(target.id); }
  };
  const editSlot = editor && campaign?.slots.find((slot) => slot.id === editor.slotId);
  const editPost = editSlot && editSlot.posts.find((post) => post.id === editor?.postId);
  const todayDay = campaign ? calendarDifference(campaign.releaseDate, today) : 0;
  const todaySlots = campaign?.slots.filter((slot) => slot.day === todayDay).sort((a, b) => a.time.localeCompare(b.time)) || [];
  const allPosts = campaign?.slots.flatMap((slot) => slot.posts.filter((post) => post.platform !== "spotify")) || [];
  const posted = allPosts.filter((post) => post.status === "posted").length;
  const nextSlot = campaign && [...campaign.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)).find((slot) => slot.posts.some((post) => post.status !== "posted" && post.status !== "skipped"));
  const nextPost = nextSlot?.posts.find((post) => post.status !== "posted" && post.status !== "skipped");
  const todaysCount = todaySlots.reduce((count, slot) => count + slot.posts.length, 0);
  const style = { "--schleuder-display": fonts?.display || "Archivo", "--schleuder-mono": fonts?.mono || "Space Mono" } as CSSProperties;
  const saveControl = <SaveIndicator status={saveStatus} retry={() => { setSaveStatus("saving"); for (const id of pending.current.keys()) flush(id); }} />;

  return <div className="noizy-schleuder bg-page text-fg" style={style}>
    <header className="topbar bg-paper border-fg">
      <div className="topbar-inner">
        <div className="brand-lockup"><img src={assetUrl(assetBase, "/assets/brandkit/logo-badge.png")} alt="DJ Noizy Neighbor" /><div><strong>DJ NOIZY NEIGHBOR</strong><span>CONTENT-SCHLEUDER / BERLIN</span></div></div>
        <div className="topbar-actions">
          {saveControl}
          <button type="button" className="button button-dark new-campaign" aria-label="Neue Kampagne" onClick={() => setWizard({ mode: "new", step: 0, draft: newCampaign() })}><Plus size={18} /> <span>Neue Kampagne</span></button>
        </div>
      </div>
    </header>
    <main className="page-shell">
      <div className="page-intro">
      <div><p className="eyebrow intro-eyebrow"><span className="eyebrow-square bg-vinyl" /> DEIN RELEASE. DEIN PLAN.</p><h1 className="type-condensed">CONTENT-<span className="text-vinyl-deep">SCHLEUDER.</span></h1><p className="intro-subline text-fg-muted">Dein Sound. Dein Plan. Jeden Tag ein Schritt weiter.</p></div>
        <div className="intro-side"><Disc3 size={32} strokeWidth={1.7} /><span>VON DER PLATTE<br />IN DEN FEED.</span></div>
      </div>
      {loading ? <div className="empty-state"><LoaderCircle className="spin" size={25} /> Kampagnen werden geladen.</div> : loadError ? <div className="empty-state"><CircleAlert size={24} /> Kampagnen konnten nicht geladen werden. Bitte Seite neu laden.</div> : !campaign ? <div className="empty-state"><div><p className="eyebrow">DIE KISTE IST NOCH LEER</p><h2 className="type-condensed">ZEIT FÜR DEINEN RELEASE.</h2><p>Leg eine Kampagne an und wir bauen dir den Fahrplan.</p><button type="button" className="button button-orange" onClick={() => setWizard({ mode: "new", step: 0, draft: newCampaign() })}><Plus size={18} /> Kampagne anlegen</button></div></div> : <>
        <section className="release-strip bg-surface" aria-label="Aktive Kampagne">
          <div className="release-cover">{campaign.cover ? <img src={assetUrl(assetBase, campaign.cover)} alt={`Cover von ${campaign.title}`} /> : <FileImage size={28} />}</div>
          <div className="release-info"><div className="release-kicker font-mono"><span>AKTIVE KAMPAGNE</span><span className="release-kind sticker text-ink">{campaign.kind.toUpperCase()}</span></div><h2 className="type-condensed">{campaign.title}</h2><p><CalendarDays size={14} /> RELEASE AM {shortDate(campaign.releaseDate)}{campaign.releaseDate.slice(0, 4)} <span>·</span> {campaign.label || "DJ NOIZY NEIGHBOR"}</p></div>
          <div className="release-actions">{campaigns.length > 1 && <label className="campaign-select"><span className="sr-only">Kampagne wählen</span><select value={activeId} onChange={(event) => { setActiveId(event.target.value); setView("today"); }} aria-label="Kampagne wählen">{campaigns.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}<button type="button" className="button button-outline edit-campaign" onClick={() => setWizard({ mode: "edit", step: 0, draft: campaign })}><Pencil size={16} /> Kampagne bearbeiten</button></div>
        </section>
        <nav className="view-navigation" aria-label="Kampagnenansicht"><div className="view-tabs"><button type="button" className={view === "today" ? "active" : ""} aria-current={view === "today" ? "page" : undefined} onClick={() => setView("today")}>Heute <span>{String(todaysCount).padStart(2, "0")}</span></button><button type="button" className={view === "plan" ? "active" : ""} aria-current={view === "plan" ? "page" : undefined} onClick={() => setView("plan")}>Fahrplan <span>{String(campaign.slots.length).padStart(2, "0")}</span></button></div><button type="button" className="calendar-link" aria-label="In Kalender übernehmen" onClick={() => { downloadCalendar(campaign); notice("Kalenderdatei heruntergeladen."); }}><CalendarDays size={17} /> <span className="calendar-long">In Kalender übernehmen</span><span className="calendar-short">Kalender</span></button></nav>
        <div className="workspace">
          <section className="workspace-main">
            <div className="section-heading"><div><p className="eyebrow">{view === "today" ? `DEIN TAGESPROGRAMM / ${dayLabel(todayDay)}` : "SEITE A BIS B / DER GANZE PLAN"}</p><h2 className="type-condensed">{view === "today" ? "HEUTE STEHT AN" : "DER FAHRPLAN"}<span>.</span></h2><p>{view === "today" ? `${weekday(today)}, ${longDate(today)}` : "Dein Release, Tag für Tag. Alles bleibt editierbar."}</p></div><button type="button" className="button button-outline add-entry" aria-label="Eintrag anlegen" onClick={() => setSlotForm({})}><Plus size={17} /> <span>Eintrag</span></button></div>
            {view === "today" ? <div className="today-posts">{todaySlots.flatMap((slot) => slot.posts.map((post) => <PostRow key={post.id} campaign={campaign} slot={slot} post={post} cache={cache} base={assetBase} notice={notice} onEdit={() => setEditor({ slotId: slot.id, postId: post.id })} onMark={() => markPost(slot.id, post.id)} />))}{!todaysCount && <div className="nothing-today"><Disc3 size={35} /><div><strong>Heute ist die Nadel oben.</strong><p>Für heute ist nichts geplant. Im Fahrplan geht’s weiter.</p><button type="button" className="text-button" onClick={() => setView("plan")}>Zum Fahrplan <ArrowRight size={15} /></button></div></div>}</div> : <Timeline campaign={campaign} todayDay={todayDay} cache={cache} base={assetBase} notice={notice} onEditPost={(slotId, postId) => setEditor({ slotId, postId })} onMark={markPost} onEditSlot={(slot) => setSlotForm({ slot })} onDuplicateSlot={duplicateSlot} onDeleteSlot={deleteSlot} />}
          </section>
          <aside className="workspace-side"><div className="side-section"><p className="eyebrow">DEIN FORTSCHRITT <span>01 / 02</span></p><h3 className="type-condensed">LÄUFT BEI DIR.</h3><p className="progress-copy"><strong>{posted}</strong> von {allPosts.length} Posts raus</p><div className="progress-track" role="progressbar" aria-label="Veröffentlichte Posts" aria-valuemin={0} aria-valuemax={allPosts.length} aria-valuenow={posted}><span style={{ width: `${allPosts.length ? posted / allPosts.length * 100 : 0}%` }} /></div><p className="side-helper">Jeder Post bringt deinen Sound ein Stück weiter.</p></div>
            <div className="side-section next-section"><p className="eyebrow">NÄCHSTER EINTRAG <span>02 / 02</span></p>{nextSlot && nextPost ? <><div className="next-date">{nextSlot.day < todayDay ? "ÜBERFÄLLIG" : nextSlot.day === todayDay ? "HEUTE" : shortDate(addCalendarDays(campaign.releaseDate, nextSlot.day))} <span>/ {nextSlot.time} UHR</span></div><h3>{nextSlot.title}</h3><p>{PLATFORMS[nextPost.platform].name} / {placementName(nextPost)}</p><button type="button" className="side-link" onClick={() => setEditor({ slotId: nextSlot.id, postId: nextPost.id })}>Eintrag öffnen <ArrowUpRight size={16} /></button></> : <p>Alles raus. Zeit für die nächste Platte.</p>}</div>
            <div className="side-signoff"><img src={assetUrl(assetBase, "/assets/ui/illu-vinyl-record.webp")} alt="" /><div><strong>GUTER SOUND<br />GEHÖRT GEHÖRT.</strong><span>NOIZY NEIGHBOR / BERLIN</span></div></div>
          </aside>
        </div>
      </>}
      <footer className="page-footer"><span>DJ NOIZY NEIGHBOR / CONTENT-SCHLEUDER</span><span>MADE FOR THE MUSIC. AUS BERLIN.</span></footer>
    </main>
    {wizard && <CampaignWizard key={wizard.draft.id} wizard={wizard} setWizard={setWizard} change={changeWizard} finish={finishWizard} onClose={() => setWizard(null)} onDelete={wizard.mode === "edit" ? () => deleteCampaign(wizard.draft) : undefined} library={library} base={assetBase} onFile={onFile} clean={clean} notice={notice} saveControl={wizard.mode === "edit" ? saveControl : undefined} />}
    {campaign && slotForm && <SlotForm campaign={campaign} initial={slotForm.slot} clean={clean} saveControl={saveControl} onClose={() => setSlotForm(null)} onSave={(slot) => { modifyCampaign((current) => ({ ...current, slots: slotForm.slot ? current.slots.map((item) => item.id === slot.id ? slot : item) : [...current.slots, slot] })); setSlotForm(null); notice("Eintrag gespeichert."); }} />}
    {campaign && editSlot && editPost && <PostEditor key={editPost.id} campaign={campaign} slot={editSlot} post={editPost} cache={cache} base={assetBase} library={library} socials={socials} saveControl={saveControl} onUpdate={updatePost} onClose={() => setEditor(null)} onOpenWerkstatt={onOpenWerkstatt} onFile={onFile} clean={clean} notice={notice} onDuplicate={() => { const copy = { ...editPost, id: makeId(), status: "draft" as const, postedAt: undefined, postUrl: undefined }; modifyCampaign((current) => ({ ...current, slots: current.slots.map((slot) => slot.id === editSlot.id ? { ...slot, posts: [...slot.posts, copy] } : slot) })); setEditor({ slotId: editSlot.id, postId: copy.id }); notice("Post dupliziert."); }} onDelete={() => { if (!window.confirm("Diesen Post löschen?")) return; modifyCampaign((current) => ({ ...current, slots: current.slots.map((slot) => slot.id === editSlot.id ? { ...slot, posts: slot.posts.filter((post) => post.id !== editPost.id) } : slot).filter((slot) => slot.posts.length) })); setEditor(null); notice("Post gelöscht."); }} />}
    {noticeText && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{noticeText}</span><button type="button" onClick={() => setNoticeText("")} aria-label="Hinweis schließen"><X size={16} /></button></div>}
  </div>;
}