"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/identify", label: "Identify" },
  { href: "/collection", label: "Collection" },
  { href: "/community", label: "Community" },
];

export function TopAppBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-background">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-margin py-md">
        <Link
          href="/"
          className="font-display-lg text-[28px] leading-none tracking-tighter text-primary"
        >
          THE ARCHIVE
        </Link>

        {/* Nav in Work Sans, nicht Serif: der Serif gehört den Überschriften. */}
        <nav className="hidden items-center gap-lg md:flex">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-body-md transition-colors duration-200 ${
                  isActive
                    ? "border-b border-primary pb-1 text-primary"
                    : "text-on-surface-variant hover:text-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-md">
          <Link
            href="/settings"
            className={`font-label-caps transition-colors ${
              pathname?.startsWith("/settings")
                ? "text-primary"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
