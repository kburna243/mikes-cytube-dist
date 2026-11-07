import { withBase } from "@/lib/base";

/** The sticker logo (Neighbor spelling) as delivered on 04.11.2026, with a hard print shadow. */
export default function LogoBadge({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBase("/assets/branding/logo-transparent.webp")}
      alt="DJ Noizy Neighbor Logo"
      width={1249}
      height={1198}
      className={`h-auto drop-shadow-[5px_5px_0_var(--color-ink)] ${className}`}
    />
  );
}
