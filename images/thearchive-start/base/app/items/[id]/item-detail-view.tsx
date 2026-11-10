"use client";

import ShareArchiveItem from "@/components/identify/ShareArchiveItem";

import { useEffect, useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Footer } from "@/components/layout/Footer";
import { getItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ItemDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { FALLBACK_IMAGES, FALLBACK_GALLERY } from "@/lib/platform";

import { API_BASE } from "@/lib/config";

export function ItemDetailView({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [error, setError] = useState<number | null>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setItem(null);
    setError(null);
    setActiveImage(null);
    getItem(parseInt(id, 10), accessToken)
      .then((result) => { if (active) setItem(result); })
      .catch(() => { if (active) setError(404); });
    return () => { active = false; };
  }, [id, accessToken]);

  if (error === 404) notFound();
  if (error)
    return <div className="p-lg text-error">Failed to load item details.</div>;
  if (!item) {
    return (
      <>
        <TopAppBar />
        <main className="max-w-[1440px] mx-auto px-margin pt-lg pb-xl mb-16 md:mb-0">
          <div className="animate-pulse space-y-md">
            <div className="h-6 bg-primary/10 w-32" />
            <div className="h-96 bg-primary/5" />
          </div>
        </main>
        <BottomNavBar />
        <Footer />
      </>
    );
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const primaryImage =
    item.images.find((img) => img.is_primary) ?? item.images[0];

  const primaryImageUrl = primaryImage
    ? `${API_BASE}${primaryImage.url}`
    : FALLBACK_IMAGES[item.archive_id];

  const galleryImages = item.images.length > 0
    ? item.images.map(img => `${API_BASE}${img.thumbnail_url || img.url}`)
    : (FALLBACK_GALLERY[item.archive_id] || []);

  const currentImageUrl = activeImage ?? primaryImageUrl;

  return (
    <>
      <TopAppBar />
      <main className="max-w-[1440px] mx-auto px-margin pt-lg pb-xl mb-16 md:mb-0">
        <a
          href="/collection"
          className="font-label-caps text-label-caps text-secondary underline mb-lg inline-block hover:text-primary transition-colors"
        >
          &larr; Back to Collection
        </a>

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 md:col-span-7">
            <div className="aspect-[3/4] bg-surface-container-highest border border-primary/10 mb-sm flex items-center justify-center relative overflow-hidden">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="font-label-caps text-label-caps text-on-surface-variant opacity-20">
                  {item.archive_id}
                </span>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-sm mt-sm overflow-x-auto pb-sm">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-24 flex-shrink-0 bg-surface-container border overflow-hidden transition-all ${
                      currentImageUrl === imgUrl
                        ? "border-primary scale-[0.98] outline-none"
                        : "border-primary/10 hover:border-primary/30"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-12 md:col-span-5">
            <span className="font-label-caps text-label-caps text-secondary uppercase mb-base block">
              {item.classification_status}
            </span>
            <h1 className="font-display-lg text-display-lg text-primary italic mb-sm">
              {item.title}
            </h1>
            <ShareArchiveItem title={item.title} />
            <p className="font-headline-sm text-headline-sm text-primary mb-md">
              {item.brand && item.model
                ? `${item.brand} • ${item.model}`
                : (item.brand ?? "Unknown Brand")}
            </p>

            <div className="h-px bg-primary/10 my-lg" />

            <div className="grid grid-cols-2 gap-md mb-lg">
              <div>
                <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                  Archive ID
                </span>
                <span className="font-data-mono text-data-mono">
                  {item.archive_id}
                </span>
              </div>
              {item.estimated_year && (
                <div>
                  <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                    Year
                  </span>
                  <span className="font-data-mono text-data-mono">
                    {item.estimated_year}
                  </span>
                </div>
              )}
              {item.origin && (
                <div>
                  <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                    Origin
                  </span>
                  <span className="font-data-mono text-data-mono">
                    {item.origin}
                  </span>
                </div>
              )}
              {item.size && (
                <div>
                  <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                    Size
                  </span>
                  <span className="font-data-mono text-data-mono">
                    {item.size}
                  </span>
                </div>
              )}
              {item.condition && (
                <div>
                  <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                    Condition
                  </span>
                  <span className="font-data-mono text-data-mono">
                    {item.condition}
                    {item.condition_score != null
                      ? ` (${item.condition_score}/10)`
                      : ""}
                  </span>
                </div>
              )}
              {item.category && (
                <div>
                  <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                    Category
                  </span>
                  <span className="font-data-mono text-data-mono">
                    {item.category?.toUpperCase() ?? "UNBEKANNT"}
                  </span>
                </div>
              )}
            </div>

            {(item.estimated_value_min || item.estimated_value_max) && (
              <div className="bg-surface-container p-md border border-primary/10 mb-lg">
                <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                  Estimated Value Range
                </span>
                <span className="font-headline-md text-headline-md text-primary">
                  {formatter.format(item.estimated_value_min ?? 0)} —{" "}
                  {formatter.format(item.estimated_value_max ?? 0)}
                </span>
              </div>
            )}

            {item.description && (
              <div className="mb-lg">
                <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                  Description
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {item.description}
                </p>
              </div>
            )}

            {item.production_code && (
              <div className="mb-lg">
                <span className="font-label-caps text-label-caps opacity-60 block mb-xs">
                  Production Code
                </span>
                <span className="font-data-mono text-data-mono">
                  {item.production_code}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNavBar />
      <Footer />
    </>
  );
}
