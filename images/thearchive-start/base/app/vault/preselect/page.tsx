'use client';

import React, { useState } from 'react';
import { PreselectWizardUI, PreselectResult } from '@/components/wizard/PreselectWizardUI';
import { RetroThemeRenderer } from '@/components/showcase/RetroThemeRenderer';
import Link from 'next/link';

export default function VaultPreselectPage() {
  const [completedResult, setCompletedResult] = useState<PreselectResult | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">THE ARCHIVE VAULT</span>
            <h1 className="text-3xl font-extrabold text-white">2-Step AI Preselect & Retro Showcase</h1>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/vault/showcase"
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 border border-neutral-700"
            >
              Retro Themes Vault Showcase →
            </Link>
          </div>
        </div>

        {/* Wizard or Showcase Result */}
        {!completedResult ? (
          <PreselectWizardUI onComplete={(result) => setCompletedResult(result)} />
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-4 flex items-center justify-between text-emerald-300">
              <div className="text-sm font-bold">
                ✓ Item &quot;{completedResult.itemTitle}&quot; successfully appraised (€{completedResult.finalValuation.toLocaleString()}) and added to Retro Showcase Vault!
              </div>
              <button
                onClick={() => setCompletedResult(null)}
                className="px-3 py-1.5 rounded bg-emerald-500 text-neutral-950 text-xs font-extrabold hover:bg-emerald-400"
              >
                Scan Another Item
              </button>
            </div>

            {/* Showcase Card rendered with RetroThemeRenderer */}
            <RetroThemeRenderer
              initialTheme="KENNER_1978"
              customItem={{
                id: 'preselected-item-1',
                title: completedResult.itemTitle,
                category: completedResult.category,
                year: parseInt(completedResult.detectedEra) || 1980,
                manufacturer: 'Vintage Vault Verified',
                condition: `Score ${completedResult.conditionScore}% (Deep Verified)`,
                rarityScore: completedResult.rarityScore,
                estimatedValue: completedResult.finalValuation,
                serialNumber: `ARCH-${Date.now().toString().slice(-6)}`,
                provenance: `AI Preselected with ${completedResult.confidence}% confidence. Applied ${completedResult.selectedRepairs.length} value-add restoration treatments.`,
                imageUrl: completedResult.imageUrl,
                specifications: {
                  Category: completedResult.category,
                  SubCategory: completedResult.subCategory,
                  Era: completedResult.detectedEra,
                  'Repair Impact': `+€${completedResult.repairImpact}`,
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
