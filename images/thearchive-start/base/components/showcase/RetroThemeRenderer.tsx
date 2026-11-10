'use client';

import React, { useState } from 'react';

export type RetroTheme = 'KENNER_1978' | 'VINYL_33RPM' | 'GAMEBOY_1989' | 'BRAUN_RAMS_1960' | 'STREETWEAR_CYBER_90S';

export interface ShowcaseItem {
  id: string;
  title: string;
  category: string;
  year: number;
  manufacturer: string;
  condition: string;
  rarityScore: number; // 1-100
  estimatedValue: number; // EUR
  serialNumber?: string;
  provenance: string;
  imageUrl?: string;
  specifications: Record<string, string>;
}

const SAMPLE_ITEMS: Record<RetroTheme, ShowcaseItem> = {
  KENNER_1978: {
    id: 'kenner-bf-79',
    title: 'Boba Fett 21-Back Carded Figure',
    category: 'Action Figures & Toys',
    year: 1979,
    manufacturer: 'Kenner Toys Co.',
    condition: 'AFA 85 (NM+ Unpunched)',
    rarityScore: 96,
    estimatedValue: 4250,
    serialNumber: 'KNR-SW-7921-BF',
    provenance: 'Purchased from original estate collector in Cincinnati, OH (2018). Graded AFA Archival.',
    imageUrl: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=600&auto=format&fit=crop&q=80',
    specifications: {
      'Cardback': '21-Back Secret Offer',
      'Blister': 'Clear, zero yellowing',
      'Punch': 'Unpunched Mint',
      'Height': '3.75 Inches',
    },
  },
  VINYL_33RPM: {
    id: 'vinyl-md-59',
    title: 'Miles Davis – Kind of Blue (1st Pressing Mono)',
    category: 'Vinyl Records',
    year: 1959,
    manufacturer: 'Columbia Records (CL 1355)',
    condition: 'VG+ / VG+ (Deep Groove Six-Eye)',
    rarityScore: 92,
    estimatedValue: 1850,
    serialNumber: 'COL-CL1355-1B',
    provenance: 'Discovered at Paris flea market (Clignancourt). Verified matrix XLP47324-1B in dead wax.',
    imageUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&auto=format&fit=crop&q=80',
    specifications: {
      'Label': 'Six-Eye Red/Black Mono',
      'Matrix Runout': 'XLP47324-1B / XLP47325-1B',
      'Vinyl Weight': '180g Deep Groove Heavy Pressing',
      'Speed': '33 ⅓ RPM',
    },
  },
  GAMEBOY_1989: {
    id: 'gb-dmg-89',
    title: 'Nintendo Game Boy (DMG-01 Launch Edition)',
    category: 'Retro Gaming Consoles',
    year: 1989,
    manufacturer: 'Nintendo Co., Ltd.',
    condition: 'CIB - Box 9.0 / Console Mint',
    rarityScore: 89,
    estimatedValue: 980,
    serialNumber: 'G12498701',
    provenance: 'Acquired in Tokyo, Akihabara Mandarake. Original Japanese launch packaging with manual.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    specifications: {
      'Display': '2.6-inch Dot-Matrix LCD (160x144)',
      'Processor': 'Custom 8-bit Sharp LR35902',
      'Color Palette': '4 Shades of Olive Green',
      'Battery': '4x AA Batteries (30h playtime)',
    },
  },
  BRAUN_RAMS_1960: {
    id: 'braun-et66-87',
    title: 'Braun ET66 Control Calculator',
    category: 'Industrial Design Electronics',
    year: 1987,
    manufacturer: 'Braun AG (Dieter Rams & Dietrich Lubs)',
    condition: 'Mint in Original Hard Slipcase',
    rarityScore: 94,
    estimatedValue: 620,
    serialNumber: 'BRN-ET66-8704',
    provenance: 'Acquired from former Braun Kronberg design associate. Complete with protective slide cover.',
    imageUrl: 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=600&auto=format&fit=crop&q=80',
    specifications: {
      'Designers': 'Dieter Rams & Dietrich Lubs',
      'Ten Principles': 'Good design is unobtrusive & thorough down to the last detail',
      'Display': '8-Digit Liquid Crystal Display',
      'Buttons': 'Convex Soft-Touch Spherical Keys',
    },
  },
  STREETWEAR_CYBER_90S: {
    id: 'stussy-cyber-94',
    title: 'Stüssy Cyber-Tech Outerwear Jacket',
    category: 'Vintage Apparel',
    year: 1994,
    manufacturer: 'Stüssy Tribe International',
    condition: 'Grade A Vintage (Deadstock with Tags)',
    rarityScore: 88,
    estimatedValue: 750,
    serialNumber: 'STU-94-CYB-007',
    provenance: 'Archived from Soho NYC flagship basement storage. Original 1994 hangtag intact.',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    specifications: {
      'Material': 'Ballistic Nylon / Reflective Trim',
      'Fit': '90s Boxy Oversized',
      'Origin': 'Made in USA',
      'Hardware': 'Heavy Duty YKK Metal Zippers',
    },
  },
};

