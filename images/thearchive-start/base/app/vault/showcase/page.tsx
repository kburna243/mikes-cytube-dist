'use client';

import React from 'react';
import { RetroThemeRenderer } from '@/components/showcase/RetroThemeRenderer';
import Link from 'next/link';

export default function VaultShowcasePage() {
  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">SHOWCASE VAULT</span>
            <h1 className="text-3xl font-extrabold text-white">Retro Theme Renderer Showcase</h1>
          </div>
          <Link
            href="/vault/preselect"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow"
          >
            ← 2-Step Preselect Wizard
          </Link>
        </div>

        <RetroThemeRenderer initialTheme="KENNER_1978" />
      </div>
    </div>
  );
}
