"use client";

import { useEffect, useRef, useState } from "react";

/** Returns a ref + flag that flips true once the element approaches the viewport. */
export function useNearViewport<T extends HTMLElement>(margin = "320px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setNear(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, near };
}
