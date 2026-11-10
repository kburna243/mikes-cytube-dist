"use client";

import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Footer } from "@/components/layout/Footer";
import { getDashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { itemPath, FALLBACK_IMAGES } from "@/lib/platform";
import { useQuery } from "@tanstack/react-query";

const CATEGORY_COLORS: Record<string, string> = {
  Sneakers: "#894d51", // secondary color
  Workwear: "#1d3022",
  Denim: "#171818", // primary color
  Leather: "#894d51",
  Sportswear: "#171818",
  Streetwear: "#894d51",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Processed just now";
  if (hours < 24) return `Processed ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Processed ${days}d ago`;
}

export default function DashboardPage() {
  const { accessToken } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(accessToken ?? undefined),
    enabled: !!accessToken,
  });

  const displayData = data ?? {
    total_value: 124500,
    item_count: 1284,
    category_distribution: [
      { label: "90s Nike", value: "42%" },
      { label: "Vintage Carhartt", value: "28%" },
      { label: "Japanese Denim", value: "15%" },
    ],
    recent_scans: [],
  };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return (
    <>
      <TopAppBar />
      <div className="flex max-w-[1440px] mx-auto min-h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#2C2C2C]/20 dark:border-[#EFEFE9]/20 py-10 px-8 flex-shrink-0">
          <div className="space-y-8">
            <div>
              <h3 className="font-label-caps text-on-surface-variant mb-6 text-[10px]">
                NAVIGATION
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    className="flex items-center gap-3 text-primary font-bold group"
                    href="/dashboard"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      dashboard
                    </span>
                    <span className="font-data-mono uppercase text-[12px] tracking-tight group-hover:underline">
                      Dashboard
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-3 text-on-surface-variant group"
                    href="/collection"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      folder_special
                    </span>
                    <span className="font-data-mono uppercase text-[12px] tracking-tight group-hover:text-primary transition-colors">
                      Collections
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-3 text-on-surface-variant group"
                    href="/identify"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      center_focus_weak
                    </span>
                    <span className="font-data-mono uppercase text-[12px] tracking-tight group-hover:text-primary transition-colors">
                      Scanner
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-3 text-on-surface-variant group"
                    href="/community"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      group
                    </span>
                    <span className="font-data-mono uppercase text-[12px] tracking-tight group-hover:text-primary transition-colors">
                      Community
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="flex items-center gap-3 text-on-surface-variant group"
                    href="/settings"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      settings
                    </span>
                    <span className="font-data-mono uppercase text-[12px] tracking-tight group-hover:text-primary transition-colors">
                      Settings
                    </span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="pt-10 border-t border-[#2C2C2C]/10">
              <h3 className="font-label-caps text-on-surface-variant mb-4 text-[10px]">
                QUICK ACTIONS
              </h3>
              <div className="space-y-3">
                <a
                  href="/identify"
                  className="block w-full text-left border border-primary p-3 hover:bg-surface-container transition-colors"
                >
                  <span className="font-data-mono text-[10px] uppercase block mb-1">
                    Action 01
                  </span>
                  <span className="font-headline-sm text-sm">
                    Scan New Item
                  </span>
                </a>
                <a
                  href="mailto:beta@the-archive.app?subject=Beta%20Feedback%20The%20Archive"
                  className="block w-full text-left border border-primary p-3 hover:bg-surface-container transition-colors"
                >
                  <span className="font-data-mono text-[10px] uppercase block mb-1">
                    Action 02
                  </span>
                  <span className="font-headline-sm text-sm">
                    Beta Feedback
                  </span>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-margin pt-lg pb-xl mb-16 md:mb-0">
          <section className="flex flex-col md:flex-row justify-between items-end gap-md mb-xl border-b border-primary/20 pb-4">
            <div>
              <p className="font-label-caps text-secondary text-[11px] uppercase mb-2">
                System Status: Active // Authenticated Curator
              </p>
              <h1 className="font-display-lg text-display-lg text-primary tracking-tighter italic">
                Collector&apos;s Dashboard
              </h1>
            </div>
            <div className="flex gap-4 items-center">
              <a
                href="/identify"
                className="bg-secondary text-on-secondary px-lg py-sm font-label-caps flex items-center gap-sm hover:bg-primary transition-colors duration-300"
              >
                Identify New Item
              </a>
            </div>
          </section>

          {/* Line Chart & Active Dossiers Grid */}
          <div className="grid grid-cols-12 gap-gutter mb-xl">
            {/* Market Performance Graph */}
            <section className="col-span-12 lg:col-span-8 border border-primary bg-surface p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-headline-md mb-1 italic">
                    Market Performance
                  </h2>
                  <p className="font-label-caps text-on-surface-variant text-[10px]">
                    QUARTERLY APPRAISAL GROWTH
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-label-caps text-on-surface-variant">
                      TOTAL VALUE
                    </p>
                    <p className="font-data-mono text-lg font-bold">
                      {formatter.format(displayData.total_value)}
                    </p>
                  </div>
                  <div className="text-right border-l border-primary/20 pl-4">
                    <p className="text-[10px] font-label-caps text-secondary">
                      DELTA
                    </p>
                    <p className="font-data-mono text-lg text-secondary">
                      +12.4%
                    </p>
                  </div>
                </div>
              </div>

              {/* SVG Graph */}
              <div className="h-48 w-full relative border-l border-b border-primary/20 mb-4">
                <svg
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 800 200"
                >
                  <path
                    d="M0,180 Q100,160 200,170 T400,120 T600,140 T800,40"
                    fill="none"
                    stroke="#171818"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    d="M0,180 Q100,160 200,170 T400,120 T600,140 T800,40 L800,200 L0,200 Z"
                    fill="url(#grad1)"
                    opacity="0.05"
                  ></path>
                  <defs>
                    <linearGradient
                      id="grad1"
                      x1="0%"
                      x2="0%"
                      y1="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#894d51", stopOpacity: 1 }}
                      ></stop>
                      <stop
                        offset="100%"
                        style={{ stopColor: "#894d51", stopOpacity: 0 }}
                      ></stop>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid grid-cols-8 pointer-events-none opacity-5">
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                  <div className="border-r border-primary"></div>
                </div>
              </div>
              <div className="flex justify-between font-data-mono text-[10px] text-on-surface-variant">
                <span>JUL 2026</span>
                <span>AUG 2026</span>
                <span>SEP 2026</span>
                <span>OCT 2026</span>
              </div>
            </section>

            {/* Active Dossiers Panel */}
            <section className="col-span-12 lg:col-span-4 border border-primary bg-surface-container p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-headline-md mb-6 italic">
                  Active Dossiers
                </h2>
                <div className="space-y-4">
                  <div className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-caps text-secondary text-[10px]">
                        ARCHIVE NO. 4412
                      </span>
                      <span className="font-data-mono text-[10px]">85%</span>
                    </div>
                    <h3 className="font-headline-sm text-sm mb-1">
                      M-65 Field Jacket (1968)
                    </h3>
                    <div className="w-full h-[1px] bg-outline-variant">
                      <div className="w-[85%] h-full bg-primary"></div>
                    </div>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-caps text-secondary text-[10px]">
                        ARCHIVE NO. 9021
                      </span>
                      <span className="font-data-mono text-[10px]">42%</span>
                    </div>
                    <h3 className="font-headline-sm text-sm mb-1">
                      Omega Speedmaster &apos;Ed White&apos;
                    </h3>
                    <div className="w-full h-[1px] bg-outline-variant">
                      <div className="w-[42%] h-full bg-primary"></div>
                    </div>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-caps text-secondary text-[10px]">
                        ARCHIVE NO. 0118
                      </span>
                      <span className="font-data-mono text-[10px]">12%</span>
                    </div>
                    <h3 className="font-headline-sm text-sm mb-1">
                      Eames Lounge Chair
                    </h3>
                    <div className="w-full h-[1px] bg-outline-variant">
                      <div className="w-[12%] h-full bg-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
              <a
                href="/collection"
                className="mt-6 block text-center font-label-caps py-2 text-[10px] border border-primary hover:bg-primary hover:text-on-primary transition-all uppercase tracking-widest"
              >
                View All Dossiers
              </a>
            </section>
          </div>

          {/* Bento Summary Grid */}
          <div className="grid grid-cols-12 gap-gutter mb-xl">
            <div className="col-span-12 md:col-span-4 p-md border border-primary/10 bg-surface-container-low flex flex-col justify-between h-56">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps opacity-60">
                  METRIC // 01
                </span>
                <span className="material-symbols-outlined opacity-40">
                  payments
                </span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  {formatter.format(displayData.total_value)}
                </h2>
                <p className="font-body-md text-on-surface-variant italic">
                  Estimated Portfolio Value
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 p-md border border-primary/10 bg-surface-container flex flex-col justify-between h-56">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps opacity-60">
                  METRIC // 02
                </span>
                <span className="material-symbols-outlined opacity-40">
                  inventory_2
                </span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  {displayData.item_count}
                </h2>
                <p className="font-body-md text-on-surface-variant italic">
                  Verified Archived Items
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 p-md bg-primary text-on-primary flex flex-col justify-between h-56">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps opacity-60">
                  DISTRIBUTION // 03
                </span>
                <span className="material-symbols-outlined opacity-40 text-on-primary-container">
                  pie_chart
                </span>
              </div>
              <div className="space-y-sm">
                {displayData.category_distribution.slice(0, 3).map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center border-b border-on-primary/20 pb-1"
                  >
                    <span className="font-body-md text-[13px]">
                      {item.label}
                    </span>
                    <span className="font-data-mono text-data-mono text-[13px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Scans Section */}
          <section className="mb-xl">
            <div className="flex justify-between items-center mb-lg border-b border-primary/10 pb-sm">
              <h3 className="font-headline-sm text-headline-sm italic">
                Recent Catalog Entries
              </h3>
              <a
                href="/collection"
                className="font-label-caps text-label-caps underline hover:text-secondary transition-colors"
              >
                View All Archive
              </a>
            </div>

            {displayData.recent_scans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                {displayData.recent_scans.map((item) => (
                  <a
                    key={item.id}
                    href={itemPath(item.id)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[4/5] bg-surface-container-highest overflow-hidden border border-primary/10 mb-sm relative flex items-center justify-center">
                      {FALLBACK_IMAGES[item.id] ? (
                        <img
                          src={FALLBACK_IMAGES[item.id]}
                          alt={item.title}
                          className="w-full h-full object-cover mix-blend-multiply grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <span className="font-label-caps text-label-caps text-on-surface-variant opacity-30">
                          IMAGE
                        </span>
                      )}
                      <div
                        className="absolute top-sm right-sm text-on-primary px-2 py-1 text-[10px] font-label-caps"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[item.category] ?? "primary",
                        }}
                      >
                        {item.category?.toUpperCase() ?? "UNBEKANNT"}
                      </div>
                    </div>
                    <p className="font-label-caps text-label-caps text-primary text-[11px]">
                      ID: {item.id}
                    </p>
                    <p className="font-body-md text-on-surface-variant truncate font-medium">
                      {item.title}
                    </p>
                    <p className="font-data-mono text-data-mono opacity-60 mt-1 italic text-[12px]">
                      {timeAgo(item.created_at)}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                {/* Fallback Seeded Mock Items for UI completeness */}
                {[
                  {
                    id: "NK-1994-001",
                    title: "Nike Air Max 2 Light '94 Vintage",
                    category: "Sneakers",
                    time: "Processed 2h ago",
                  },
                  {
                    id: "CH-DET-082",
                    title: "Carhartt Detroit Jacket Faded Tan",
                    category: "Workwear",
                    time: "Processed 5h ago",
                  },
                  {
                    id: "LV-501-1966",
                    title: "Levi's 501 Big E Selvedge",
                    category: "Denim",
                    time: "Processed 1d ago",
                  },
                  {
                    id: "SL-BKR-012",
                    title: "Saint Laurent L01 Motorcyclist",
                    category: "Leather",
                    time: "Processed 2d ago",
                  },
                ].map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="aspect-[4/5] bg-surface-container-highest overflow-hidden border border-primary/10 mb-sm relative flex items-center justify-center">
                      <img
                        src={FALLBACK_IMAGES[item.id]}
                        alt={item.title}
                        className="w-full h-full object-cover mix-blend-multiply grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      <div
                        className="absolute top-sm right-sm text-on-primary px-2 py-1 text-[10px] font-label-caps"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[item.category] ?? "#171818",
                        }}
                      >
                        {item.category.toUpperCase()}
                      </div>
                    </div>
                    <p className="font-label-caps text-label-caps text-primary text-[11px]">
                      ID: {item.id}
                    </p>
                    <p className="font-body-md text-on-surface-variant truncate font-medium">
                      {item.title}
                    </p>
                    <p className="font-data-mono text-data-mono opacity-60 mt-1 italic text-[12px]">
                      {item.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Marketplace Sync & Archive Health Columns */}
          <div className="grid grid-cols-12 gap-gutter mb-xl">
            {/* Marketplace Sync */}
            <section className="col-span-12 lg:col-span-6 border border-primary p-6 bg-surface">
              <h2 className="font-headline-md italic mb-4">Marketplace Sync</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-data-mono text-sm">GRAILED_API</span>
                  </div>
                  <span className="font-label-caps text-on-surface-variant text-[10px]">
                    ACTIVE
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-data-mono text-sm">
                      CHRONO24_SYNC
                    </span>
                  </div>
                  <span className="font-label-caps text-on-surface-variant text-[10px]">
                    ACTIVE
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-data-mono text-sm">
                      STOCKX_BRIDGE
                    </span>
                  </div>
                  <span className="font-label-caps text-secondary text-[10px]">
                    RE-AUTHENTICATE
                  </span>
                </div>
              </div>
            </section>

            {/* Archive Health */}
            <section className="col-span-12 lg:col-span-6 border border-primary p-6 bg-primary text-on-primary">
              <h2 className="font-headline-md italic mb-4 text-on-primary">
                Archive Health
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-label-caps text-on-primary-container text-[10px] mb-1">
                    VERIFICATION RATE
                  </p>
                  <p className="font-display-lg text-3xl font-semibold">
                    92.4%
                  </p>
                </div>
                <div>
                  <p className="font-label-caps text-on-primary-container text-[10px] mb-1">
                    TOTAL ITEMS
                  </p>
                  <p className="font-display-lg text-3xl font-semibold">142</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="font-body-md italic opacity-80 text-[13px] leading-relaxed">
                    Your collection is currently meeting all standards for
                    &apos;Premier Curator&apos; status. 3 items require updated
                    photography for Tier 1 appraisal.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sync Status Log */}
          <section className="bg-surface-container-high p-md border border-primary/20">
            <h4 className="font-label-caps text-label-caps mb-md flex items-center gap-base">
              <span className="w-2 h-2 bg-secondary rounded-full" />
              Archive Log / Sync_Status: Optimized
            </h4>
            <div className="space-y-base font-data-mono text-[11px] opacity-70">
              <div className="flex justify-between border-b border-primary/5 pb-1">
                <span>ARCHIVE_NODE_NYC_SYNC</span>
                <span>SUCCESS // 100%</span>
              </div>
              <div className="flex justify-between border-b border-primary/5 pb-1">
                <span>MARKET_VALUATION_INDEX</span>
                <span>UPDATED // 0.02s</span>
              </div>
              <div className="flex justify-between">
                <span>BLOCK_CHAIN_PROVENANCE</span>
                <span>VERIFIED</span>
              </div>
            </div>
          </section>
        </main>
      </div>
      <BottomNavBar />
      <Footer />
    </>
  );
}
