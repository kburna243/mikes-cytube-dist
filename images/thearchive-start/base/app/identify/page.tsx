"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Button } from "@/components/ui/Button";
import GuidedCapture, { GUIDED_CATEGORIES, type GuidedPhoto } from "@/components/identify/GuidedCapture";
import CaptureDeviceActions from "@/components/identify/CaptureDeviceActions";
import CaptureSuggestions from "@/components/identify/CaptureSuggestions";
import { useAuth } from "@/lib/auth-context";
import { useUpload } from "@/lib/hooks/useUpload";
import { useIdentify } from "@/lib/hooks/useIdentify";
import { captureDraft, captureOwner, type CaptureDraft } from "@/lib/offline/capture-draft";
import type { ItemDetail } from "@/lib/api";
import { API_BASE, IS_MOBILE_BUILD } from "@/lib/config";
import { itemPath } from "@/lib/platform";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function itemRequest<T>(token: string, path: string, method: string, body: unknown) {
  const response = await fetch(`${API_BASE}/api/items${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(method === "POST" && { "X-Archive-Retry": "1" }),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Archiv-Anfrage fehlgeschlagen (${response.status}).`);
  return response.json() as Promise<T>;
}

function updateBadge(count: number) {
  if (count) void navigator.setAppBadge?.(count).catch(() => {});
  else void navigator.clearAppBadge?.().catch(() => {});
}

