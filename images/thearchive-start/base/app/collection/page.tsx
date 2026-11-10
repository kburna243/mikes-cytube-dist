"use client";

import { useState, useEffect } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Footer } from "@/components/layout/Footer";
import { getItems, type ItemListItem } from "@/lib/api";
import { itemPath } from "@/lib/platform";

import { API_BASE } from "@/lib/config";

const FILTERS = [
  "All",
  "Sneakers",
  "Workwear",
  "Denim",
  "Leather",
  "Sportswear",
];

function formatValue(item: ItemListItem): string {
  if (item.estimated_value_min && item.estimated_value_max) {
    const avg = (item.estimated_value_min + item.estimated_value_max) / 2;
    return `~$${avg.toLocaleString("en-US")}`;
  }
  return "Value: TBD";
}

export default function CollectionPage() {
  const [items, setItems] = useState<ItemListItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? undefined;
    const category = activeFilter === "All" ? undefined : activeFilter;
    getItems(category, token)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <>
      <TopAppBar />
      <main className="max-w-[1440px] mx-auto px-margin pt-lg pb-xl mb-16 md:mb-0">
        <div className="mb-xl">
          <span className="font-label-caps text-label-caps text-secondary uppercase mb-base block">
            PUBLIC VAULT
          </span>
          <h1 className="font-display-lg text-display-lg text-primary">
            Collection Gallery
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm max-w-2xl">
            A museum-grade digital environment for showcasing archival pieces.
          </p>
        </div>

        <div className="flex flex-wrap gap-sm mb-lg pb-lg border-b border-primary/10">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                setLoading(true);
              }}
              className={`font-label-caps text-label-caps px-4 py-2 border border-primary/20 transition-colors cursor-pointer ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "hover:bg-primary hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-xl font-body-lg text-on-surface-variant">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {items.map((item) => (
              <a
                key={item.id}
                href={itemPath(item.id)}
                className="group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-surface-container-highest border border-primary/10 mb-sm flex flex-col items-center justify-center group-hover:bg-surface-container transition-colors relative overflow-hidden">
                  {item.thumbnail_url ? (
                    <img
                      src={`${API_BASE}${item.thumbnail_url}`}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-label-caps text-label-caps text-on-surface-variant opacity-20">
                      {item.archive_id}
                    </span>
                  )}
                </div>
                <p className="font-label-caps text-label-caps text-primary">
                  {item.archive_id}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant truncate">
                  {item.title}
                </p>
                <p className="font-data-mono text-data-mono opacity-60 italic mt-0.5">
                  {formatValue(item)}
                </p>
              </a>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar />
      <Footer />
    </>
  );
}
