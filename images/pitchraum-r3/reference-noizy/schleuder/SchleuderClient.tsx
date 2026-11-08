import { useMemo } from "react";
import { withBase } from "@/lib/base";
import { SOCIALS } from "@/lib/data";
import { createDefaultData } from "@/components/werkstatt/defaults";
import { canvasToBlob } from "@/components/werkstatt/export";
import { getFormat } from "@/components/werkstatt/formats";
import { MEDIA_LIBRARY } from "@/components/werkstatt/library";
import { renderArtwork } from "@/components/werkstatt/render";
import { getTheme } from "@/components/werkstatt/themes";
import type { WerkstattProps } from "@/components/werkstatt/types";
import type { Campaign, RenderRequest, SchleuderStore } from "./types";
import ContentSchleuder from "./ContentSchleuder";


type Content = Pick<WerkstattProps, "gigs" | "gems" | "release">;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(withBase(path), init);
  const json = await res.json().catch(() => ({ ok: false, message: `Fehler ${res.status}` }));
  if (!json.ok) throw new Error(json.message ?? "Fehler");
  return json as T;
}

const store: SchleuderStore = {
  list: () => call<{ rows: Campaign[] }>("/api/admin/campaigns").then((r) => r.rows),
  save: (campaign) =>
    call<{ row: Campaign }>("/api/admin/campaigns", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campaign) }).then((r) => r.row),
  remove: (id) => call(`/api/admin/campaigns?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then(() => undefined),
};

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await call<{ img: string; video?: string }>("/api/admin/upload", { method: "POST", body: form });
  return r.video ?? r.img; // videos come back trimmed to 30 s, images as WebP
}

const LIBRARY = MEDIA_LIBRARY.map((a) => ({ path: a.path, name: a.name, role: a.role }));
const SOCIAL_LINKS = SOCIALS.map((s) => ({ id: s.id, handle: s.handle, url: s.url }));

export default function SchleuderClient({ assetBase, fonts, content }: { assetBase: string; fonts: { display: string; mono: string }; content: Content }) {
  // RenderRequest -> the Werkstatt's own renderer, so every graphic is the real Werkstatt template.
  const renderImage = useMemo(
    () => async (r: RenderRequest) => {
      const base = createDefaultData(r.template, content);
      const f = r.fields;
      const data = {
        ...base,
        title: f.title ?? base.title, year: f.year ?? base.year, label: f.label ?? base.label, statement: f.statement ?? base.statement,
        subtitle: f.subtitle ?? base.subtitle, platform: f.platform ?? base.platform, story: f.story ?? base.story, badge: f.badge ?? base.badge,
        image: r.image ?? base.image,
      };
      const format = getFormat(r.format);
      const { canvas } = await renderArtwork(data, format, getTheme(r.theme), assetBase, fonts);
      return canvasToBlob(canvas, format);
    },
    [assetBase, fonts, content],
  );

  return (
    <ContentSchleuder
      assetBase={assetBase}
      store={store}
      renderImage={renderImage}
      onOpenWerkstatt={() => window.open(withBase("/admin/werkstatt"), "_blank", "noopener")}
      uploadFile={uploadFile}
      library={LIBRARY}
      socials={SOCIAL_LINKS}
      fonts={fonts}
    />
  );
}
