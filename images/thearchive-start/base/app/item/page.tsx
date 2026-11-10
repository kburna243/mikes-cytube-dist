"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ItemDetailView } from "@/app/items/[id]/item-detail-view";

function ItemPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="p-lg text-on-surface-variant">No item ID provided.</div>
    );
  }
  return <ItemDetailView id={id} />;
}

export default function ItemPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse p-lg space-y-md">
          <div className="h-6 bg-primary/10 w-32" />
          <div className="h-96 bg-primary/5" />
        </div>
      }
    >
      <ItemPageContent />
    </Suspense>
  );
}
