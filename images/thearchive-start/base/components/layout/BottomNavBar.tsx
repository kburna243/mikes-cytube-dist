"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomNavItems = [
  { href: "/dashboard", label: "Archive", icon: "inventory_2" },
  { href: "/identify", label: "Scan", icon: "center_focus_weak" },
  { href: "/collection", label: "Gallery", icon: "photo_library" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-[#F2EFE9] dark:bg-[#1A1A1A] border-t border-[#2C2C2C] z-50">
      {bottomNavItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-6 py-2 transition-all duration-300 ${
              isActive
                ? "bg-primary text-[#F2EFE9]"
                : "text-primary hover:bg-primary/10"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-0.5">
              {item.icon}
            </span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