interface RetroThemeRendererProps {
  initialTheme?: RetroTheme;
  customItem?: ShowcaseItem;
  onThemeChange?: (theme: RetroTheme) => void;
}

export const RetroThemeRenderer: React.FC<RetroThemeRendererProps> = ({
  initialTheme = 'KENNER_1978',
  customItem,
  onThemeChange,
}) => {
  // ponytail: local theme selection state without external store boilerplate
  const [activeTheme, setActiveTheme] = useState<RetroTheme>(initialTheme);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SPECS' | 'PROVENANCE'>('OVERVIEW');
  const [isPlayingVinyl, setIsPlayingVinyl] = useState(false);

  const handleThemeSwitch = (theme: RetroTheme) => {
    setActiveTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const currentItem = customItem || SAMPLE_ITEMS[activeTheme];

  return (
    <div className={`w-full transition-all duration-300 theme-${activeTheme.toLowerCase().replace('_', '-')}`}>
      {/* Theme Switcher Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-300 pb-4 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Showcase Vault Theme:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'KENNER_1978', label: 'Kenner 1978', icon: '🚀' },
              { id: 'VINYL_33RPM', label: 'Vinyl 33 RPM', icon: '📻' },
              { id: 'GAMEBOY_1989', label: 'Game Boy 1989', icon: '👾' },
              { id: 'BRAUN_RAMS_1960', label: 'Braun 1960', icon: '📐' },
              { id: 'STREETWEAR_CYBER_90S', label: 'Cyber 90s', icon: '⚡' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSwitch(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all duration-150 flex items-center space-x-1.5 border ${
                activeTheme === t.id
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Theme Showcase Card */}
      {activeTheme === 'KENNER_1978' && (
        <div className="relative overflow-hidden rounded-xl border-4 border-yellow-400 bg-slate-950 p-6 text-white shadow-2xl">
          {/* Star Wars Kenner Style Header Banner */}
          <div className="mb-6 flex items-center justify-between border-b-2 border-red-600 pb-3">
            <div>
              <div className="text-xs font-black tracking-widest text-yellow-400 uppercase">★ VINTAGE ACTION VAULT ★</div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">{currentItem.title}</h2>
            </div>
            <div className="rounded-lg bg-red-600 px-3 py-1 text-center font-mono text-xs font-extrabold text-white shadow">
              KENNER TOYS
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Blister Bubble Image Frame */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group p-2 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 shadow-[0_0_25px_rgba(250,204,21,0.25)]">
                <div className="absolute top-3 right-3 z-10 rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  UNPUNCHED CARD
                </div>
                <div className="overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-900 w-64 h-64 flex items-center justify-center">
                  <img
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Spec Sheet & Value Breakdown */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 px-2.5 py-1">
                  ERA: {currentItem.year}
                </span>
                <span className="rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-1">
                  GRADE: {currentItem.condition}
                </span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1">
                  RARITY SCORE: {currentItem.rarityScore}/100
                </span>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-2">
                <div className="text-xs text-slate-400 font-mono">PROVENANCE RECORD</div>
                <p className="text-sm text-slate-200">{currentItem.provenance}</p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-yellow-400/10 border border-yellow-400/30 p-4">
                <div>
                  <div className="text-xs text-yellow-300 font-mono uppercase">ESTIMATED VAULT VALUE</div>
                  <div className="text-2xl font-black text-yellow-400">€{currentItem.estimatedValue.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">CATALOG ID</div>
                  <div className="text-xs font-mono font-bold text-slate-200">{currentItem.serialNumber}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTheme === 'VINYL_33RPM' && (
        <div className="relative overflow-hidden rounded-xl border border-amber-900/40 bg-stone-900 p-6 text-amber-50 shadow-2xl">
          {/* Vinyl Record Sleeve Header */}
          <div className="mb-6 flex items-center justify-between border-b border-amber-800/40 pb-3">
            <div>
              <span className="text-xs font-serif italic text-amber-400">High Fidelity 33 ⅓ RPM Archival Vault</span>
              <h2 className="text-2xl font-serif font-bold text-stone-100">{currentItem.title}</h2>
            </div>
            <button
              onClick={() => setIsPlayingVinyl(!isPlayingVinyl)}
              className="flex items-center space-x-2 rounded-full border border-amber-600/50 bg-amber-950/60 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900 transition-colors"
            >
              <span>{isPlayingVinyl ? '⏸ Pause Groove' : '▶ Play Vinyl Preview'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Vinyl Record Sleeve + Spinning Disc Graphic */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative flex items-center">
                {/* Vinyl Record Disc */}
                <div
                  className={`w-52 h-52 rounded-full bg-stone-950 border-4 border-stone-800 flex items-center justify-center shadow-lg transition-transform duration-1000 ${
                    isPlayingVinyl ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '3s' }}
                >
                  <div className="w-20 h-20 rounded-full bg-amber-600 flex items-center justify-center text-[9px] font-bold text-stone-950 text-center leading-tight">
                    STEREO
                    <br />
                    33 RPM
                  </div>
                </div>
                {/* Album Cover Art */}
                <div className="-ml-24 z-10 w-48 h-48 rounded-lg overflow-hidden border-2 border-stone-700 shadow-2xl">
                  <img src={currentItem.imageUrl} alt={currentItem.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Liner Notes & Provenance */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-serif">
                <span className="rounded bg-amber-900/60 text-amber-200 border border-amber-700/50 px-2.5 py-1">
                  RELEASE: {currentItem.year}
                </span>
                <span className="rounded bg-stone-800 text-stone-300 border border-stone-700 px-2.5 py-1">
                  {currentItem.condition}
                </span>
              </div>

              <div className="rounded-lg bg-stone-950/60 border border-stone-800 p-4 space-y-2 font-serif">
                <div className="text-xs text-amber-500 uppercase tracking-wider font-sans">ARCHIVAL LINER NOTES</div>
                <p className="text-sm text-stone-300 leading-relaxed">{currentItem.provenance}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-serif">
                {Object.entries(currentItem.specifications).map(([key, val]) => (
                  <div key={key} className="rounded bg-stone-800/40 p-2.5 border border-stone-700/40">
                    <div className="text-[10px] text-stone-400 uppercase">{key}</div>
                    <div className="text-xs font-semibold text-amber-300">{val}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-stone-800 pt-3">
                <span className="text-xs text-stone-400">ESTIMATED MARKET VALUE</span>
                <span className="text-xl font-serif font-bold text-amber-400">€{currentItem.estimatedValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTheme === 'GAMEBOY_1989' && (
        <div className="relative rounded-2xl border-4 border-emerald-900 bg-[#8b956d] p-6 text-[#0f380f] shadow-[6px_6px_0px_#0f380f]">
          {/* Game Boy DMG-01 LCD Screen Bezel Header */}
          <div className="mb-6 rounded-lg border-4 border-[#0f380f] bg-[#9bbc0f] p-4 shadow-inner">
            <div className="flex items-center justify-between border-b-2 border-[#0f380f] pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-600 border border-[#0f380f] animate-pulse"></div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0f380f]">DOT MATRIX WITH STEREO SOUND</span>
              </div>
              <span className="text-xs font-mono font-bold">DMG-01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 flex justify-center">
                <div className="w-48 h-48 rounded border-4 border-[#0f380f] overflow-hidden bg-[#8bac0f] p-2 flex items-center justify-center">
                  <img src={currentItem.imageUrl} alt={currentItem.title} className="w-full h-full object-cover filter contrast-125 sepia" />
                </div>
              </div>

              <div className="md:col-span-7 space-y-3 font-mono">
                <h2 className="text-xl font-black uppercase text-[#0f380f]">{currentItem.title}</h2>
                <div className="text-xs font-bold">MANUFACTURER: {currentItem.manufacturer}</div>
                <div className="text-xs">YEAR: {currentItem.year} | RARITY: {currentItem.rarityScore}/100</div>
                <div className="rounded bg-[#8bac0f] p-3 border-2 border-[#0f380f] text-xs">
                  PROVENANCE: {currentItem.provenance}
                </div>
                <div className="text-lg font-black text-[#0f380f]">VALUATION: €{currentItem.estimatedValue.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* D-Pad & Controls Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#0f380f] text-white flex items-center justify-center text-xs font-bold">A</div>
              <div className="w-8 h-8 rounded-full bg-[#0f380f] text-white flex items-center justify-center text-xs font-bold">B</div>
            </div>
            <div className="text-xs font-mono font-bold">SELECT • START</div>
          </div>
        </div>
      )}

      {activeTheme === 'BRAUN_RAMS_1960' && (
        <div className="relative rounded-lg border border-neutral-300 bg-neutral-50 p-8 text-neutral-900 shadow-sm">
          {/* Braun Dieter Rams Minimalist Layout */}
          <div className="mb-8 flex items-center justify-between border-b border-neutral-300 pb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">SYSTEM ARCHIVE / DES-60</div>
              <h2 className="text-2xl font-sans font-light tracking-tight text-neutral-900">{currentItem.title}</h2>
            </div>
            <div className="w-4 h-4 rounded-full bg-orange-600 shadow-sm"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6">
              <div className="overflow-hidden rounded border border-neutral-200 bg-white p-2">
                <img src={currentItem.imageUrl} alt={currentItem.title} className="w-full h-72 object-cover" />
              </div>
            </div>

            <div className="md:col-span-6 space-y-6 font-sans">
              <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 pb-4">
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">YEAR</div>
                  <div className="text-base font-medium">{currentItem.year}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">DESIGNATION</div>
                  <div className="text-base font-medium">{currentItem.category}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">CONDITION</div>
                  <div className="text-base font-medium">{currentItem.condition}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">RARITY RATING</div>
                  <div className="text-base font-medium">{currentItem.rarityScore} / 100</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-neutral-400 uppercase mb-1">PROVENANCE & DOCUMENTATION</div>
                <p className="text-xs text-neutral-600 leading-relaxed">{currentItem.provenance}</p>
              </div>

              <div className="rounded bg-neutral-100 p-4 border border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-500">APPRAISED VALUE</span>
                <span className="text-xl font-mono font-medium text-neutral-900">€{currentItem.estimatedValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTheme === 'STREETWEAR_CYBER_90S' && (
        <div className="relative overflow-hidden rounded-xl border-2 border-cyan-400 bg-slate-900 p-6 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <div className="mb-6 flex items-center justify-between border-b border-cyan-500/30 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-pink-500 tracking-widest">CYBER VINTAGE ARCHIVE 90S</span>
              <h2 className="text-2xl font-black text-cyan-300 uppercase tracking-wider">{currentItem.title}</h2>
            </div>
            <span className="rounded bg-pink-600 px-2.5 py-1 text-xs font-black text-white shadow-lg">
              90s AUTHENTIC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group rounded-xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                <img src={currentItem.imageUrl} alt={currentItem.title} className="w-64 h-64 object-cover" />
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-500 px-2.5 py-1">
                  YEAR: {currentItem.year}
                </span>
                <span className="rounded bg-pink-950 text-pink-300 border border-pink-500 px-2.5 py-1">
                  GRADE: {currentItem.condition}
                </span>
              </div>

              <div className="rounded bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
                <div className="text-[10px] text-cyan-400 uppercase mb-1">PROVENANCE LOG</div>
                {currentItem.provenance}
              </div>

              <div className="flex items-center justify-between rounded bg-gradient-to-r from-cyan-950 to-slate-950 p-4 border border-cyan-500/50">
                <span className="text-xs font-mono text-cyan-400">STREET MARKET ESTIMATE</span>
                <span className="text-2xl font-black text-pink-400">€{currentItem.estimatedValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