export default function IdentifyPage() {
  const router = useRouter();
  const { accessToken, isLoading } = useAuth();
  const owner = accessToken ? captureOwner(accessToken) : null;
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [draft, setDraft] = useState<CaptureDraft>();
  const [item, setItem] = useState<ItemDetail>();
  const [barcode, setBarcode] = useState("");
  const [sharedPhotos, setSharedPhotos] = useState<File[]>();
  const [sharedReady, setSharedReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [noticeAvailable, setNoticeAvailable] = useState(false);
  const [noticesEnabled, setNoticesEnabled] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const running = useRef(false);
  const { uploadSingleFile, progress } = useUpload();
  const { startIdentification, pollItem } = useIdentify();

  useEffect(() => {
    function syncConnection() { setOnline(navigator.onLine); }
    syncConnection();
    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);
    if (!IS_MOBILE_BUILD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register(`${basePath}/capture-worker.js`).then(() => {
        setNoticeAvailable("Notification" in window);
        setNoticesEnabled("Notification" in window && Notification.permission === "granted");
      }).catch(() => {});
    }

    const shared = new URLSearchParams(window.location.search).get("shared");
    async function readSharedPhotos() {
      try {
        if (!shared || !/^[a-f\d-]{36}$/i.test(shared) || !("caches" in window)) return;
        const cache = await caches.open("archive-shared-photos");
        const key = `${basePath}/identify/shared/${shared}`;
        const response = await cache.match(key);
        if (!response) return;
        const fields = await response.formData();
        setSharedPhotos(fields.getAll("photos").filter((value): value is File => value instanceof File));
      } catch {
        setError("Geteilte Fotos konnten nicht geladen werden.");
      } finally {
        setSharedReady(true);
      }
    }
    void readSharedPhotos();
    return () => {
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
    };
  }, []);

  useEffect(() => {
    if (!owner) return;
    let active = true;
    captureDraft(owner).then((saved) => {
      if (!active) return;
      setDraft(saved);
      setItem(undefined);
      updateBadge(saved ? saved.photos.length - saved.uploaded : 0);
    }).catch(() => {
      if (active) setError("Der lokale Aufnahmespeicher ist nicht verfügbar.");
    }).finally(() => {
      if (active) setLoadedOwner(owner);
    });
    return () => { active = false; };
  }, [owner]);

  const resume = useCallback(async (candidate: CaptureDraft) => {
    if (!owner || !accessToken || !navigator.onLine || running.current) return;
    running.current = true;
    setBusy(true);
    setError(undefined);
    async function transfer() {
      if (!owner || !accessToken) return;
      const saved = await captureDraft(owner);
      if (!saved || saved.archiveId !== candidate.archiveId) return;
      let current = saved;
      if (current.itemId === undefined) {
        const created = await itemRequest<ItemDetail>(accessToken, "/", "POST", {
          archive_id: current.archiveId,
          title: "Neues Sammlerstück",
          category: current.category,
          production_code: current.barcode || null,
        });
        current = { ...current, itemId: created.id };
        await captureDraft(owner, current);
        setDraft(current);
      }
      const itemId = current.itemId!;
      for (let i = current.uploaded; i < current.photos.length; i++) {
        if (!navigator.onLine) return;
        const photo = current.photos[i];
        await uploadSingleFile(itemId, photo.file, photo.viewType, i === 0, i);
        current = { ...current, uploaded: i + 1 };
        await captureDraft(owner, current);
        setDraft(current);
        updateBadge(current.photos.length - current.uploaded);
      }
      const startedAt = current.identificationStartedAt;
      if (!startedAt || Date.now() - startedAt >= 5 * 60_000) {
        const existing = startedAt && await fetch(`${API_BASE}/api/items/${itemId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(async (response) => {
          if (!response.ok) throw new Error("Bestimmungsstatus nicht verfügbar.");
          return response.json() as Promise<ItemDetail>;
        });
        if (!existing || existing.classification_status === "draft") {
          await startIdentification(itemId);
          current = { ...current, identificationStartedAt: Date.now() };
          await captureDraft(owner, current);
          setDraft(current);
        }
      }
      const result = await pollItem(itemId) as ItemDetail;
      if (result.classification_status === "verified") {
        await captureDraft(owner, null);
        setDraft(undefined);
        router.push(itemPath(itemId));
        return;
      }
      setItem(result);
      if (!current.completionNotified && "serviceWorker" in navigator &&
          "Notification" in window && Notification.permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.showNotification("Bestimmung fertig", { tag: current.archiveId });
            await captureDraft(owner, { ...current, completionNotified: true });
          }
        } catch {
          // The result stays available when the browser cannot show a system notification.
        }
      }
    }
    try {
      if (navigator.locks) await navigator.locks.request(`archive-capture-${owner}`, transfer);
      else await transfer();
    } catch {
      if (navigator.onLine) setError("Die Aufnahme konnte nicht abgeschlossen werden. Versuche es erneut.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [accessToken, owner, pollItem, router, startIdentification, uploadSingleFile]);

  const queuedId = draft?.archiveId;
  useEffect(() => {
    if (online && !item && draft && loadedOwner === owner) void resume(draft);
    // Only a new queue entry or a reconnection starts an automatic attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedId, online, loadedOwner, owner, resume]);

  async function submit(category: string, photos: GuidedPhoto[]) {
    if (!owner || busy || running.current || draft) return;
    running.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const next: CaptureDraft = {
        archiveId: `SCAN-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
        category, barcode, photos, uploaded: 0,
      };
      await captureDraft(owner, next, true);
      setDraft(next);
      updateBadge(photos.length);
      const url = new URL(window.location.href);
      const shared = url.searchParams.get("shared");
      if (shared && "caches" in window) {
        void caches.open("archive-shared-photos").then((cache) =>
          cache.delete(`${basePath}/identify/shared/${shared}`),
        ).catch(() => {});
        url.searchParams.delete("shared");
        window.history.replaceState(null, "", url);
      }
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === "ConstraintError") {
        setError("Für dieses Konto ist bereits eine Aufnahme geöffnet.");
      } else {
        setError("Die Fotos konnten auf diesem Gerät nicht zwischengespeichert werden.");
      }
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  async function discardLocalDraft() {
    if (!owner || busy || running.current || !draft) return;
    running.current = true;
    setBusy(true);
    try {
      async function discard() {
        if (!owner || !draft) return;
        const saved = await captureDraft(owner);
        if (saved?.archiveId === draft.archiveId) await captureDraft(owner, null);
      }
      if (navigator.locks) await navigator.locks.request(`archive-capture-${owner}`, discard);
      else await discard();
      setDraft(undefined);
      setSharedPhotos(undefined);
      setConfirmDiscard(false);
      setError(undefined);
      updateBadge(0);
    } catch {
      setError("Die lokale Aufnahme konnte nicht entfernt werden.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  async function enableNotices() {
    if (!noticeAvailable) return;
    const permission = await Notification.requestPermission();
    setNoticesEnabled(permission === "granted");
  }

  const stage = item ? "Vorschläge prüfen" : draft
    ? draft.uploaded === draft.photos.length ? "Wird bestimmt …" : "Fotos hochladen"
    : "Stück aufnehmen";

  return (
    <>
      <TopAppBar />
      <main lang="de" className="mx-auto max-w-2xl px-margin pt-lg pb-xl mb-16 md:mb-0">
        <header className="border-b border-outline-variant mb-lg pb-md">
          <h1 className="font-display-lg text-display-lg">{stage}</h1>
        </header>
        {error && <p role="alert" className="mb-md bg-error-container text-on-error-container p-sm">{error}</p>}
        {isLoading || !sharedReady || (owner && loadedOwner !== owner) ? (
          <p role="status">Wird geladen …</p>
        ) : !owner || !accessToken ? (
          <Button href={`${basePath}/login?redirect=/identify`}>Anmelden</Button>
        ) : item ? (
          <CaptureSuggestions item={item} onSave={async (updates) => {
            const category = GUIDED_CATEGORIES.find((entry) => entry.id === draft?.category);
            const title = [updates.brand, updates.model].filter(Boolean).join(" ") ||
              category?.label || item.title;
            await itemRequest(accessToken, `/${item.id}`, "PATCH", { ...updates, title });
            await captureDraft(owner, null);
            router.push(itemPath(item.id));
          }} />
        ) : draft ? (
          <section className="space-y-md" aria-label="Aufnahmestatus">
            {!online && (
              <p role="status">Wartet auf Verbindung. Die Fotos sind auf diesem Gerät gespeichert.</p>
            )}
            {draft.uploaded === draft.photos.length ? (
              busy && <progress aria-label="Bestimmung läuft" className="w-full h-2 accent-secondary" />
            ) : (
              <ol className="divide-y divide-outline-variant bg-surface-container-low px-md">
                {draft.photos.map(({ file, label }, index) => {
                  const status = progress.find(({ fileName }) => fileName === file.name);
                  const value = index < draft.uploaded ? 100 : status?.status === "uploading" && busy ? status.progress : 0;
                  return (
                    <li key={file.name} className="py-sm space-y-xs">
                      <div className="flex flex-wrap justify-between gap-xs">
                        <span>{label}</span>
                        <span className="text-sm text-on-surface-variant">
                          {value === 100 && index < draft.uploaded ? "Hochgeladen" : !online
                            ? "Wartet auf Verbindung" : status?.status === "error" ? "Fehlgeschlagen" : `${value} %`}
                        </span>
                      </div>
                      <progress className="w-full h-2 accent-secondary" max={100} value={value} aria-label={label} />
                    </li>
                  );
                })}
              </ol>
            )}
            {online && !busy && <Button onClick={() => void resume(draft)}>Erneut versuchen</Button>}
            {!busy && !confirmDiscard && (
              <Button variant="text" className="block" onClick={() => setConfirmDiscard(true)}>
                Lokale Aufnahme verwerfen
              </Button>
            )}
            {confirmDiscard && (
              <div className="space-y-xs">
                <p>Die lokale Kopie wird entfernt. Bereits hochgeladene Fotos bleiben im Archiv.</p>
                <div className="flex flex-wrap gap-sm">
                  <Button disabled={busy} onClick={() => void discardLocalDraft()}>Verwerfen</Button>
                  <Button variant="text" onClick={() => setConfirmDiscard(false)}>Abbrechen</Button>
                </div>
              </div>
            )}
          </section>
        ) : (
          <>
            <GuidedCapture initialFiles={sharedPhotos} onSubmit={(category, photos) => void submit(category, photos)} />
            <div className="mt-lg space-y-sm">
              <CaptureDeviceActions onBarcode={setBarcode} />
              {barcode && <p role="status" className="text-sm">Strichcode erfasst: {barcode}</p>}
              {noticeAvailable && !noticesEnabled && (
                <Button variant="text" onClick={() => void enableNotices()}>Bei fertiger Bestimmung benachrichtigen</Button>
              )}
            </div>
          </>
        )}
      </main>
      <BottomNavBar />
    </>
  );
}
