"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): {
    detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
  };
  getSupportedFormats(): Promise<string[]>;
};

const productFormats = ["ean_13", "ean_8", "upc_a", "upc_e", "itf", "code_128"];

function scannerConstructor() {
  return (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;
}

export default function CaptureDeviceActions({
  onBarcode,
}: {
  onBarcode: (barcode: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!scanning || !video.current) return;

    const preview = video.current;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function stopWithMessage(message: string) {
      if (cancelled) return;
      setStatus(message);
      setScanning(false);
    }

    async function start() {
      try {
        const Detector = scannerConstructor();
        if (!Detector || !navigator.mediaDevices?.getUserMedia) {
          stopWithMessage("Dieser Browser kann keine Strichcodes scannen. Gib den Code von der Verpackung ein.");
          return;
        }

        const supported = await Detector.getSupportedFormats();
        if (cancelled) return;
        const formats = productFormats.filter((format) => supported.includes(format));
        if (!formats.length) {
          stopWithMessage("Dieser Browser kann keine Produktcodes scannen. Gib den Code von der Verpackung ein.");
          return;
        }

        const detector = new Detector({ formats });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        preview.srcObject = stream;
        await preview.play();

        async function scan() {
          if (cancelled) return;
          try {
            if (preview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              const detected = await detector.detect(preview);
              if (cancelled) return;
              const value = detected[0]?.rawValue.trim();
              if (value && value.length > 100) {
                stopWithMessage("Der erkannte Code ist zu lang. Scanne den Produktcode von der Verpackung.");
                return;
              }
              if (value) {
                setBarcode(value);
                stopWithMessage("Strichcode erkannt. Prüfe ihn und übernimm ihn für das Stück.");
                return;
              }
            }
            timer = setTimeout(scan, 250);
          } catch {
            stopWithMessage("Der Strichcode konnte nicht gelesen werden. Gib ihn von Hand ein oder starte den Scan erneut.");
          }
        }

        void scan();
      } catch {
        stopWithMessage("Die Kamera konnte nicht geöffnet werden. Du kannst den Strichcode von Hand eingeben.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      preview.srcObject = null;
    };
  }, [scanning]);

  return (
    <div className="space-y-4">
      <details className="border-y border-outline-variant py-3" onToggle={(event) => {
        if (!event.currentTarget.open) setScanning(false);
      }}>
        <summary className="cursor-pointer font-body-md text-secondary">
          Strichcode eines Spiels
        </summary>
        <div className="mt-3 space-y-3">
          {scanning && (
            <div>
              <div className="relative overflow-hidden bg-primary">
                <video ref={video} className="aspect-video w-full object-cover" muted playsInline aria-label="Kameravorschau" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] inset-y-[32%] border-2 border-white" />
              </div>
              <p className="mt-2 text-sm">Halte den Strichcode mittig in den Rahmen.</p>
            </div>
          )}
          <Button variant="secondary" onClick={() => {
            setStatus("");
            setScanning(!scanning);
          }}>
            {scanning ? "Scan beenden" : "Kamera zum Scannen öffnen"}
          </Button>
          <p role="status" className="text-sm text-on-surface-variant">{status}</p>
          <form className="space-y-2" onSubmit={(event) => {
            event.preventDefault();
            const value = barcode.trim();
            if (!value) return;
            setScanning(false);
            onBarcode(value);
            setStatus("Strichcode übernommen.");
          }}>
            <label className="block text-sm" htmlFor="archive-product-barcode">
              Strichcode eingeben oder prüfen
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="archive-product-barcode"
                type="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={100}
                className="min-w-0 flex-1 border border-outline bg-surface p-2"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
              />
              <Button type="submit" disabled={!barcode.trim()}>Übernehmen</Button>
            </div>
          </form>
        </div>
      </details>
      <details className="pb-2">
        <summary className="cursor-pointer font-body-md text-secondary">
          Zum Home-Bildschirm auf dem iPhone
        </summary>
        <p className="mt-2 text-sm text-on-surface-variant">
          Öffne The Archive in Safari. Tippe im Teilen-Menü auf „Zu Home-Bildschirm hinzufügen“,
          aktiviere „Als Web-App öffnen“ und tippe auf „Hinzufügen“.
        </p>
      </details>
    </div>
  );
}
